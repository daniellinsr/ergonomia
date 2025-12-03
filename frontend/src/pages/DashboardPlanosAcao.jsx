import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Target, FileText } from 'lucide-react';
import planosService from '../services/planosService';

export const DashboardPlanosAcao = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    planos5w2h: { total: 0, pendentes: 0, em_andamento: 0, concluidos: 0 },
    acoesCorretivas: { total: 0, alta_prioridade: 0 },
    ciclosPDCA: { total: 0, em_andamento: 0 }
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [stats5w2h, statsAcoes, statsPDCA] = await Promise.all([
        planosService.planos5w2h.estatisticas(),
        planosService.acoesCorretivas.estatisticas(),
        planosService.ciclosPDCA.estatisticas(),
      ]);

      setStats({
        planos5w2h: stats5w2h.data,
        acoesCorretivas: statsAcoes.data,
        ciclosPDCA: statsPDCA.data
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: 'Planos 5W2H',
      value: stats.planos5w2h.total || 0,
      subtitle: `${stats.planos5w2h.em_andamento || 0} em andamento`,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Ações Corretivas',
      value: stats.acoesCorretivas.total || 0,
      subtitle: `${stats.acoesCorretivas.alta_prioridade || 0} alta prioridade`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Ciclos PDCA',
      value: stats.ciclosPDCA.total || 0,
      subtitle: `${stats.ciclosPDCA.em_andamento || 0} em andamento`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Concluído',
      value: (parseInt(stats.planos5w2h.concluidos || 0) + 
              parseInt(stats.acoesCorretivas.concluidos || 0) + 
              parseInt(stats.ciclosPDCA.concluidos || 0)),
      subtitle: 'Todos os planos',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Bem-vindo, {user?.nome}!
        </h1>
        <p className="text-gray-600 mt-1">
          Visão geral dos planos de ação da sua empresa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Resumo de Planos 5W2H
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pendentes:</span>
              <span className="font-semibold text-yellow-600">{stats.planos5w2h.pendentes || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Em Andamento:</span>
              <span className="font-semibold text-blue-600">{stats.planos5w2h.em_andamento || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Concluídos:</span>
              <span className="font-semibold text-green-600">{stats.planos5w2h.concluidos || 0}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-600 font-medium">Progresso Médio:</span>
              <span className="font-bold text-indigo-600">{stats.planos5w2h.progresso_medio || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ações Corretivas por Categoria
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ergonomia:</span>
              <span className="font-semibold">{stats.acoesCorretivas.cat_ergonomia || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Equipamento:</span>
              <span className="font-semibold">{stats.acoesCorretivas.cat_equipamento || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Processo:</span>
              <span className="font-semibold">{stats.acoesCorretivas.cat_processo || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Treinamento:</span>
              <span className="font-semibold">{stats.acoesCorretivas.cat_treinamento || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Organização:</span>
              <span className="font-semibold">{stats.acoesCorretivas.cat_organizacao || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ciclos PDCA por Fase
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Plan (Planejar):</span>
              <span className="font-semibold text-blue-600">{stats.ciclosPDCA.fase_plan || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Do (Executar):</span>
              <span className="font-semibold text-green-600">{stats.ciclosPDCA.fase_do || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Check (Verificar):</span>
              <span className="font-semibold text-yellow-600">{stats.ciclosPDCA.fase_check || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Act (Agir):</span>
              <span className="font-semibold text-purple-600">{stats.ciclosPDCA.fase_act || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Indicadores Gerais
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Alta Prioridade:</span>
              <span className="font-semibold text-red-600">
                {(parseInt(stats.planos5w2h.alta_prioridade || 0) + 
                  parseInt(stats.acoesCorretivas.alta_prioridade || 0))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Média Prioridade:</span>
              <span className="font-semibold text-yellow-600">
                {(parseInt(stats.planos5w2h.media_prioridade || 0) + 
                  parseInt(stats.acoesCorretivas.media_prioridade || 0))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Baixa Prioridade:</span>
              <span className="font-semibold text-green-600">
                {(parseInt(stats.planos5w2h.baixa_prioridade || 0) + 
                  parseInt(stats.acoesCorretivas.baixa_prioridade || 0))}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-600 font-medium">Total de Planos:</span>
              <span className="font-bold text-indigo-600">
                {(parseInt(stats.planos5w2h.total || 0) + 
                  parseInt(stats.acoesCorretivas.total || 0) + 
                  parseInt(stats.ciclosPDCA.total || 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
