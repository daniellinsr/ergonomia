import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { unidadeService } from '../../services/unidadeService';
import { useAuth } from '../../context/AuthContext';

export const FormularioSetor = ({ setor, onClose, onSave, unidadePreSelecionada }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    unidade_id: '',
    nome: '',
    descricao: '',
  });
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    carregarUnidades();
    if (setor) {
      setFormData({
        unidade_id: setor.unidade_id || '',
        nome: setor.nome || '',
        descricao: setor.descricao || '',
      });
    } else if (unidadePreSelecionada) {
      setFormData(prev => ({ ...prev, unidade_id: unidadePreSelecionada }));
    }
  }, [setor, unidadePreSelecionada]);

  const carregarUnidades = async () => {
    try {
      const data = await unidadeService.listar({ limit: 1000 });
      setUnidades(data.data.filter(u => u.ativo));
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    } finally {
      setLoadingUnidades(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.unidade_id) {
      newErrors.unidade_id = 'Unidade é obrigatória';
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
      console.error('Erro ao salvar setor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {setor ? 'Editar Setor' : 'Novo Setor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Unidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidade *
            </label>
            <select
              name="unidade_id"
              value={formData.unidade_id}
              onChange={handleChange}
              disabled={loadingUnidades || setor}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 ${
                errors.unidade_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione uma unidade</option>
              {unidades.map((unidade) => (
                <option key={unidade.id} value={unidade.id}>
                  {unidade.nome} - {unidade.razao_social}
                </option>
              ))}
            </select>
            {errors.unidade_id && (
              <p className="text-red-500 text-sm mt-1">{errors.unidade_id}</p>
            )}
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Setor *
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.nome ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Produção, Administrativo, RH"
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Descrição do setor e suas atividades"
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
              {loading ? 'Salvando...' : setor ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};