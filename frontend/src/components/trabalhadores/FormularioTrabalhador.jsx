import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { empresaService } from '../../services/empresaService';
import { setorService } from '../../services/setorService';
import { useAuth } from '../../context/AuthContext';

export const FormularioTrabalhador = ({ trabalhador, onClose, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    empresa_id: '',
    setor_id: '',
    nome: '',
    cpf: '',
    data_nascimento: '',
    cargo: '',
    funcao: '',
  });
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    carregarEmpresas();
    if (trabalhador) {
      setFormData({
        empresa_id: trabalhador.empresa_id || '',
        setor_id: trabalhador.setor_id || '',
        nome: trabalhador.nome || '',
        cpf: trabalhador.cpf || '',
        data_nascimento: trabalhador.data_nascimento ? trabalhador.data_nascimento.split('T')[0] : '',
        cargo: trabalhador.cargo || '',
        funcao: trabalhador.funcao || '',
      });
      if (trabalhador.empresa_id) {
        carregarSetores(trabalhador.empresa_id);
      }
    } else if (user.perfil !== 'administrador') {
      setFormData(prev => ({ ...prev, empresa_id: user.empresa_id }));
      carregarSetores(user.empresa_id);
    }
  }, [trabalhador, user]);

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

  const carregarSetores = async (empresaId) => {
    try {
      setLoadingSetores(true);
      const data = await setorService.listar({ empresa_id: empresaId, limit: 1000 });
      setSetores(data.data.filter(s => s.ativo));
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    } finally {
      setLoadingSetores(false);
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

    if (name === 'empresa_id') {
      setFormData(prev => ({ ...prev, [name]: formattedValue, setor_id: '' }));
      if (formattedValue) {
        carregarSetores(formattedValue);
      } else {
        setSetores([]);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    }

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
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar trabalhador:', error);
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
            {trabalhador ? 'Editar Trabalhador' : 'Novo Trabalhador'}
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
                disabled={!isAdmin || loadingEmpresas || trabalhador}
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

            {/* Setor */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setor
              </label>
              <select
                name="setor_id"
                value={formData.setor_id}
                onChange={handleChange}
                disabled={!formData.empresa_id || loadingSetores}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Selecione um setor (opcional)</option>
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.unidade_nome} - {setor.nome}
                  </option>
                ))}
              </select>
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
                placeholder="Nome completo do trabalhador"
              />
              {errors.nome && (
                <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
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

            {/* Data de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Nascimento
              </label>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Cargo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo
              </label>
              <input
                type="text"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Operador de Produção"
              />
            </div>

            {/* Função */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função
              </label>
              <input
                type="text"
                name="funcao"
                value={formData.funcao}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Montagem de Peças"
              />
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
              {loading ? 'Salvando...' : trabalhador ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};