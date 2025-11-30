import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { trabalhadorService } from '../../services/trabalhadorService';
import { setorService } from '../../services/setorService';
import { useAuth } from '../../context/AuthContext';

export const NovaAvaliacao = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [trabalhadores, setTrabalhadores] = useState([]);
  const [setores, setSetores] = useState([]);
  const [searchTrabalhador, setSearchTrabalhador] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTrabalhadores, setLoadingTrabalhadores] = useState(true);
  const [formData, setFormData] = useState({
    trabalhador_id: '',
    setor_id: '',
    tipo_avaliacao: 'AEP',
    observacoes_gerais: '',
  });
  const [errors, setErrors] = useState({});
  const [trabalhadorSelecionado, setTrabalhadorSelecionado] = useState(null);

  useEffect(() => {
    carregarTrabalhadores();
    carregarSetores();
  }, []);

  const carregarTrabalhadores = async () => {
    try {
      const data = await trabalhadorService.listar({ limit: 1000 });
      setTrabalhadores(data.data.filter(t => t.ativo));
    } catch (error) {
      console.error('Erro ao carregar trabalhadores:', error);
    } finally {
      setLoadingTrabalhadores(false);
    }
  };

  const carregarSetores = async () => {
    try {
      const data = await setorService.listar({ limit: 1000 });
      setSetores(data.data.filter(s => s.ativo));
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const handleSelectTrabalhador = (trabalhador) => {
    setTrabalhadorSelecionado(trabalhador);
    setFormData(prev => ({
      ...prev,
      trabalhador_id: trabalhador.id,
      setor_id: trabalhador.setor_id || '',
    }));
    setErrors(prev => ({ ...prev, trabalhador_id: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.trabalhador_id) {
      newErrors.trabalhador_id = 'Selecione um trabalhador';
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

  const trabalhadoresFiltrados = trabalhadores.filter(t => 
    t.nome.toLowerCase().includes(searchTrabalhador.toLowerCase()) ||
    (t.cpf && t.cpf.includes(searchTrabalhador)) ||
    (t.cargo && t.cargo.toLowerCase().includes(searchTrabalhador.toLowerCase()))
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
          {/* Seleção de Trabalhador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trabalhador a ser Avaliado *
            </label>
            
            {!trabalhadorSelecionado ? (
              <>
                {/* Campo de busca */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou cargo..."
                    value={searchTrabalhador}
                    onChange={(e) => setSearchTrabalhador(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Lista de trabalhadores */}
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {loadingTrabalhadores ? (
                    <div className="p-4 text-center text-gray-500">
                      Carregando trabalhadores...
                    </div>
                  ) : trabalhadoresFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhum trabalhador encontrado
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {trabalhadoresFiltrados.map((trabalhador) => (
                        <button
                          key={trabalhador.id}
                          type="button"
                          onClick={() => handleSelectTrabalhador(trabalhador)}
                          className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {trabalhador.nome}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                {trabalhador.cpf && <span>CPF: {trabalhador.cpf}</span>}
                                {trabalhador.cargo && <span>• {trabalhador.cargo}</span>}
                              </div>
                              {trabalhador.setor_nome && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {trabalhador.setor_nome}
                                  {trabalhador.unidade_nome && ` - ${trabalhador.unidade_nome}`}
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
              /* Trabalhador selecionado */
              <div className="border border-primary rounded-lg p-4 bg-primary bg-opacity-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg">
                      {trabalhadorSelecionado.nome}
                    </p>
                    <div className="space-y-1 mt-2 text-sm text-gray-700">
                      {trabalhadorSelecionado.cpf && (
                        <p><strong>CPF:</strong> {trabalhadorSelecionado.cpf}</p>
                      )}
                      {trabalhadorSelecionado.cargo && (
                        <p><strong>Cargo:</strong> {trabalhadorSelecionado.cargo}</p>
                      )}
                      {trabalhadorSelecionado.funcao && (
                        <p><strong>Função:</strong> {trabalhadorSelecionado.funcao}</p>
                      )}
                      {trabalhadorSelecionado.setor_nome && (
                        <p>
                          <strong>Setor:</strong> {trabalhadorSelecionado.setor_nome}
                          {trabalhadorSelecionado.unidade_nome && 
                            ` - ${trabalhadorSelecionado.unidade_nome}`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTrabalhadorSelecionado(null);
                      setFormData(prev => ({ ...prev, trabalhador_id: '', setor_id: '' }));
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            
            {errors.trabalhador_id && (
              <p className="text-red-500 text-sm mt-1">{errors.trabalhador_id}</p>
            )}
          </div>

          {/* Setor (opcional, pode substituir o setor do trabalhador) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setor da Avaliação (opcional)
            </label>
            <select
              name="setor_id"
              value={formData.setor_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Usar setor do trabalhador</option>
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.unidade_nome} - {setor.nome}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Deixe em branco para usar o setor vinculado ao trabalhador
            </p>
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
              placeholder="Informações adicionais sobre a avaliação..."
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