import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCcw,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Circle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { avaliacaoService } from '../services/avaliacaoService';
import { ModalClassificacaoRisco } from '../components/avaliacoes/ModalClassificacaoRisco';
import { 
  agruparPerigosPorCategoria,
  getStatusColor,
  getStatusLabel
} from '../utils/classificacaoRisco';

export const PreencherAvaliacao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [avaliacao, setAvaliacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoriaExpandida, setCategoriaExpandida] = useState({
    'Biomecânicos': true,
    'Mobiliário/Equipamentos': false,
    'Organização/Cognitivo/Psicossocial': false,
    'Condições Físicas/Ambientais': false,
  });
  const [modalRiscoOpen, setModalRiscoOpen] = useState(false);
  const [perigoSelecionado, setPerigoSelecionado] = useState(null);

  useEffect(() => {
    carregarAvaliacao();
  }, [id]);

  const carregarAvaliacao = async () => {
    try {
      setLoading(true);
      const data = await avaliacaoService.buscarPorId(id);
      setAvaliacao(data.data);
    } catch (error) {
      console.error('Erro ao carregar avaliação:', error);
      alert('Erro ao carregar avaliação');
      navigate('/avaliacoes');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoria = (categoria) => {
    setCategoriaExpandida(prev => ({
      ...prev,
      [categoria]: !prev[categoria],
    }));
  };

  const handleAbrirModal = (perigo) => {
    setPerigoSelecionado(perigo);
    setModalRiscoOpen(true);
  };

  const handleSalvarClassificacao = async () => {
    await carregarAvaliacao();
    setModalRiscoOpen(false);
    setPerigoSelecionado(null);
  };

  const handleFinalizar = async () => {
    // Verificar se todos os perigos foram avaliados
    const perigosNaoAvaliados = avaliacao.perigos.filter(p => 
      p.identificado === null || p.identificado === undefined
    );

    if (perigosNaoAvaliados.length > 0) {
      alert(`Existem ${perigosNaoAvaliados.length} perigo(s) ainda não avaliado(s). Por favor, avalie todos antes de finalizar.`);
      return;
    }

    // Verificar se perigos identificados têm classificação
    const perigosIdentificados = avaliacao.perigos.filter(p => p.identificado === true);
    const perigosSemClassificacao = perigosIdentificados.filter(p => !p.severidade);

    if (perigosSemClassificacao.length > 0) {
      alert(`Existem ${perigosSemClassificacao.length} perigo(s) identificado(s) sem classificação de risco.`);
      return;
    }

    if (!confirm('Deseja finalizar esta avaliação?')) {
      return;
    }

    try {
      await avaliacaoService.finalizar(avaliacao.id);
      alert('Avaliação finalizada com sucesso!');
      navigate('/avaliacoes');
    } catch (error) {
      console.error('Erro ao finalizar avaliação:', error);
      alert('Erro ao finalizar avaliação');
    }
  };
  const handleReabrir = async () => {
    if (!confirm('Tem certeza que deseja reabrir esta avaliação para edição?')) {
      return;
    }

    try {
      await avaliacaoService.reabrir(avaliacao.id);
      alert('Avaliação reaberta com sucesso!');
      carregarAvaliacao(); // Recarregar a avaliação
    } catch (error) {
      console.error('Erro ao reabrir avaliação:', error);
      alert(error.response?.data?.error || 'Erro ao reabrir avaliação');
    }
  };


  // Função para obter ícone e cor do status do perigo
  const getStatusPerigo = (perigo) => {
    if (perigo.identificado === true) {
      // Identificado
      if (perigo.severidade) {
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          label: 'Identificado',
        };
      } else {
        return {
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          label: 'Sem Classificação',
        };
      }
    } else if (perigo.identificado === false) {
      // Não identificado
      return {
        icon: XCircle,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300',
        label: 'Não Identificado',
      };
    } else {
      // Não avaliado
      return {
        icon: Circle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        label: 'Não Avaliado',
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!avaliacao) {
    return null;
  }

  const perigosAgrupados = agruparPerigosPorCategoria(avaliacao.perigos);
  
  // Contadores
  const totalPerigos = avaliacao.perigos.length;
  const totalAvaliados = avaliacao.perigos.filter(p => p.identificado !== null && p.identificado !== undefined).length;
  const totalIdentificados = avaliacao.perigos.filter(p => p.identificado === true).length;
  const totalNaoIdentificados = avaliacao.perigos.filter(p => p.identificado === false).length;
  const totalClassificados = avaliacao.perigos.filter(p => p.identificado === true && p.severidade).length;
  
  const isConcluida = avaliacao.status === 'concluida';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={() => navigate('/avaliacoes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>

          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(avaliacao.status)}`}>
            {getStatusLabel(avaliacao.status)}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Avaliação Ergonômica Preliminar - {avaliacao.tipo_avaliacao}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Trabalhador</p>
            <p className="font-semibold text-gray-900">{avaliacao.trabalhador_nome}</p>
            {avaliacao.trabalhador_cpf && (
              <p className="text-sm text-gray-500">CPF: {avaliacao.trabalhador_cpf}</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600">Cargo/Função</p>
            <p className="font-semibold text-gray-900">
              {avaliacao.trabalhador_cargo || '-'}
            </p>
            {avaliacao.trabalhador_funcao && (
              <p className="text-sm text-gray-500">{avaliacao.trabalhador_funcao}</p>
            )}
          </div>

          {avaliacao.setor_nome && (
            <div>
              <p className="text-sm text-gray-600">Setor</p>
              <p className="font-semibold text-gray-900">{avaliacao.setor_nome}</p>
              {avaliacao.unidade_nome && (
                <p className="text-sm text-gray-500">{avaliacao.unidade_nome}</p>
              )}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600">Avaliador</p>
            <p className="font-semibold text-gray-900">{avaliacao.avaliador_nome}</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Total de Perigos</p>
            <p className="text-2xl font-bold text-gray-900">{totalPerigos}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">Avaliados</p>
            <p className="text-2xl font-bold text-blue-900">{totalAvaliados}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600">Identificados</p>
            <p className="text-2xl font-bold text-green-900">{totalIdentificados}</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600">Não Identificados</p>
            <p className="text-2xl font-bold text-gray-700">{totalNaoIdentificados}</p>
          </div>
        </div>

        {/* Progresso */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso da Avaliação</span>
            <span className="text-sm text-gray-600">
              {totalAvaliados} de {totalPerigos} perigos avaliados ({Math.round((totalAvaliados / totalPerigos) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(totalAvaliados / totalPerigos) * 100}%` }}
            />
          </div>
        </div>

        {/* Descrição */}
        {avaliacao.descricao && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Descrição</h3>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">{avaliacao.descricao}</p>
          </div>
        )}

        {/* Observações sobre o risco/ferramenta utilizada/resultados */}
        {avaliacao.observacoes_gerais && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">
              Observações sobre o risco/ferramenta utilizada/resultados
            </h3>
            <p className="text-sm text-amber-800 whitespace-pre-wrap">{avaliacao.observacoes_gerais}</p>
          </div>
        )}
      </div>

      {/* Lista de Perigos por Categoria */}
      <div className="space-y-4">
        {Object.entries(perigosAgrupados).map(([categoria, perigos]) => {
          const avaliadosCategoria = perigos.filter(p => p.identificado !== null && p.identificado !== undefined).length;
          const identificadosCategoria = perigos.filter(p => p.identificado === true).length;
          
          return (
            <div key={categoria} className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => toggleCategoria(categoria)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {categoriaExpandida[categoria] ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                  <h2 className="text-lg font-semibold text-gray-800">{categoria}</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">
                      {avaliadosCategoria}/{perigos.length} avaliados
                    </span>
                    {identificadosCategoria > 0 && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        {identificadosCategoria} identificados
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {categoriaExpandida[categoria] && (
                <div className="border-t border-gray-200 divide-y divide-gray-100">
                  {perigos.map((perigo) => {
                    const status = getStatusPerigo(perigo);
                    const StatusIcon = status.icon;

                    return (
                      <button
                        key={perigo.perigo_id}
                        onClick={() => !isConcluida && handleAbrirModal(perigo)}
                        disabled={isConcluida}
                        className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors disabled:cursor-not-allowed ${status.bgColor} border-l-4 ${status.borderColor}`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Ícone de Status */}
                          <StatusIcon className={`w-6 h-6 ${status.color} flex-shrink-0 mt-1`} />

                          {/* Conteúdo */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">
                                    {perigo.numero}
                                  </span>
                                  <p className="font-medium text-gray-900">{perigo.descricao}</p>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    status.label === 'Não Avaliado'
                                      ? 'bg-red-100 text-red-700'
                                      : `${status.color.replace('text-', 'bg-').replace('600', '100')} ${status.color}`
                                  }`}>
                                    {status.label}
                                  </span>
                                </div>

                                {/* Classificação de Risco (se identificado) */}
                                {perigo.identificado === true && perigo.severidade && (
                                  <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                                      <div>
                                        <p className="text-gray-600 text-xs">Severidade</p>
                                        <p className="font-semibold text-gray-900 text-xs">{perigo.severidade}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-600 text-xs">Tempo</p>
                                        <p className="font-semibold text-gray-900 text-xs">{perigo.tempo_exposicao}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-600 text-xs">Intensidade</p>
                                        <p className="font-semibold text-gray-900 text-xs">{perigo.intensidade}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-600 text-xs">Probabilidade</p>
                                        <p className="font-semibold text-gray-900 text-xs">{perigo.probabilidade}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-600 text-xs">Risco</p>
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                          perigo.nivel_risco <= 1 ? 'bg-green-100 text-green-800' :
                                          perigo.nivel_risco <= 3 ? 'bg-blue-100 text-blue-800' :
                                          perigo.nivel_risco <= 6 ? 'bg-yellow-100 text-yellow-800' :
                                          perigo.nivel_risco <= 12 ? 'bg-orange-100 text-orange-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {perigo.classificacao_final}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botões de Ação */}
      {!isConcluida && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={() => navigate('/avaliacoes')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Salvar e Sair
            </button>
            <button
              onClick={handleFinalizar}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={totalAvaliados !== totalPerigos}
            >
              <CheckCircle className="w-5 h-5 inline-block mr-2" />
              Finalizar Avaliação
            </button>
          </div>
          {totalAvaliados !== totalPerigos && (
            <p className="text-sm text-orange-600 text-right mt-2">
              Avalie todos os {totalPerigos} perigos antes de finalizar ({totalPerigos - totalAvaliados} pendentes)
            </p>
          )}
        </div>
      )}

      {/* Botão de Reabrir para Edição */}
      {isConcluida && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={() => navigate('/avaliacoes')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleReabrir}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              Reabrir para Edição
            </button>
          </div>
          <p className="text-sm text-gray-600 text-right mt-2">
            A avaliação poderá ser editada novamente após reabrir
          </p>
        </div>
      )}

      {/* Modal de Classificação de Risco */}
      {modalRiscoOpen && perigoSelecionado && (
        <ModalClassificacaoRisco
          avaliacao={avaliacao}
          perigo={perigoSelecionado}
          onClose={() => {
            setModalRiscoOpen(false);
            setPerigoSelecionado(null);
          }}
          onSave={handleSalvarClassificacao}
        />
      )}
    </div>
  );
};