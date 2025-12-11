import { useState, useEffect } from 'react';
import { X, AlertCircle, TrendingUp, XCircle } from 'lucide-react';
import { avaliacaoService } from '../../services/avaliacaoService';
import {
  SEVERIDADES,
  TEMPOS_EXPOSICAO,
  INTENSIDADES,
  calcularProbabilidade,
  calcularNivelRisco,
} from '../../utils/classificacaoRisco';

export const ModalClassificacaoRisco = ({ avaliacao, perigo, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    severidade: '',
    tempo_exposicao: '',
    intensidade: '',
    observacoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    // Se o perigo já tem classificação, preencher os dados
    if (perigo.severidade) {
      setFormData({
        severidade: perigo.severidade,
        tempo_exposicao: perigo.tempo_exposicao,
        intensidade: perigo.intensidade,
        observacoes: perigo.observacoes || '',
      });
    }
  }, [perigo]);

  useEffect(() => {
    // Calcular automaticamente quando houver dados suficientes
    if (formData.severidade && formData.tempo_exposicao && formData.intensidade) {
      const prob = calcularProbabilidade(formData.tempo_exposicao, formData.intensidade);
      const risco = calcularNivelRisco(formData.severidade, {
        tempo: formData.tempo_exposicao,
        intensidade: formData.intensidade,
      });

      setResultado({
        probabilidade: prob?.probabilidade,
        peso_probabilidade: prob?.peso,
        nivel: risco?.nivel,
        classificacao: risco?.classificacao,
        cor: risco?.cor,
      });
    } else {
      setResultado(null);
    }
  }, [formData.severidade, formData.tempo_exposicao, formData.intensidade]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.severidade) {
      newErrors.severidade = 'Selecione a severidade';
    }

    if (!formData.tempo_exposicao) {
      newErrors.tempo_exposicao = 'Selecione o tempo de exposição';
    }

    if (!formData.intensidade) {
      newErrors.intensidade = 'Selecione a intensidade';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função auxiliar: Pega o ID correto do perigo
  const getPerigoId = () => {
    return perigo.perigo_id;
  };

  const handleMarcarNaoIdentificado = async () => {
    if (!confirm('Confirma que este perigo NÃO foi identificado no ambiente de trabalho?')) {
      return;
    }

    setLoading(true);
    try {
      const perigoId = getPerigoId();
      
      if (!perigoId) {
        throw new Error('ID do perigo não encontrado. Verifique a estrutura do objeto.');
      }

      // Marca como NÃO identificado (false)
      await avaliacaoService.togglePerigo(
        avaliacao.id,
        perigoId,
        false
      );

      await onSave();
    } catch (error) {
      console.error('Erro ao marcar perigo:', error);
      alert(error.response?.data?.error || error.message || 'Erro ao marcar perigo');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const perigoId = getPerigoId();
      
      if (!perigoId) {
        console.error('❌ ERRO: ID do perigo não encontrado!');
        console.log('Objeto perigo:', perigo);
        throw new Error('ID do perigo não encontrado. Verifique o console para mais detalhes.');
      }

      console.log('✅ Usando perigoId:', perigoId);

      // Primeiro marca como identificado (true)
      await avaliacaoService.togglePerigo(
        avaliacao.id,
        perigoId,
        true
      );

      // Depois classifica o risco
      await avaliacaoService.classificarRisco(
        avaliacao.id,
        perigoId,
        formData
      );

      await onSave();
    } catch (error) {
      console.error('Erro ao classificar risco:', error);
      alert(error.response?.data?.error || error.message || 'Erro ao classificar risco');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Avaliação do Perigo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informação do Perigo */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full text-lg font-bold flex-shrink-0">
                {perigo.numero}
              </span>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{perigo.descricao}</p>
                <p className="text-sm text-gray-600 mt-1">Categoria: {perigo.categoria}</p>
              </div>
            </div>
          </div>

          {/* Decisão: Identificado ou Não */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-3">
              Este perigo foi identificado no ambiente de trabalho?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleMarcarNaoIdentificado}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Não, marcar como NÃO Identificado
              </button>
              <div className="flex-1 flex items-center justify-center px-4 py-3 bg-primary bg-opacity-10 border-2 border-primary text-primary rounded-lg">
                <p className="font-semibold">Sim, preencher classificação abaixo →</p>
              </div>
            </div>
          </div>

          {/* Severidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              1. Severidade *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SEVERIDADES.map((sev) => (
                <label
                  key={sev.value}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.severidade === sev.value
                      ? 'border-primary bg-primary bg-opacity-5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="severidade"
                    value={sev.value}
                    checked={formData.severidade === sev.value}
                    onChange={handleChange}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{sev.label}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${sev.color}`}>
                        Peso: {sev.peso}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.severidade && (
              <p className="text-red-500 text-sm mt-1">{errors.severidade}</p>
            )}
          </div>

          {/* Tempo de Exposição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              2. Tempo de Exposição *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TEMPOS_EXPOSICAO.map((tempo) => (
                <label
                  key={tempo.value}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.tempo_exposicao === tempo.value
                      ? 'border-primary bg-primary bg-opacity-5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="tempo_exposicao"
                    value={tempo.value}
                    checked={formData.tempo_exposicao === tempo.value}
                    onChange={handleChange}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{tempo.value}</p>
                    <p className="text-sm text-gray-600">{tempo.horas}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.tempo_exposicao && (
              <p className="text-red-500 text-sm mt-1">{errors.tempo_exposicao}</p>
            )}
          </div>

          {/* Intensidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              3. Intensidade da Exposição *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INTENSIDADES.map((int) => (
                <label
                  key={int.value}
                  className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.intensidade === int.value
                      ? 'border-primary bg-primary bg-opacity-5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="intensidade"
                    value={int.value}
                    checked={formData.intensidade === int.value}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <p className="font-semibold text-gray-900">{int.label}</p>
                </label>
              ))}
            </div>
            {errors.intensidade && (
              <p className="text-red-500 text-sm mt-1">{errors.intensidade}</p>
            )}
          </div>

          {/* Resultado Calculado */}
          {resultado && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Resultado da Classificação
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Probabilidade</p>
                  <p className="text-xl font-bold text-gray-900">{resultado.probabilidade}</p>
                  <p className="text-sm text-gray-500">Peso: {resultado.peso_probabilidade}</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Nível de Risco</p>
                  <p className="text-xl font-bold text-gray-900">{resultado.nivel?.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">
                    (Severidade × Probabilidade)
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Classificação</p>
                  <span className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${resultado.cor}`}>
                    {resultado.classificacao}
                  </span>
                </div>
              </div>

              {/* Alerta para riscos altos */}
              {resultado.nivel > 6 && (
                <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-semibold">Atenção: Risco {resultado.classificacao}</p>
                    <p className="mt-1">
                      Este nível de risco requer ações corretivas imediatas. 
                      Um plano de ação deverá ser elaborado.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Observações sobre o risco/ferramenta utilizada/resultados */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações sobre o risco/ferramenta utilizada/resultados (opcional)
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Informações sobre riscos identificados, ferramentas utilizadas ou resultados obtidos..."
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
              disabled={loading || !resultado}
            >
              {loading ? 'Salvando...' : 'Salvar como Identificado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
