import { useState, useEffect } from 'react';
import relatoriosService from '../services/relatoriosService';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer
} from 'recharts';
import {
  FileText, Download, TrendingUp, AlertTriangle,
  Users, ClipboardCheck, Target, Calendar, Filter
} from 'lucide-react';

export function Relatorios() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados de dados
  const [inventarioRiscos, setInventarioRiscos] = useState(null);
  const [estatisticas, setEstatisticas] = useState(null);
  const [relatorioPorSetor, setRelatorioPorSetor] = useState([]);
  const [relatorioPorTrabalhador, setRelatorioPorTrabalhador] = useState([]);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    setor_id: '',
    data_inicio: '',
    data_fim: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [inventario, stats, porSetor, porTrabalhador] = await Promise.all([
        relatoriosService.inventarioRiscos(filtros),
        relatoriosService.estatisticasGerais(),
        relatoriosService.relatorioPorSetor(),
        relatoriosService.relatorioPorTrabalhador(filtros),
      ]);
      
      setInventarioRiscos(inventario.data);
      setEstatisticas(stats.data);
      setRelatorioPorSetor(porSetor.data);
      setRelatorioPorTrabalhador(porTrabalhador.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados dos relatórios');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    carregarDados();
  };

  const exportarPDF = async () => {
    try {
      setLoading(true);
      const response = await relatoriosService.relatorioConsolidado();
      const dados = response.data;
      
      // Criar HTML para PDF
      const htmlContent = gerarHTMLParaPDF(dados);
      
      // Abrir em nova janela para impressão/PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF');
    } finally {
      setLoading(false);
    }
  };

  const gerarHTMLParaPDF = (dados) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Ergonomia - ${dados.empresa?.nome || 'Empresa'}</title>
        <style>
          @media print {
            @page { margin: 2cm; }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #4F46E5;
          }
          .header h1 {
            color: #4F46E5;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .section {
            margin: 30px 0;
            page-break-inside: avoid;
          }
          .section h2 {
            color: #4F46E5;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .stat-card {
            background: #F3F4F6;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #4F46E5;
          }
          .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #E5E7EB;
          }
          th {
            background: #F3F4F6;
            font-weight: bold;
            color: #4F46E5;
          }
          .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
          }
          .badge-intoleravel { background: #FEE2E2; color: #991B1B; }
          .badge-substancial { background: #FED7AA; color: #9A3412; }
          .badge-moderado { background: #FEF3C7; color: #92400E; }
          .badge-toleravel { background: #D1FAE5; color: #065F46; }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Ergonomia</h1>
          <p><strong>${dados.empresa?.nome || 'Empresa'}</strong></p>
          <p>CNPJ: ${dados.empresa?.cnpj || 'N/A'}</p>
          <p>Data de Geração: ${dataAtual}</p>
        </div>

        <div class="section">
          <h2>📊 Estatísticas Gerais</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${dados.stats?.total_trabalhadores || 0}</div>
              <div class="stat-label">Trabalhadores</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${dados.stats?.total_avaliacoes || 0}</div>
              <div class="stat-label">Avaliações</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${dados.stats?.riscos_intoleraveis || 0}</div>
              <div class="stat-label">Riscos Intoleráveis</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${dados.stats?.riscos_substanciais || 0}</div>
              <div class="stat-label">Riscos Substanciais</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${dados.stats?.planos_ativos || 0}</div>
              <div class="stat-label">Planos Ativos</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>⚠️ Inventário de Riscos (Top 50)</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Trabalhador</th>
                <th>Cargo</th>
                <th>Setor</th>
                <th>Nível</th>
              </tr>
            </thead>
            <tbody>
              ${dados.riscos.map(risco => `
                <tr>
                  <td>${new Date(risco.data_avaliacao).toLocaleDateString('pt-BR')}</td>
                  <td>${risco.trabalhador}</td>
                  <td>${risco.cargo}</td>
                  <td>${risco.setor || 'N/A'}</td>
                  <td><span class="badge badge-${(risco.classificacao_risco || '').toLowerCase()}">${risco.classificacao_risco || 'N/A'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${dados.planos.length > 0 ? `
        <div class="section">
          <h2>📋 Planos de Ação em Andamento</h2>
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Progresso</th>
              </tr>
            </thead>
            <tbody>
              ${dados.planos.map(plano => `
                <tr>
                  <td>${plano.titulo}</td>
                  <td>${plano.tipo}</td>
                  <td>${plano.status}</td>
                  <td>${plano.progresso}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>Relatório gerado automaticamente pelo Sistema de Ergonomia</p>
          <p>${dataAtual}</p>
        </div>
      </body>
      </html>
    `;
  };

  const CORES_RISCO = {
    'Intolerável': '#DC2626',
    'Substancial': '#EA580C',
    'Moderado': '#F59E0B',
    'Tolerável': '#10B981',
    'Trivial': '#6B7280',
    intoleravel: '#DC2626',
    substancial: '#EA580C',
    moderado: '#F59E0B',
    toleravel: '#10B981',
    trivial: '#6B7280',
  };

  const traduzirNivelRisco = (nivel) => {
    if (!nivel) return 'N/A';
    const traducoes = {
      'Intolerável': 'Intolerável',
      'Substancial': 'Substancial',
      'Moderado': 'Moderado',
      'Tolerável': 'Tolerável',
      'Trivial': 'Trivial',
      intoleravel: 'Intolerável',
      substancial: 'Substancial',
      moderado: 'Moderado',
      toleravel: 'Tolerável',
      trivial: 'Trivial',
    };
    return traducoes[nivel] || nivel;
  };

  if (loading && !estatisticas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios e Dashboards</h1>
          <p className="text-gray-600 mt-2">Análises estatísticas e inventário de riscos</p>
        </div>
        <button
          onClick={exportarPDF}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          Exportar PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Dashboard
            </div>
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventario'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Inventário de Riscos
            </div>
          </button>
          <button
            onClick={() => setActiveTab('setores')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'setores'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Por Setor
            </div>
          </button>
          <button
            onClick={() => setActiveTab('trabalhadores')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trabalhadores'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Por Trabalhador
            </div>
          </button>
        </nav>
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && estatisticas && (
        <div className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Trabalhadores</p>
                  <p className="text-3xl font-bold text-gray-900">{estatisticas.trabalhadores}</p>
                </div>
                <Users className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Avaliações</p>
                  <p className="text-3xl font-bold text-gray-900">{estatisticas.avaliacoes}</p>
                </div>
                <ClipboardCheck className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Riscos por Nível</p>
                  <div className="flex gap-2 mt-2">
                    {estatisticas.porRisco?.map((item) => (
                      <span
                        key={item.classificacao_risco}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${CORES_RISCO[item.classificacao_risco] || '#6B7280'}20`,
                          color: CORES_RISCO[item.classificacao_risco] || '#6B7280',
                        }}
                      >
                        {item.total}
                      </span>
                    ))}
                  </div>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planos Ativos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(estatisticas.planos?.planos5w2h?.reduce((acc, p) => acc + (p.status !== 'concluido' ? parseInt(p.total) : 0), 0) || 0) +
                     (estatisticas.planos?.acoesCorretivas?.reduce((acc, p) => acc + (p.status !== 'concluido' ? parseInt(p.total) : 0), 0) || 0) +
                     (estatisticas.planos?.ciclosPDCA?.reduce((acc, p) => acc + (p.status !== 'concluido' ? parseInt(p.total) : 0), 0) || 0)}
                  </p>
                </div>
                <Target className="w-12 h-12 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Riscos */}
            {estatisticas.porRisco && estatisticas.porRisco.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Distribuição de Riscos</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={estatisticas.porRisco.map(item => ({
                        name: traduzirNivelRisco(item.classificacao_risco),
                        value: parseInt(item.total),
                        nivel: item.classificacao_risco,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {estatisticas.porRisco.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CORES_RISCO[entry.classificacao_risco] || '#6B7280'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfico de Avaliações por Tipo */}
            {estatisticas.porTipo && estatisticas.porTipo.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Avaliações por Tipo</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={estatisticas.porTipo.map(item => ({
                    tipo: item.tipo_avaliacao,
                    total: parseInt(item.total),
                  }))}>
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

            {/* Gráfico de Evolução Temporal */}
            {estatisticas.porMes && estatisticas.porMes.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Evolução de Avaliações (Últimos 6 Meses)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={estatisticas.porMes.map(item => ({
                    mes: item.mes,
                    total: parseInt(item.total),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#4F46E5" strokeWidth={2} name="Avaliações" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inventário de Riscos */}
      {activeTab === 'inventario' && inventarioRiscos && (
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
                  onChange={(e) => setFiltros({...filtros, data_inicio: e.target.value})}
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
                  onChange={(e) => setFiltros({...filtros, data_fim: e.target.value})}
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

          {/* Resumo de Riscos */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(inventarioRiscos.stats || {}).map(([key, value]) => (
              key !== 'total' && (
                <div key={key} className="bg-white p-4 rounded-lg shadow text-center">
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{ color: CORES_RISCO[key] || '#6B7280' }}
                  >
                    {value}
                  </div>
                  <div className="text-sm text-gray-600">{traduzirNivelRisco(key)}</div>
                </div>
              )
            ))}
          </div>

          {/* Tabela de Riscos */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabalhador</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nível</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventarioRiscos.riscos?.map((risco) => (
                    <tr key={risco.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(risco.data_avaliacao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {risco.trabalhador_nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {risco.cargo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {risco.setor_nome || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="px-2 py-1 text-xs font-semibold rounded-full"
                          style={{
                            backgroundColor: `${CORES_RISCO[risco.classificacao_risco] || '#6B7280'}20`,
                            color: CORES_RISCO[risco.classificacao_risco] || '#6B7280',
                          }}
                        >
                          {traduzirNivelRisco(risco.classificacao_risco)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {risco.observacoes_gerais || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Por Setor */}
      {activeTab === 'setores' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabalhadores</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avaliações</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Riscos Intoleráveis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Riscos Substanciais</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Riscos Moderados</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {relatorioPorSetor.map((setor) => (
                  <tr key={setor.setor_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {setor.setor_nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {setor.total_trabalhadores}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {setor.total_avaliacoes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        {setor.riscos_intoleraveis}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                        {setor.riscos_substanciais}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        {setor.riscos_moderados}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Por Trabalhador */}
      {activeTab === 'trabalhadores' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avaliações</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Avaliação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maior Risco</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {relatorioPorTrabalhador.map((trabalhador) => (
                  <tr key={trabalhador.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {trabalhador.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trabalhador.cargo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trabalhador.setor_nome || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trabalhador.total_avaliacoes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trabalhador.ultima_avaliacao 
                        ? new Date(trabalhador.ultima_avaliacao).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trabalhador.maior_risco ? (
                        <span
                          className="px-2 py-1 text-xs font-semibold rounded-full"
                          style={{
                            backgroundColor: `${CORES_RISCO[trabalhador.maior_risco] || '#6B7280'}20`,
                            color: CORES_RISCO[trabalhador.maior_risco] || '#6B7280',
                          }}
                        >
                          {traduzirNivelRisco(trabalhador.maior_risco)}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
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
}
