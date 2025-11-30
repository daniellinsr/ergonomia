import { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Power,
  PowerOff,
  Building,
  Layers,
  Filter,
  Calendar
} from 'lucide-react';
import { trabalhadorService } from '../services/trabalhadorService';
import { empresaService } from '../services/empresaService';
import { setorService } from '../services/setorService';
import { FormularioTrabalhador } from '../components/trabalhadores/FormularioTrabalhador';
import { useAuth } from '../context/AuthContext';

export const Trabalhadores = () => {
  const { user } = useAuth();
  const [trabalhadores, setTrabalhadores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');
  const [setorFilter, setSetorFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [trabalhadorSelecionado, setTrabalhadorSelecionado] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    carregarTrabalhadores();
  }, [pagination.page, searchTerm, empresaFilter, setorFilter]);

  useEffect(() => {
    if (user?.perfil === 'administrador') {
      carregarEmpresas();
    }
    carregarSetores();
  }, [user]);

  const carregarEmpresas = async () => {
    try {
      const data = await empresaService.listar({ limit: 1000 });
      setEmpresas(data.data.filter(e => e.ativo));
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
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

  const carregarTrabalhadores = async () => {
    try {
      setLoading(true);
      const data = await trabalhadorService.listar({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        empresa_id: empresaFilter || undefined,
        setor_id: setorFilter || undefined,
      });
      setTrabalhadores(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro ao carregar trabalhadores:', error);
      alert('Erro ao carregar trabalhadores');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (trabalhadorSelecionado) {
        await trabalhadorService.atualizar(trabalhadorSelecionado.id, formData);
        alert('Trabalhador atualizado com sucesso!');
      } else {
        await trabalhadorService.criar(formData);
        alert('Trabalhador cadastrado com sucesso!');
      }
      setModalOpen(false);
      setTrabalhadorSelecionado(null);
      carregarTrabalhadores();
    } catch (error) {
      console.error('Erro ao salvar trabalhador:', error);
      alert(error.response?.data?.error || 'Erro ao salvar trabalhador');
    }
  };

  const handleEdit = (trabalhador) => {
    setTrabalhadorSelecionado(trabalhador);
    setModalOpen(true);
  };

  const handleToggleStatus = async (trabalhador) => {
    if (!confirm(`Deseja ${trabalhador.ativo ? 'desativar' : 'reativar'} este trabalhador?`)) {
      return;
    }

    try {
      if (trabalhador.ativo) {
        await trabalhadorService.desativar(trabalhador.id);
      } else {
        await trabalhadorService.reativar(trabalhador.id);
      }
      alert(`Trabalhador ${trabalhador.ativo ? 'desativado' : 'reativado'} com sucesso!`);
      carregarTrabalhadores();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert(error.response?.data?.error || 'Erro ao alterar status');
    }
  };

  const handleDelete = async (trabalhador) => {
    if (!confirm(`Tem certeza que deseja DELETAR permanentemente "${trabalhador.nome}"?`)) {
      return;
    }

    try {
      await trabalhadorService.deletar(trabalhador.id);
      alert('Trabalhador deletado com sucesso!');
      carregarTrabalhadores();
    } catch (error) {
      console.error('Erro ao deletar trabalhador:', error);
      alert(error.response?.data?.error || 'Erro ao deletar trabalhador');
    }
  };

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const isAdmin = user?.perfil === 'administrador';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-primary" />
            Trabalhadores
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie os trabalhadores e colaboradores
          </p>
        </div>

        <button
          onClick={() => {
            setTrabalhadorSelecionado(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Trabalhador
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF, cargo..."
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

          {/* Filtro por Setor */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              value={setorFilter}
              onChange={(e) => setSetorFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todos os setores</option>
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.unidade_nome} - {setor.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Trabalhadores */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : trabalhadores.length === 0 ? (
          <div className="text-center p-12">
            <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum trabalhador encontrado</p>
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
                      Cargo/Função
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
                  {trabalhadores.map((trabalhador) => (
                    <tr key={trabalhador.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{trabalhador.nome}</p>
                          {trabalhador.cpf && (
                            <p className="text-sm text-gray-500">CPF: {trabalhador.cpf}</p>
                          )}
                          {trabalhador.data_nascimento && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {calcularIdade(trabalhador.data_nascimento)} anos
                            </p>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            {trabalhador.nome_fantasia || trabalhador.razao_social}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm">
                        {trabalhador.setor_nome ? (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Layers className="w-4 h-4 text-gray-400" />
                            <div>
                              <p>{trabalhador.setor_nome}</p>
                              {trabalhador.unidade_nome && (
                                <p className="text-xs text-gray-500">{trabalhador.unidade_nome}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div>
                          {trabalhador.cargo && <p>{trabalhador.cargo}</p>}
                          {trabalhador.funcao && (
                            <p className="text-xs text-gray-500">{trabalhador.funcao}</p>
                          )}
                          {!trabalhador.cargo && !trabalhador.funcao && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          trabalhador.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {trabalhador.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(trabalhador)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(trabalhador)}
                            className={`p-2 rounded-lg transition-colors ${
                              trabalhador.ativo
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={trabalhador.ativo ? 'Desativar' : 'Reativar'}
                          >
                            {trabalhador.ativo ? (
                              <PowerOff className="w-5 h-5" />
                            ) : (
                              <Power className="w-5 h-5" />
                            )}
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(trabalhador)}
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
              {trabalhadores.map((trabalhador) => (
                <div key={trabalhador.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{trabalhador.nome}</h3>
                      {trabalhador.cpf && (
                        <p className="text-sm text-gray-500">CPF: {trabalhador.cpf}</p>
                      )}
                      {trabalhador.data_nascimento && (
                        <p className="text-sm text-gray-500">
                          {calcularIdade(trabalhador.data_nascimento)} anos
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      trabalhador.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {trabalhador.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    {isAdmin && (
                      <p className="text-gray-600">
                        <strong>Empresa:</strong> {trabalhador.nome_fantasia || trabalhador.razao_social}
                      </p>
                    )}
                    {trabalhador.setor_nome && (
                      <p className="text-gray-600">
                        <strong>Setor:</strong> {trabalhador.setor_nome}
                        {trabalhador.unidade_nome && ` - ${trabalhador.unidade_nome}`}
                      </p>
                    )}
                    {trabalhador.cargo && (
                      <p className="text-gray-600">
                        <strong>Cargo:</strong> {trabalhador.cargo}
                      </p>
                    )}
                    {trabalhador.funcao && (
                      <p className="text-gray-600">
                        <strong>Função:</strong> {trabalhador.funcao}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(trabalhador)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleStatus(trabalhador)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
                        trabalhador.ativo
                          ? 'text-orange-600 bg-orange-50'
                          : 'text-green-600 bg-green-50'
                      }`}
                    >
                      {trabalhador.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      {trabalhador.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  Mostrando {trabalhadores.length} de {pagination.total} trabalhadores
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

      {/* Modal */}
      {modalOpen && (
        <FormularioTrabalhador
          trabalhador={trabalhadorSelecionado}
          onClose={() => {
            setModalOpen(false);
            setTrabalhadorSelecionado(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};