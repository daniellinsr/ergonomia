import { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer
} from 'recharts';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import relatoriosService from '../../services/relatoriosService';

export function RelatorioDetalhadoAvaliacoes() {
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState(null);
  const [avaliacaoExpandida, setAvaliacaoExpandida] = useState(null);
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const response = await relatoriosService.relatorioDetalhadoAvaliacoes(filtros);
      setDados(response.data);
    } catch (error) {
      console.error('Erro ao carregar relatório detalhado:', error);
      alert('Erro ao carregar relatório detalhado de avaliações');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    carregarDados();
  };

  const toggleExpansao = (avaliacaoId) => {
    setAvaliacaoExpandida(avaliacaoExpandida === avaliacaoId ? null : avaliacaoId);
  };

  const CORES_STATUS = {
    'em_andamento': '#3B82F6',
    'concluida': '#10B981',
    'cancelada': '#EF4444',
  };

  const traduzirStatus = (status) => {
    const traducoes = {
      'em_andamento': 'Em Andamento',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada',
    };
    return traducoes[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="text-center text-gray-500 py-8">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={filtros.data_inicio}
              onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={filtros.data_fim}
              onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={aplicarFiltros}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Status das Avaliações */}
        {dados.estatisticas.por_status && dados.estatisticas.por_status.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Status das Avaliações</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dados.estatisticas.por_status.map(item => ({
                    name: traduzirStatus(item.status),
                    value: parseInt(item.total),
                    status: item.status,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dados.estatisticas.por_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_STATUS[entry.status] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de Barras Horizontais - Top 15 Perigos Mais Identificados */}
        {dados.estatisticas.perigos_mais_identificados && dados.estatisticas.perigos_mais_identificados.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Top 15 Perigos Mais Identificados</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dados.estatisticas.perigos_mais_identificados.map(item => ({
                  codigo: item.codigo,
                  descricao: item.descricao.substring(0, 30) + '...',
                  total: parseInt(item.total),
                }))}
                layout="vertical"
                margin={{ left: 50, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="codigo" type="category" width={50} />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      const perigo = dados.estatisticas.perigos_mais_identificados.find(p => p.codigo === data.codigo);
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded shadow">
                          <p className="font-semibold">{perigo?.codigo}</p>
                          <p className="text-sm text-gray-600">{perigo?.descricao}</p>
                          <p className="text-sm font-medium mt-1">Total: {data.total}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="total" fill="#4F46E5" name="Identificações" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Resumo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">{dados.avaliacoes.length}</p>
            <p className="text-sm text-gray-600 mt-1">Total de Avaliações</p>
          </div>
          {dados.estatisticas.por_status.map(item => (
            <div key={item.status} className="text-center">
              <p className="text-3xl font-bold" style={{ color: CORES_STATUS[item.status] }}>
                {item.total}
              </p>
              <p className="text-sm text-gray-600 mt-1">{traduzirStatus(item.status)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela Detalhada */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Avaliações Detalhadas</h3>
          <p className="text-sm text-gray-600 mt-1">
            Clique em uma avaliação para ver os 61 perigos avaliados
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSE/Setor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perigos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dados.avaliacoes.map((avaliacao) => (
                <>
                  <tr
                    key={avaliacao.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpansao(avaliacao.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {avaliacaoExpandida === avaliacao.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {avaliacao.empresa_nome || avaliacao.empresa_razao}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{avaliacao.setor_nome}</p>
                        <p className="text-xs text-gray-500">{avaliacao.unidade_nome}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {avaliacao.titulo || 'Sem título'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {avaliacao.tipo_avaliacao}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(avaliacao.data_avaliacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: CORES_STATUS[avaliacao.status] }}
                      >
                        {traduzirStatus(avaliacao.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {avaliacao.total_perigos_identificados}
                    </td>
                  </tr>

                  {/* Linha expandida com os 61 perigos */}
                  {avaliacaoExpandida === avaliacao.id && (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 bg-gray-50">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-700 mb-3">
                            Perigos Avaliados ({avaliacao.perigos?.length || 0})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                            {avaliacao.perigos?.map((perigo, idx) => (
                              <div
                                key={idx}
                                className={`p-2 rounded text-xs ${
                                  perigo.identificado
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-gray-100 border border-gray-200'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className="font-semibold">{perigo.codigo}</span>
                                  {perigo.identificado && (
                                    <span className="px-1 py-0.5 bg-red-500 text-white rounded text-xs">
                                      ✓
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 mt-1 line-clamp-2">
                                  {perigo.perigo_descricao}
                                </p>
                                {perigo.identificado && perigo.classificacao_final && (
                                  <p className="text-red-700 font-semibold mt-1">
                                    {perigo.classificacao_final}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

