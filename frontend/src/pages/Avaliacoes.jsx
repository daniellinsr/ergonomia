import { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Eye,
  Trash2,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { avaliacaoService } from '../services/avaliacaoService';
import { empresaService } from '../services/empresaService';
import { NovaAvaliacao } from '../components/avaliacoes/NovaAvaliacao';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getStatusColor, getStatusLabel } from '../utils/classificacaoRisco';

export const Avaliacoes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalNovaOpen, setModalNovaOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    carregarAvaliacoes();
  }, [pagination.page, searchTerm, empresaFilter, statusFilter]);

  useEffect(() => {
    if (user?.perfil === 'administrador') {
      carregarEmpresas();
    }
  }, [user]);

  const carregarEmpresas = async () => {
    try {
      const data = await empresaService.listar({ limit: 1000 });
      setEmpresas(data.data.filter(e => e.ativo));
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const carregarAvaliacoes = async () => {
    try {
      setLoading(true);
      const data = await avaliacaoService.listar({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        empresa_id: empresaFilter || undefined,
        status: statusFilter || undefined,
      });
      setAvaliacoes(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      alert('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  const handleNovaAvaliacao = async (formData) => {
    try {
      const result = await avaliacaoService.criar(formData);
      alert('Avaliação criada com sucesso!');
      setModalNovaOpen(false);
      // Redirecionar para a tela de preenchimento
      navigate(`/avaliacoes/${result.data.id}/preencher`);
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      alert(error.response?.data?.error || 'Erro ao criar avaliação');
    }
  };

  const handleVisualizarAvaliacao = (id) => {
    navigate(`/avaliacoes/${id}/preencher`);
  };

  const handleDelete = async (avaliacao) => {
    if (!confirm(`Tem certeza que deseja DELETAR a avaliação de "${avaliacao.trabalhador_nome}"?`)) {
      return;
    }

    try {
      await avaliacaoService.deletar(avaliacao.id);
      alert('Avaliação deletada com sucesso!');
      carregarAvaliacoes();
    } catch (error) {
      console.error('Erro ao deletar avaliação:', error);
      alert(error.response?.data?.error || 'Erro ao deletar avaliação');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const isAdmin = user?.perfil === 'administrador';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            Avaliações Ergonômicas
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie as avaliações ergonômicas preliminares
          </p>
        </div>

        <button
          onClick={() => setModalNovaOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Avaliação
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por trabalhador, setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filtro por Empresa */}
          {isAdmin && (
            <div className="relative">
              <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={empresaFilter}
                onChange={(e) => setEmpresaFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Todas as empresas</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razao_social}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Status */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Em Andamento</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {avaliacoes.filter(a => a.status === 'em_andamento').length}
              </p>
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
              <p className="text-3xl font-bold text-green-600 mt-2">
                {avaliacoes.filter(a => a.status === 'concluida').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total de Avaliações</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {pagination.total}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <ClipboardCheck className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Avaliações */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : avaliacoes.length === 0 ? (
          <div className="text-center p-12">
            <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma avaliação encontrada</p>
            <button
              onClick={() => setModalNovaOpen(true)}
              className="mt-4 text-primary hover:underline"
            >
              Criar primeira avaliação
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Trabalhador
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Empresa
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Setor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Avaliador
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Perigos
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {avaliacoes.map((avaliacao) => (
                    <tr key={avaliacao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {avaliacao.trabalhador_nome}
                          </p>
                          {avaliacao.trabalhador_cpf && (
                            <p className="text-sm text-gray-500">
                              CPF: {avaliacao.trabalhador_cpf}
                            </p>
                          )}
                          {avaliacao.trabalhador_cargo && (
                            <p className="text-sm text-gray-500">
                              {avaliacao.trabalhador_cargo}
                            </p>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {avaliacao.nome_fantasia || avaliacao.razao_social}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {avaliacao.setor_nome ? (
                          <div>
                            <p>{avaliacao.setor_nome}</p>
                            {avaliacao.unidade_nome && (
                              <p className="text-xs text-gray-500">
                                {avaliacao.unidade_nome}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {avaliacao.avaliador_nome}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(avaliacao.data_avaliacao)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          {avaliacao.total_perigos_identificados || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(avaliacao.status)}`}>
                          {getStatusLabel(avaliacao.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleVisualizarAvaliacao(avaliacao.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={avaliacao.status === 'concluida' ? 'Visualizar' : 'Continuar'}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {isAdmin && avaliacao.status !== 'concluida' && (
                            <button
                              onClick={() => handleDelete(avaliacao)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {avaliacoes.map((avaliacao) => (
                <div key={avaliacao.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {avaliacao.trabalhador_nome}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(avaliacao.data_avaliacao)}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(avaliacao.status)}`}>
                      {getStatusLabel(avaliacao.status)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    {isAdmin && (
                      <p className="text-gray-600">
                        <strong>Empresa:</strong> {avaliacao.nome_fantasia || avaliacao.razao_social}
                      </p>
                    )}
                    {avaliacao.setor_nome && (
                      <p className="text-gray-600">
                        <strong>Setor:</strong> {avaliacao.setor_nome}
                      </p>
                    )}
                    <p className="text-gray-600">
                      <strong>Avaliador:</strong> {avaliacao.avaliador_nome}
                    </p>
                    <p className="text-gray-600">
                      <strong>Perigos identificados:</strong> {avaliacao.total_perigos_identificados || 0}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleVisualizarAvaliacao(avaliacao.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                      {avaliacao.status === 'concluida' ? 'Visualizar' : 'Continuar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  Mostrando {avaliacoes.length} de {pagination.total} avaliações
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Nova Avaliação */}
      {modalNovaOpen && (
        <NovaAvaliacao
          onClose={() => setModalNovaOpen(false)}
          onSave={handleNovaAvaliacao}
        />
      )}
    </div>
  );
};