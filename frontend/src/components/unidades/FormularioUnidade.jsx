import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { empresaService } from '../../services/empresaService';
import { useAuth } from '../../context/AuthContext';

export const FormularioUnidade = ({ unidade, onClose, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    empresa_id: '',
    nome: '',
    endereco: '',
  });
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    carregarEmpresas();
    if (unidade) {
      setFormData({
        empresa_id: unidade.empresa_id || '',
        nome: unidade.nome || '',
        endereco: unidade.endereco || '',
      });
    } else if (user.perfil !== 'administrador') {
      setFormData(prev => ({ ...prev, empresa_id: user.empresa_id }));
    }
  }, [unidade, user]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      console.error('Erro ao salvar unidade:', error);
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
            {unidade ? 'Editar Unidade' : 'Nova Unidade'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empresa *
            </label>
            <select
              name="empresa_id"
              value={formData.empresa_id}
              onChange={handleChange}
              disabled={!isAdmin || loadingEmpresas || unidade}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Unidade *
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.nome ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Matriz, Filial São Paulo, Unidade Centro"
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
            )}
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço
            </label>
            <textarea
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Rua, número, bairro, cidade - UF"
            />
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
              {loading ? 'Salvando...' : unidade ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
