import { useState, useEffect } from 'react';
import planosService from '../services/planosService';
import { 
  PlusCircle, Edit2, Trash2, CheckCircle, XCircle, 
  Clock, FileText, AlertTriangle, Target 
} from 'lucide-react';

export function PlanosAcao() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Estados para listas
  const [planos5w2h, setPlanos5w2h] = useState([]);
  const [stats5w2h, setStats5w2h] = useState(null);
  const [acoesCorretivas, setAcoesCorretivas] = useState([]);
  const [statsAcoes, setStatsAcoes] = useState(null);
  const [ciclosPDCA, setCiclosPDCA] = useState([]);
  const [statsPDCA, setStatsPDCA] = useState(null);
  
  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Estados individuais do formulário - 5W2H
  const [titulo, setTitulo] = useState('');
  const [what, setWhat] = useState('');
  const [why, setWhy] = useState('');
  const [who, setWho] = useState('');
  const [whenDate, setWhenDate] = useState('');
  const [whereLocation, setWhereLocation] = useState('');
  const [how, setHow] = useState('');
  const [howMuch, setHowMuch] = useState('');
  
  // Estados individuais - Ação Corretiva
  const [descricaoProblema, setDescricaoProblema] = useState('');
  const [causaRaiz, setCausaRaiz] = useState('');
  const [acaoCorretiva, setAcaoCorretiva] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [prazo, setPrazo] = useState('');
  const [categoria, setCategoria] = useState('ergonomia');
  
  // Estados individuais - PDCA
  const [plan, setPlan] = useState('');
  const [doo, setDoo] = useState('');
  const [checkPhase, setCheckPhase] = useState('');
  const [act, setAct] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [faseAtual, setFaseAtual] = useState('plan');
  
  // Estados compartilhados
  const [prioridade, setPrioridade] = useState('media');
  const [status, setStatus] = useState('pendente');
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarPlanos5w2h(),
        carregarAcoesCorretivas(),
        carregarCiclosPDCA(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const carregarPlanos5w2h = async () => {
    try {
      const [response, statsResponse] = await Promise.all([
        planosService.planos5w2h.listar({ limit: 100 }),
        planosService.planos5w2h.estatisticas(),
      ]);
      setPlanos5w2h(response.data.planos || []);
      setStats5w2h(statsResponse.data);
    } catch (error) {
      console.error('Erro ao carregar planos 5W2H:', error);
    }
  };

  const carregarAcoesCorretivas = async () => {
    try {
      const [response, statsResponse] = await Promise.all([
        planosService.acoesCorretivas.listar({ limit: 100 }),
        planosService.acoesCorretivas.estatisticas(),
      ]);
      setAcoesCorretivas(response.data.acoes || []);
      setStatsAcoes(statsResponse.data);
    } catch (error) {
      console.error('Erro ao carregar ações corretivas:', error);
    }
  };

  const carregarCiclosPDCA = async () => {
    try {
      const [response, statsResponse] = await Promise.all([
        planosService.ciclosPDCA.listar({ limit: 100 }),
        planosService.ciclosPDCA.estatisticas(),
      ]);
      setCiclosPDCA(response.data.ciclos || []);
      setStatsPDCA(statsResponse.data);
    } catch (error) {
      console.error('Erro ao carregar ciclos PDCA:', error);
    }
  };

  const limparFormulario = () => {
    setTitulo('');
    setWhat('');
    setWhy('');
    setWho('');
    setWhenDate('');
    setWhereLocation('');
    setHow('');
    setHowMuch('');
    setDescricaoProblema('');
    setCausaRaiz('');
    setAcaoCorretiva('');
    setResponsavel('');
    setPrazo('');
    setCategoria('ergonomia');
    setPlan('');
    setDoo('');
    setCheckPhase('');
    setAct('');
    setDataInicio('');
    setFaseAtual('plan');
    setPrioridade('media');
    setStatus('pendente');
    setProgresso(0);
  };

  const formatarData = (data) => {
    if (!data) return '';
    return data.split('T')[0];
  };

  const abrirModal = (tipo, item = null) => {
    limparFormulario();
    setModalType(tipo);
    setSelectedItem(item);
    
    if (item) {
      setTitulo(item.titulo || '');
      setPrioridade(item.prioridade || 'media');
      setStatus(item.status || 'pendente');
      setProgresso(item.progresso || 0);
      
      if (tipo === '5w2h') {
        setWhat(item.what || '');
        setWhy(item.why || '');
        setWho(item.who || '');
        setWhenDate(formatarData(item.when_date));
        setWhereLocation(item.where_location || '');
        setHow(item.how || '');
        setHowMuch(item.how_much || '');
      } else if (tipo === 'acao') {
        setDescricaoProblema(item.descricao_problema || '');
        setCausaRaiz(item.causa_raiz || '');
        setAcaoCorretiva(item.acao_corretiva || '');
        setResponsavel(item.responsavel || '');
        setPrazo(formatarData(item.prazo));
        setCategoria(item.categoria || 'ergonomia');
      } else if (tipo === 'pdca') {
        setPlan(item.plan || '');
        setDoo(item.doo || '');
        setCheckPhase(item.check_phase || '');
        setAct(item.act || '');
        setResponsavel(item.responsavel || '');
        setDataInicio(formatarData(item.data_inicio));
        setFaseAtual(item.fase_atual || 'plan');
      }
    } else {
      if (tipo === 'pdca') {
        setStatus('andamento');
        setProgresso(25);
      }
    }
    
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setModalType(null);
    setSelectedItem(null);
    limparFormulario();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      let dados = {};
      
      if (modalType === '5w2h') {
        dados = {
          titulo,
          what,
          why,
          who,
          when_date: whenDate,
          where_location: whereLocation,
          how,
          how_much: howMuch,
          prioridade,
          status,
          progresso,
        };
        
        if (selectedItem) {
          await planosService.planos5w2h.atualizar(selectedItem.id, dados);
        } else {
          await planosService.planos5w2h.criar(dados);
        }
        await carregarPlanos5w2h();
        
      } else if (modalType === 'acao') {
        dados = {
          titulo,
          descricao_problema: descricaoProblema,
          causa_raiz: causaRaiz,
          acao_corretiva: acaoCorretiva,
          responsavel,
          prazo,
          categoria,
          prioridade,
          status,
          progresso,
        };
        
        if (selectedItem) {
          await planosService.acoesCorretivas.atualizar(selectedItem.id, dados);
        } else {
          await planosService.acoesCorretivas.criar(dados);
        }
        await carregarAcoesCorretivas();
        
      } else if (modalType === 'pdca') {
        dados = {
          titulo,
          plan,
          doo,
          check_phase: checkPhase,
          act,
          responsavel,
          data_inicio: dataInicio,
          fase_atual: faseAtual,
          status,
          progresso,
        };
        
        if (selectedItem) {
          await planosService.ciclosPDCA.atualizar(selectedItem.id, dados);
        } else {
          await planosService.ciclosPDCA.criar(dados);
        }
        await carregarCiclosPDCA();
      }
      
      fecharModal();
      alert('Salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      const mensagem = error.response?.data?.error || error.response?.data?.message || 'Erro ao salvar';
      alert(`Erro: ${mensagem}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tipo, id) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    
    try {
      setLoading(true);
      if (tipo === '5w2h') {
        await planosService.planos5w2h.excluir(id);
        await carregarPlanos5w2h();
      } else if (tipo === 'acao') {
        await planosService.acoesCorretivas.excluir(id);
        await carregarAcoesCorretivas();
      } else if (tipo === 'pdca') {
        await planosService.ciclosPDCA.excluir(id);
        await carregarCiclosPDCA();
      }
      alert('Excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (tipo, id) => {
    const novoProgresso = prompt('Digite o progresso (0-100):');
    if (novoProgresso === null) return;
    
    const valor = parseInt(novoProgresso);
    if (isNaN(valor) || valor < 0 || valor > 100) {
      alert('Valor inválido');
      return;
    }
    
    try {
      setLoading(true);
      if (tipo === '5w2h') {
        await planosService.planos5w2h.atualizarProgresso(id, { progresso: valor });
        await carregarPlanos5w2h();
      } else if (tipo === 'acao') {
        await planosService.acoesCorretivas.atualizarProgresso(id, { progresso: valor });
        await carregarAcoesCorretivas();
      } else if (tipo === 'pdca') {
        await planosService.ciclosPDCA.atualizarProgresso(id, { progresso: valor });
        await carregarCiclosPDCA();
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      alert('Erro ao atualizar progresso');
    } finally {
      setLoading(false);
    }
  };

  const handleAvancarFase = async (id) => {
    try {
      setLoading(true);
      await planosService.ciclosPDCA.avancarFase(id);
      await carregarCiclosPDCA();
      alert('Fase avançada com sucesso!');
    } catch (error) {
      console.error('Erro ao avançar fase:', error);
      alert('Erro ao avançar fase');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const cores = {
      pendente: 'bg-yellow-100 text-yellow-800',
      andamento: 'bg-blue-100 text-blue-800',
      concluido: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
    };
    return cores[status] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade) => {
    const cores = {
      baixa: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-red-100 text-red-800',
    };
    return cores[prioridade] || 'bg-gray-100 text-gray-800';
  };

  const getFaseColor = (fase) => {
    const cores = {
      plan: 'bg-blue-100 text-blue-800',
      do: 'bg-green-100 text-green-800',
      check: 'bg-yellow-100 text-yellow-800',
      act: 'bg-purple-100 text-purple-800',
    };
    return cores[fase] || 'bg-gray-100 text-gray-800';
  };

  const traduzirStatus = (status) => {
    const traducoes = {
      pendente: 'Pendente',
      andamento: 'Em Andamento',
      concluido: 'Concluído',
      cancelado: 'Cancelado',
    };
    return traducoes[status] || status;
  };

  const traduzirPrioridade = (prioridade) => {
    const traducoes = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
    };
    return traducoes[prioridade] || prioridade;
  };

  const traduzirFase = (fase) => {
    const traducoes = {
      plan: 'Plan',
      do: 'Do',
      check: 'Check',
      act: 'Act',
    };
    return traducoes[fase] || fase;
  };

  const traduzirCategoria = (categoria) => {
    const traducoes = {
      ergonomia: 'Ergonomia',
      equipamento: 'Equipamento',
      processo: 'Processo',
      treinamento: 'Treinamento',
      organizacao: 'Organização',
    };
    return traducoes[categoria] || categoria;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Planos de Ação</h1>
        <p className="text-gray-600 mt-2">Gestão de 5W2H, Ações Corretivas e Ciclos PDCA</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Dashboard
            </div>
          </button>
          <button
            onClick={() => setActiveTab('5w2h')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === '5w2h'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Planos 5W2H
            </div>
          </button>
          <button
            onClick={() => setActiveTab('acoes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'acoes'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Ações Corretivas
            </div>
          </button>
          <button
            onClick={() => setActiveTab('pdca')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pdca'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Ciclos PDCA
            </div>
          </button>
        </nav>
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planos 5W2H</p>
                  <p className="text-3xl font-bold">{stats5w2h?.total || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats5w2h?.em_andamento || 0} em andamento</p>
                </div>
                <FileText className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ações Corretivas</p>
                  <p className="text-3xl font-bold">{statsAcoes?.total || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">{statsAcoes?.alta_prioridade || 0} alta prioridade</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ciclos PDCA</p>
                  <p className="text-3xl font-bold">{statsPDCA?.total || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">{statsPDCA?.em_andamento || 0} em andamento</p>
                </div>
                <Target className="w-12 h-12 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Concluído</p>
                  <p className="text-3xl font-bold">
                    {(parseInt(stats5w2h?.concluidos || 0) + 
                      parseInt(statsAcoes?.concluidos || 0) + 
                      parseInt(statsPDCA?.concluidos || 0))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Todos os planos</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">5W2H por Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Pendentes:</span>
                  <span className="font-semibold">{stats5w2h?.pendentes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Em Andamento:</span>
                  <span className="font-semibold">{stats5w2h?.em_andamento || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Concluídos:</span>
                  <span className="font-semibold">{stats5w2h?.concluidos || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Ações por Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Pendentes:</span>
                  <span className="font-semibold">{statsAcoes?.pendentes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Em Andamento:</span>
                  <span className="font-semibold">{statsAcoes?.em_andamento || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Concluídos:</span>
                  <span className="font-semibold">{statsAcoes?.concluidos || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">PDCA por Fase</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-semibold">{statsPDCA?.fase_plan || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Do:</span>
                  <span className="font-semibold">{statsPDCA?.fase_do || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check:</span>
                  <span className="font-semibold">{statsPDCA?.fase_check || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Act:</span>
                  <span className="font-semibold">{statsPDCA?.fase_act || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Planos 5W2H */}
      {activeTab === '5w2h' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Planos 5W2H</h2>
            <button
              onClick={() => abrirModal('5w2h')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <PlusCircle className="w-5 h-5" />
              Novo Plano 5W2H
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planos5w2h.map((plano) => (
              <div key={plano.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{plano.titulo}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => abrirModal('5w2h', plano)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete('5w2h', plano.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getPrioridadeColor(plano.prioridade)}`}>
                      {traduzirPrioridade(plano.prioridade)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(plano.status)}`}>
                      {traduzirStatus(plano.status)}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Responsável: {plano.who}</p>
                    <p className="text-gray-600">Prazo: {new Date(plano.when_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progresso</span>
                      <span>{plano.progresso}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${plano.progresso}%` }}
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleUpdateProgress('5w2h', plano.id)}
                    className="w-full mt-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                  >
                    Atualizar Progresso
                  </button>
                </div>
              </div>
            ))}
          </div>

          {planos5w2h.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum plano 5W2H cadastrado</p>
            </div>
          )}
        </div>
      )}

      {/* Ações Corretivas */}
      {activeTab === 'acoes' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Ações Corretivas</h2>
            <button
              onClick={() => abrirModal('acao')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <PlusCircle className="w-5 h-5" />
              Nova Ação Corretiva
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {acoesCorretivas.map((acao) => (
              <div key={acao.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{acao.titulo}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => abrirModal('acao', acao)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete('acao', acao.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs ${getPrioridadeColor(acao.prioridade)}`}>
                      {traduzirPrioridade(acao.prioridade)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(acao.status)}`}>
                      {traduzirStatus(acao.status)}
                    </span>
                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                      {traduzirCategoria(acao.categoria)}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Responsável: {acao.responsavel}</p>
                    <p className="text-gray-600">Prazo: {new Date(acao.prazo).toLocaleDateString('pt-BR')}</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progresso</span>
                      <span>{acao.progresso}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${acao.progresso}%` }}
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleUpdateProgress('acao', acao.id)}
                    className="w-full mt-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                  >
                    Atualizar Progresso
                  </button>
                </div>
              </div>
            ))}
          </div>

          {acoesCorretivas.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma ação corretiva cadastrada</p>
            </div>
          )}
        </div>
      )}

      {/* Ciclos PDCA */}
      {activeTab === 'pdca' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Ciclos PDCA</h2>
            <button
              onClick={() => abrirModal('pdca')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <PlusCircle className="w-5 h-5" />
              Novo Ciclo PDCA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ciclosPDCA.map((ciclo) => (
              <div key={ciclo.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{ciclo.titulo}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => abrirModal('pdca', ciclo)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete('pdca', ciclo.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs ${getFaseColor(ciclo.fase_atual)}`}>
                      Fase: {traduzirFase(ciclo.fase_atual)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(ciclo.status)}`}>
                      {traduzirStatus(ciclo.status)}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Responsável: {ciclo.responsavel}</p>
                    <p className="text-gray-600">Início: {new Date(ciclo.data_inicio).toLocaleDateString('pt-BR')}</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progresso</span>
                      <span>{ciclo.progresso}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${ciclo.progresso}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {ciclo.fase_atual !== 'act' && (
                      <button
                        onClick={() => handleAvancarFase(ciclo.id)}
                        className="flex-1 px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-xs"
                      >
                        Avançar Fase
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateProgress('pdca', ciclo.id)}
                      className="flex-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                    >
                      Atualizar Progresso
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {ciclosPDCA.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum ciclo PDCA cadastrado</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedItem ? 'Editar' : 'Novo'}{' '}
                  {modalType === '5w2h' && 'Plano 5W2H'}
                  {modalType === 'acao' && 'Ação Corretiva'}
                  {modalType === 'pdca' && 'Ciclo PDCA'}
                </h2>
                <button onClick={fecharModal} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Formulário 5W2H */}
                {modalType === '5w2h' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          WHAT - O que será feito? *
                        </label>
                        <textarea
                          value={what}
                          onChange={(e) => setWhat(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows="3"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          WHY - Por que será feito? *
                        </label>
                        <textarea
                          value={why}
                          onChange={(e) => setWhy(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows="3"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          WHO - Quem fará? *
                        </label>
                        <input
                          type="text"
                          value={who}
                          onChange={(e) => setWho(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          WHEN - Quando será feito? *
                        </label>
                        <input
                          type="date"
                          value={whenDate}
                          onChange={(e) => setWhenDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          WHERE - Onde será feito? *
                        </label>
                        <input
                          type="text"
                          value={whereLocation}
                          onChange={(e) => setWhereLocation(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          HOW - Como será feito? *
                        </label>
                        <textarea
                          value={how}
                          onChange={(e) => setHow(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows="3"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          HOW MUCH - Quanto custará? *
                        </label>
                        <input
                          type="text"
                          value={howMuch}
                          onChange={(e) => setHowMuch(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prioridade *
                        </label>
                        <select
                          value={prioridade}
                          onChange={(e) => setPrioridade(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="baixa">Baixa</option>
                          <option value="media">Média</option>
                          <option value="alta">Alta</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status *
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="pendente">Pendente</option>
                          <option value="andamento">Em Andamento</option>
                          <option value="concluido">Concluído</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Progresso (0-100) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={progresso}
                          onChange={(e) => setProgresso(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulário Ação Corretiva */}
                {modalType === 'acao' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição do Problema *
                      </label>
                      <textarea
                        value={descricaoProblema}
                        onChange={(e) => setDescricaoProblema(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows="3"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Causa Raiz *
                      </label>
                      <textarea
                        value={causaRaiz}
                        onChange={(e) => setCausaRaiz(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows="3"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ação Corretiva *
                      </label>
                      <textarea
                        value={acaoCorretiva}
                        onChange={(e) => setAcaoCorretiva(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows="3"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Responsável *
                        </label>
                        <input
                          type="text"
                          value={responsavel}
                          onChange={(e) => setResponsavel(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prazo *
                        </label>
                        <input
                          type="date"
                          value={prazo}
                          onChange={(e) => setPrazo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Categoria *
                        </label>
                        <select
                          value={categoria}
                          onChange={(e) => setCategoria(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="ergonomia">Ergonomia</option>
                          <option value="equipamento">Equipamento</option>
                          <option value="processo">Processo</option>
                          <option value="treinamento">Treinamento</option>
                          <option value="organizacao">Organização</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prioridade *
                        </label>
                        <select
                          value={prioridade}
                          onChange={(e) => setPrioridade(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="baixa">Baixa</option>
                          <option value="media">Média</option>
                          <option value="alta">Alta</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status *
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="pendente">Pendente</option>
                          <option value="andamento">Em Andamento</option>
                          <option value="concluido">Concluído</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Progresso (0-100) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={progresso}
                          onChange={(e) => setProgresso(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulário PDCA */}
                {modalType === 'pdca' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PLAN - Planejar *
                        </label>
                        <textarea
                          value={plan}
                          onChange={(e) => setPlan(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows="3"
                          placeholder="Defina metas e métodos para alcançá-las..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          DO - Executar *
                        </label>
                        <textarea
                          value={doo}
                          onChange={(e) => setDoo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows="3"
                          placeholder="Execute o plano, treine as pessoas e colete dados..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CHECK - Verificar *
                        </label>
                        <textarea
                          value={checkPhase}
                          onChange={(e) => setCheckPhase(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows="3"
                          placeholder="Verifique os resultados da execução..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ACT - Agir *
                        </label>
                        <textarea
                          value={act}
                          onChange={(e) => setAct(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows="3"
                          placeholder="Ações corretivas e preventivas..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Responsável *
                        </label>
                        <input
                          type="text"
                          value={responsavel}
                          onChange={(e) => setResponsavel(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data Início *
                        </label>
                        <input
                          type="date"
                          value={dataInicio}
                          onChange={(e) => setDataInicio(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fase Atual *
                        </label>
                        <select
                          value={faseAtual}
                          onChange={(e) => setFaseAtual(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="plan">Plan (Planejar)</option>
                          <option value="do">Do (Executar)</option>
                          <option value="check">Check (Verificar)</option>
                          <option value="act">Act (Agir)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status *
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="pendente">Pendente</option>
                          <option value="andamento">Em Andamento</option>
                          <option value="concluido">Concluído</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Progresso (0-100) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={progresso}
                          onChange={(e) => setProgresso(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
