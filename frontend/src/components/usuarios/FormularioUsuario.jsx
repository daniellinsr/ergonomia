import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { empresaService } from '../../services/empresaService';
import { useAuth } from '../../context/AuthContext';

export const FormularioUsuario = ({ usuario, onClose, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    empresa_id: '',
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    tipo_profissional: '',
    perfil: 'usuario',
  });
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    carregarEmpresas();
    if (usuario) {
      setFormData({
        empresa_id: usuario.empresa_id || '',
        nome: usuario.nome || '',
        email: usuario.email || '',
        senha: '',
        cpf: usuario.cpf || '',
        tipo_profissional: usuario.tipo_profissional || '',
        perfil: usuario.perfil || 'usuario',
      });
    } else if (user.perfil !== 'administrador') {
      // Se não for admin, já preenche com a empresa do usuário logado
      setFormData(prev => ({ ...prev, empresa_id: user.empresa_id }));
    }
  }, [usuario, user]);

  const carregarEmpresas = async () => {
    try {
      const data = await empresaService.listar({ limit: 1000 });
      setEmpresas(data.data.filter(e => e.ativo));
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2');
    }
    return value;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.empresa_id) {
      newErrors.empresa_id = 'Empresa é obrigatória';
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!usuario && !formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha && formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      // Remove senha se estiver vazia no modo edição
      const dataToSend = { ...formData };
      if (usuario && !dataToSend.senha) {
        delete dataToSend.senha;
      }

      await onSave(dataToSend);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.perfil === 'administrador';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {usuario ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Empresa */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa *
              </label>
              <select
                name="empresa_id"
                value={formData.empresa_id}
                onChange={handleChange}
                disabled={!isAdmin || loadingEmpresas}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 ${
                  errors.empresa_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione uma empresa</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razao_social}
                  </option>
                ))}
              </select>
              {errors.empresa_id && (
                <p className="text-red-500 text-sm mt-1">{errors.empresa_id}</p>
              )}
            </div>

            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.nome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nome completo do usuário"
              />
              {errors.nome && (
                <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="usuario@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha {!usuario && '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.senha ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={usuario ? 'Deixe vazio para manter' : 'Mínimo 6 caracteres'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.senha && (
                <p className="text-red-500 text-sm mt-1">{errors.senha}</p>
              )}
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF
              </label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                maxLength={14}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.cpf ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="000.000.000-00"
              />
              {errors.cpf && (
                <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>
              )}
            </div>

            {/* Tipo Profissional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Profissional
              </label>
              <input
                type="text"
                name="tipo_profissional"
                value={formData.tipo_profissional}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Ergonomista, Médico do Trabalho"
              />
            </div>

            {/* Perfil */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Perfil de Acesso *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.perfil === 'usuario'
                    ? 'border-primary bg-primary bg-opacity-5'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="perfil"
                    value="usuario"
                    checked={formData.perfil === 'usuario'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">Usuário</p>
                    <p className="text-sm text-gray-600">Acesso padrão ao sistema</p>
                  </div>
                </label>

                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.perfil === 'administrador'
                    ? 'border-primary bg-primary bg-opacity-5'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="perfil"
                    value="administrador"
                    checked={formData.perfil === 'administrador'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">Administrador</p>
                    <p className="text-sm text-gray-600">Acesso total e gerenciamento</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : usuario ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};