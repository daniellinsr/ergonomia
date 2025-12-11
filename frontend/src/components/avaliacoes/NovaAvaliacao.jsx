import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { setorService } from '../../services/setorService';

export const NovaAvaliacao = ({ onClose, onSave }) => {
  const [setores, setSetores] = useState([]);
  const [searchSetor, setSearchSetor] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSetores, setLoadingSetores] = useState(true);
  const [formData, setFormData] = useState({
    setor_id: '',
    tipo_avaliacao: 'AEP',
    titulo: '',
    descricao: '',
    observacoes_gerais: '',
  });
  const [errors, setErrors] = useState({});
  const [setorSelecionado, setSetorSelecionado] = useState(null);

  useEffect(() => {
    carregarSetores();
  }, []);

  const carregarSetores = async () => {
    try {
      const data = await setorService.listar({ limit: 1000 });
      setSetores(data.data.filter(s => s.ativo));
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    } finally {
      setLoadingSetores(false);
    }
  };

  const handleSelectSetor = (setor) => {
    setSetorSelecionado(setor);
    setFormData(prev => ({
      ...prev,
      setor_id: setor.id,
    }));
    setErrors(prev => ({ ...prev, setor_id: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.setor_id) {
      newErrors.setor_id = 'Selecione um setor';
    }

    if (!formData.titulo || formData.titulo.trim().length < 3) {
      newErrors.titulo = 'O título deve ter pelo menos 3 caracteres';
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
      console.error('Erro ao criar avaliação:', error);
    } finally {
      setLoading(false);
    }
  };

  const setoresFiltrados = setores.filter(s =>
    s.nome.toLowerCase().includes(searchSetor.toLowerCase()) ||
    (s.unidade_nome && s.unidade_nome.toLowerCase().includes(searchSetor.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Nova Avaliação Ergonômica Preliminar
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seleção de Setor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setor a ser Avaliado *
            </label>

            {!setorSelecionado ? (
              <>
                {/* Campo de busca */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome do setor ou unidade..."
                    value={searchSetor}
                    onChange={(e) => setSearchSetor(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Lista de setores */}
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {loadingSetores ? (
                    <div className="p-4 text-center text-gray-500">
                      Carregando setores...
                    </div>
                  ) : setoresFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhum setor encontrado
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {setoresFiltrados.map((setor) => (
                        <button
                          key={setor.id}
                          type="button"
                          onClick={() => handleSelectSetor(setor)}
                          className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {setor.nome}
                              </p>
                              {setor.unidade_nome && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {setor.unidade_nome}
                                  {setor.empresa_nome && ` - ${setor.empresa_nome}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Setor selecionado */
              <div className="border border-primary rounded-lg p-4 bg-primary bg-opacity-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg">
                      {setorSelecionado.nome}
                    </p>
                    <div className="space-y-1 mt-2 text-sm text-gray-700">
                      {setorSelecionado.unidade_nome && (
                        <p>
                          <strong>Unidade:</strong> {setorSelecionado.unidade_nome}
                        </p>
                      )}
                      {setorSelecionado.descricao && (
                        <p>
                          <strong>Descrição:</strong> {setorSelecionado.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSetorSelecionado(null);
                      setFormData(prev => ({ ...prev, setor_id: '' }));
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {errors.setor_id && (
              <p className="text-red-500 text-sm mt-1">{errors.setor_id}</p>
            )}
          </div>

          {/* Título da Avaliação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título da Avaliação *
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: Avaliação ergonômica do posto de trabalho administrativo"
            />
            {errors.titulo && (
              <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Descreva o contexto da avaliação..."
            />
          </div>

          {/* Tipo de Avaliação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Avaliação
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.tipo_avaliacao === 'AEP'
                  ? 'border-primary bg-primary bg-opacity-5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="tipo_avaliacao"
                  value="AEP"
                  checked={formData.tipo_avaliacao === 'AEP'}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <p className="font-semibold text-gray-800">AEP</p>
                  <p className="text-sm text-gray-600">Avaliação Ergonômica Preliminar</p>
                </div>
              </label>

              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.tipo_avaliacao === 'Completa'
                  ? 'border-primary bg-primary bg-opacity-5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="tipo_avaliacao"
                  value="Completa"
                  checked={formData.tipo_avaliacao === 'Completa'}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <p className="font-semibold text-gray-800">Completa</p>
                  <p className="text-sm text-gray-600">Avaliação Ergonômica Completa</p>
                </div>
              </label>
            </div>
          </div>

          {/* Observações Gerais */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações Gerais (opcional)
            </label>
            <textarea
              name="observacoes_gerais"
              value={formData.observacoes_gerais}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Informações gerais sobre a avaliação..."
            />
          </div>

          {/* Botões */}
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
              {loading ? 'Criando...' : 'Iniciar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
