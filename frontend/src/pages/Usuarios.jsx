import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Power,
  PowerOff,
  Shield,
  User,
  Building2,
  Filter
} from 'lucide-react';
import { usuarioService } from '../services/usuarioService';
import { empresaService } from '../services/empresaService';
import { FormularioUsuario } from '../components/usuarios/FormularioUsuario';
import { useAuth } from '../context/AuthContext';

export const Usuarios = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    carregarUsuarios();
  }, [pagination.page, searchTerm, empresaFilter]);

  useEffect(() => {
    if (user?.perfil === 'administrador') {
      carregarEmpresas();
    }
  }, [user]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.listar({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        empresa_id: empresaFilter || undefined,
      });
      setUsuarios(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const carregarEmpresas = async () => {
    try {
      const data = await empresaService.listar({ limit: 1000 });
      setEmpresas(data.data.filter(e => e.ativo));
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (usuarioSelecionado) {
        await usuarioService.atualizar(usuarioSelecionado.id, formData);
        alert('Usuário atualizado com sucesso!');
      } else {
        await usuarioService.criar(formData);
        alert('Usuário cadastrado com sucesso!');
      }
      setModalOpen(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert(error.response?.data?.error || 'Erro ao salvar usuário');
    }
  };

  const handleEdit = (usuario) => {
    setUsuarioSelecionado(usuario);
    setModalOpen(true);
  };

  const handleToggleStatus = async (usuario) => {
    if (!confirm(`Deseja ${usuario.ativo ? 'desativar' : 'reativar'} este usuário?`)) {
      return;
    }

    try {
      if (usuario.ativo) {
        await usuarioService.desativar(usuario.id);
      } else {
        await usuarioService.reativar(usuario.id);
      }
      alert(`Usuário ${usuario.ativo ? 'desativado' : 'reativado'} com sucesso!`);
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert(error.response?.data?.error || 'Erro ao alterar status');
    }
  };

  const handleDelete = async (usuario) => {
    if (!confirm(`Tem certeza que deseja DELETAR permanentemente o usuário "${usuario.nome}"? Esta ação não pode ser desfeita!`)) {
      return;
    }

    try {
      await usuarioService.deletar(usuario.id);
      alert('Usuário deletado com sucesso!');
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert(error.response?.data?.error || 'Erro ao deletar usuário');
    }
  };

  const isAdmin = user?.perfil === 'administrador';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie os usuários do sistema
          </p>
        </div>

        <button
          onClick={() => {
            setUsuarioSelecionado(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filtro por Empresa (apenas admin) */}
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
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center p-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Usuário
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Empresa
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Profissão
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Perfil
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
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{usuario.nome}</p>
                          {usuario.cpf && (
                            <p className="text-sm text-gray-500">CPF: {usuario.cpf}</p>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {usuario.nome_fantasia || usuario.razao_social}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {usuario.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {usuario.tipo_profissional || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          usuario.perfil === 'administrador'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {usuario.perfil === 'administrador' ? (
                            <Shield className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                          {usuario.perfil === 'administrador' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          usuario.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(usuario)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(usuario)}
                            className={`p-2 rounded-lg transition-colors ${
                              usuario.ativo
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={usuario.ativo ? 'Desativar' : 'Reativar'}
                            disabled={usuario.id === user.id}
                          >
                            {usuario.ativo ? (
                              <PowerOff className="w-5 h-5" />
                            ) : (
                              <Power className="w-5 h-5" />
                            )}
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(usuario)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deletar"
                              disabled={usuario.id === user.id}
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
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{usuario.nome}</h3>
                      <p className="text-sm text-gray-500">{usuario.email}</p>
                      {isAdmin && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3" />
                          {usuario.nome_fantasia || usuario.razao_social}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        usuario.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        usuario.perfil === 'administrador'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {usuario.perfil === 'administrador' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {usuario.perfil === 'administrador' ? 'Admin' : 'Usuário'}
                      </span>
                    </div>
                  </div>

                  {usuario.tipo_profissional && (
                    <p className="text-sm text-gray-600">
                      <strong>Profissão:</strong> {usuario.tipo_profissional}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    {usuario.id !== user.id && (
                      <button
                        onClick={() => handleToggleStatus(usuario)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
                          usuario.ativo
                            ? 'text-orange-600 bg-orange-50'
                            : 'text-green-600 bg-green-50'
                        }`}
                      >
                        {usuario.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        {usuario.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  Mostrando {usuarios.length} de {pagination.total} usuários
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
        <FormularioUsuario
          usuario={usuarioSelecionado}
          onClose={() => {
            setModalOpen(false);
            setUsuarioSelecionado(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};