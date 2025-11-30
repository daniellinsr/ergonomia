import { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Power,
  PowerOff,
  Users,
  MapPin
} from 'lucide-react';
import { empresaService } from '../services/empresaService';
import { FormularioEmpresa } from '../components/empresas/FormularioEmpresa';
import { useAuth } from '../context/AuthContext';

export const Empresas = () => {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    carregarEmpresas();
  }, [pagination.page, searchTerm]);

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      const data = await empresaService.listar({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      });
      setEmpresas(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      alert('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (empresaSelecionada) {
        await empresaService.atualizar(empresaSelecionada.id, formData);
        alert('Empresa atualizada com sucesso!');
      } else {
        await empresaService.criar(formData);
        alert('Empresa cadastrada com sucesso!');
      }
      setModalOpen(false);
      setEmpresaSelecionada(null);
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      alert(error.response?.data?.error || 'Erro ao salvar empresa');
    }
  };

  const handleEdit = (empresa) => {
    setEmpresaSelecionada(empresa);
    setModalOpen(true);
  };

  const handleToggleStatus = async (empresa) => {
    if (!confirm(`Deseja ${empresa.ativo ? 'desativar' : 'reativar'} esta empresa?`)) {
      return;
    }

    try {
      if (empresa.ativo) {
        await empresaService.desativar(empresa.id);
      } else {
        await empresaService.reativar(empresa.id);
      }
      alert(`Empresa ${empresa.ativo ? 'desativada' : 'reativada'} com sucesso!`);
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert(error.response?.data?.error || 'Erro ao alterar status');
    }
  };

  const handleDelete = async (empresa) => {
    if (!confirm(`Tem certeza que deseja DELETAR permanentemente a empresa "${empresa.razao_social}"? Esta ação não pode ser desfeita!`)) {
      return;
    }

    try {
      await empresaService.deletar(empresa.id);
      alert('Empresa deletada com sucesso!');
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao deletar empresa:', error);
      alert(error.response?.data?.error || 'Erro ao deletar empresa');
    }
  };

  const isAdmin = user?.perfil === 'administrador';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Gerenciamento de Empresas
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Gerencie todas as empresas do sistema' : 'Visualize sua empresa'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEmpresaSelecionada(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Empresa
          </button>
        )}
      </div>

      {/* Busca */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Lista de Empresas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : empresas.length === 0 ? (
          <div className="text-center p-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma empresa encontrada</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Usuários
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {empresas.map((empresa) => (
                    <tr key={empresa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{empresa.razao_social}</p>
                          {empresa.nome_fantasia && (
                            <p className="text-sm text-gray-500">{empresa.nome_fantasia}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {empresa.cnpj}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          {empresa.telefone && (
                            <p className="text-gray-700">{empresa.telefone}</p>
                          )}
                          {empresa.email && (
                            <p className="text-gray-500">{empresa.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          <Users className="w-4 h-4" />
                          {empresa.total_usuarios || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          empresa.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {empresa.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(empresa)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(empresa)}
                              className={`p-2 rounded-lg transition-colors ${
                                empresa.ativo
                                  ? 'text-orange-600 hover:bg-orange-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={empresa.ativo ? 'Desativar' : 'Reativar'}
                            >
                              {empresa.ativo ? (
                                <PowerOff className="w-5 h-5" />
                              ) : (
                                <Power className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(empresa)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {empresas.map((empresa) => (
                <div key={empresa.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{empresa.razao_social}</h3>
                      {empresa.nome_fantasia && (
                        <p className="text-sm text-gray-500">{empresa.nome_fantasia}</p>
                      )}
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      empresa.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {empresa.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700"><strong>CNPJ:</strong> {empresa.cnpj}</p>
                    {empresa.telefone && <p className="text-gray-700">{empresa.telefone}</p>}
                    {empresa.email && <p className="text-gray-500">{empresa.email}</p>}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleEdit(empresa)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(empresa)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
                          empresa.ativo
                            ? 'text-orange-600 bg-orange-50'
                            : 'text-green-600 bg-green-50'
                        }`}
                      >
                        {empresa.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        {empresa.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  Mostrando {empresas.length} de {pagination.total} empresas
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
        <FormularioEmpresa
          empresa={empresaSelecionada}
          onClose={() => {
            setModalOpen(false);
            setEmpresaSelecionada(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};