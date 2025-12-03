import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  Target,
  Building,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer
} from 'recharts';
import { avaliacaoService } from '../services/avaliacaoService';
import { useAuth } from '../context/AuthContext';

export const DashboardAvaliacoes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    em_andamento: 0,
    concluidas: 0,
    canceladas: 0,
    por_tipo: [],
    por_setor: [],
    ultimas_avaliacoes: [],
    por_mes: []
  });

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      // Buscar todas as avaliações para processar estatísticas
      const response = await avaliacaoService.listar({ limit: 1000 });
      const avaliacoes = response.data;

      // Calcular estatísticas
      const total = avaliacoes.length;
      const em_andamento = avaliacoes.filter(a => a.status === 'em_andamento').length;
      const concluidas = avaliacoes.filter(a => a.status === 'concluida').length;
      const canceladas = avaliacoes.filter(a => a.status === 'cancelada').length;

      // Agrupar por tipo
      const porTipo = avaliacoes.reduce((acc, av) => {
        const tipo = av.tipo_avaliacao || 'AEP';
        const existing = acc.find(item => item.tipo === tipo);
        if (existing) {
          existing.total++;
        } else {
          acc.push({ tipo, total: 1 });
        }
        return acc;
      }, []);

      // Agrupar por setor (top 10)
      const porSetor = avaliacoes.reduce((acc, av) => {
        const setor = av.setor_nome || 'Sem setor';
        const existing = acc.find(item => item.setor === setor);
        if (existing) {
          existing.total++;
        } else {
          acc.push({ setor, total: 1 });
        }
        return acc;
      }, []).sort((a, b) => b.total - a.total).slice(0, 10);

      // Últimas 5 avaliações
      const ultimas = avaliacoes.slice(0, 5);

      // Agrupar por mês (últimos 6 meses)
      const porMes = avaliacoes.reduce((acc, av) => {
        const date = new Date(av.data_avaliacao || av.created_at);
        const mes = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        const existing = acc.find(item => item.mes === mes);
        if (existing) {
          existing.total++;
        } else {
          acc.push({ mes, total: 1 });
        }
        return acc;
      }, []).slice(0, 6).reverse();

      setStats({
        total,
        em_andamento,
        concluidas,
        canceladas,
        por_tipo: porTipo,
        por_setor: porSetor,
        ultimas_avaliacoes: ultimas,
        por_mes: porMes
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    em_andamento: '#3B82F6',
    concluida: '#10B981',
    cancelada: '#EF4444'
  };

  const STATUS_COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-primary" />
          Dashboard de Avaliações
        </h1>
        <p className="text-gray-600 mt-1">
          Visão geral das avaliações ergonômicas
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total de Avaliações</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <ClipboardCheck className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Em Andamento</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.em_andamento}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Concluídas</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.concluidas}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Canceladas</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.canceladas}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Em Andamento', value: stats.em_andamento, color: COLORS.em_andamento },
                  { name: 'Concluídas', value: stats.concluidas, color: COLORS.concluida },
                  { name: 'Canceladas', value: stats.canceladas, color: COLORS.cancelada }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { color: COLORS.em_andamento },
                  { color: COLORS.concluida },
                  { color: COLORS.cancelada }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico por Tipo */}
        {stats.por_tipo.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Avaliações por Tipo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.por_tipo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#4F46E5" name="Avaliações" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico por Setor */}
        {stats.por_setor.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Top 10 Setores</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.por_setor} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="setor" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#06B6D4" name="Avaliações" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de Evolução */}
        {stats.por_mes.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Evolução (Últimos 6 Meses)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.por_mes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} name="Avaliações" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Últimas Avaliações */}
      {stats.ultimas_avaliacoes.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Últimas Avaliações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSE/Setor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.ultimas_avaliacoes.map((avaliacao) => (
                  <tr
                    key={avaliacao.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/avaliacoes/${avaliacao.id}/preencher`)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {avaliacao.titulo || 'Sem título'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {avaliacao.setor_nome || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {avaliacao.tipo_avaliacao || 'AEP'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(avaliacao.data_avaliacao || avaliacao.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        avaliacao.status === 'concluida'
                          ? 'bg-green-100 text-green-800'
                          : avaliacao.status === 'em_andamento'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {avaliacao.status === 'concluida' ? 'Concluída' :
                         avaliacao.status === 'em_andamento' ? 'Em Andamento' : 'Cancelada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
