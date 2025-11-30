import { useState, useEffect } from 'react';
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Power,
  PowerOff,
  MapPin,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';
import { unidadeService } from '../services/unidadeService';
import { setorService } from '../services/setorService';
import { empresaService } from '../services/empresaService';
import { FormularioUnidade } from '../components/unidades/FormularioUnidade';
import { FormularioSetor } from '../components/setores/FormularioSetor';
import { useAuth } from '../context/AuthContext';

export const UnidadesSetores = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('unidades');
  const [unidades, setUnidades] = useState([]);
  const [setores, setSetores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');
  const [unidadeFilter, setUnidadeFilter] = useState('');
  const [modalUnidadeOpen, setModalUnidadeOpen] = useState(false);
  const [modalSetorOpen, setModalSetorOpen] = useState(false);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState(null);
  const [setorSelecionado, setSetorSelecionado] = useState(null);
  const [unidadePreSelecionada, setUnidadePreSelecionada] = useState(null);

  useEffect(() => {
    if (activeTab === 'unidades') {
      carregarUnidades();
    } else {
      carregarSetores();
    }
  }, [activeTab, searchTerm, empresaFilter, unidadeFilter]);

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

  const carregarUnidades = async () => {
    try {
      setLoading(true);
      const data = await unidadeService.listar({
        search: searchTerm,
        empresa_id: empresaFilter || undefined,
        limit: 100,
      });
      setUnidades(data.data);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      alert('Erro ao carregar unidades');
    } finally {
      setLoading(false);
    }
  };

  const carregarSetores = async () => {
    try {
      setLoading(true);
      const data = await setorService.listar({
        search: searchTerm,
        empresa_id: empresaFilter || undefined,
        unidade_id: unidadeFilter || undefined,
        limit: 100,
      });
      setSetores(data.data);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      alert('Erro ao carregar setores');
    } finally {
      setLoading(false);
    }
  };

  // Carregar unidades para o filtro na aba de setores
  useEffect(() => {
    if (activeTab === 'setores') {
      carregarUnidadesParaFiltro();
    }
  }, [activeTab]);

  const carregarUnidadesParaFiltro = async () => {
    try {
      const data = await unidadeService.listar({ limit: 1000 });
      setUnidades(data.data.filter(u => u.ativo));
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  };

  // Handlers para Unidades
  const handleSaveUnidade = async (formData) => {
    try {
      if (unidadeSelecionada) {
        await unidadeService.atualizar(unidadeSelecionada.id, formData);
        alert('Unidade atualizada com sucesso!');
      } else {
        await unidadeService.criar(formData);
        alert('Unidade criada com sucesso!');
      }
      setModalUnidadeOpen(false);
      setUnidadeSelecionada(null);
      carregarUnidades();
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
      alert(error.response?.data?.error || 'Erro ao salvar unidade');
    }
  };

  const handleToggleStatusUnidade = async (unidade) => {
    if (!confirm(`Deseja ${unidade.ativo ? 'desativar' : 'reativar'} esta unidade?`)) {
      return;
    }

    try {
      if (unidade.ativo) {
        await unidadeService.desativar(unidade.id);
      } else {
        await unidadeService.reativar(unidade.id);
      }
      alert(`Unidade ${unidade.ativo ? 'desativada' : 'reativada'} com sucesso!`);
      carregarUnidades();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert(error.response?.data?.error || 'Erro ao alterar status');
    }
  };

  const handleDeleteUnidade = async (unidade) => {
    if (!confirm(`Tem certeza que deseja DELETAR permanentemente a unidade "${unidade.nome}"?`)) {
      return;
    }

    try {
      await unidadeService.deletar(unidade.id);
      alert('Unidade deletada com sucesso!');
      carregarUnidades();
    } catch (error) {
      console.error('Erro ao deletar unidade:', error);
      alert(error.response?.data?.error || 'Erro ao deletar unidade');
    }
  };

  // Handlers para Setores
  const handleSaveSetor = async (formData) => {
    try {
      if (setorSelecionado) {
        await setorService.atualizar(setorSelecionado.id, formData);
        alert('Setor atualizado com sucesso!');
      } else {
        await setorService.criar(formData);
        alert('Setor criado com sucesso!');
      }
      setModalSetorOpen(false);
      setSetorSelecionado(null);
      setUnidadePreSelecionada(null);
      carregarSetores();
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
      alert(error.response?.data?.error || 'Erro ao salvar setor');
    }
  };

  const handleToggleStatusSetor = async (setor) => {
    if (!confirm(`Deseja ${setor.ativo ? 'desativar' : 'reativar'} este setor?`)) {
      return;
    }

    try {
      if (setor.ativo) {
        await setorService.desativar(setor.id);
      } else {
        await setorService.reativar(setor.id);
      }
      alert(`Setor ${setor.ativo ? 'desativado' : 'reativado'} com sucesso!`);
      carregarSetores();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert(error.response?.data?.error || 'Erro ao alterar status');
    }
  };

  const handleDeleteSetor = async (setor) => {
    if (!confirm(`Tem certeza que deseja DELETAR permanentemente o setor "${setor.nome}"?`)) {
      return;
    }

    try {
      await setorService.deletar(setor.id);
      alert('Setor deletado com sucesso!');
      carregarSetores();
    } catch (error) {
      console.error('Erro ao deletar setor:', error);
      alert(error.response?.data?.error || 'Erro ao deletar setor');
    }
  };

  const isAdmin = user?.perfil === 'administrador';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Building className="w-8 h-8 text-primary" />
            Unidades e Setores
          </h1>
          <p className="text-gray-600 mt-1">
            Organize a estrutura da empresa
          </p>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'unidades') {
              setUnidadeSelecionada(null);
              setModalUnidadeOpen(true);
            } else {
              setSetorSelecionado(null);
              setUnidadePreSelecionada(null);
              setModalSetorOpen(true);
            }
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
        >
          <Plus className="w-5 h-5" />
          {activeTab === 'unidades' ? 'Nova Unidade' : 'Novo Setor'}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('unidades')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'unidades'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Building className="w-5 h-5 inline-block mr-2" />
              Unidades
            </button>
            <button
              onClick={() => setActiveTab('setores')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'setores'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Layers className="w-5 h-5 inline-block mr-2" />
              Setores
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
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

            {/* Filtro por Unidade (apenas na aba setores) */}
            {activeTab === 'setores' && (
              <div className="relative">
                <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <select
                  value={unidadeFilter}
                  onChange={(e) => setUnidadeFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todas as unidades</option>
                  {unidades.map((unidade) => (
                    <option key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : activeTab === 'unidades' ? (
          unidades.length === 0 ? (
            <div className="text-center p-12">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhuma unidade encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {unidades.map((unidade) => (
                <div key={unidade.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {unidade.nome}
                        </h3>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          unidade.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {unidade.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      
                      {isAdmin && (
                        <p className="text-sm text-gray-600 mb-2">
                          {unidade.nome_fantasia || unidade.razao_social}
                        </p>
                      )}
                      
                      {unidade.endereco && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                          <MapPin className="w-4 h-4" />
                          {unidade.endereco}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-sm text-gray-500">
                          {unidade.total_setores || 0} setores
                        </span>
                        <span className="text-sm text-gray-500">
                          {unidade.total_trabalhadores || 0} trabalhadores
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setUnidadePreSelecionada(unidade.id);
                          setModalSetorOpen(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Adicionar Setor"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setUnidadeSelecionada(unidade);
                          setModalUnidadeOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatusUnidade(unidade)}
                        className={`p-2 rounded-lg transition-colors ${
                          unidade.ativo
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={unidade.ativo ? 'Desativar' : 'Reativar'}
                      >
                        {unidade.ativo ? (
                          <PowerOff className="w-5 h-5" />
                        ) : (
                          <Power className="w-5 h-5" />
                        )}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteUnidade(unidade)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          setores.length === 0 ? (
            <div className="text-center p-12">
              <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhum setor encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {setores.map((setor) => (
                <div key={setor.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {setor.nome}
                        </h3>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          setor.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {setor.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Building className="w-4 h-4" />
                        <span>{setor.unidade_nome}</span>
                        {isAdmin && (
                          <>
                            <ChevronRight className="w-4 h-4" />
                            <span>{setor.nome_fantasia || setor.razao_social}</span>
                          </>
                        )}
                      </div>
                      
                      {setor.descricao && (
                        <p className="text-sm text-gray-600 mb-2">
                          {setor.descricao}
                        </p>
                      )}
                      
                      <span className="text-sm text-gray-500">
                        {setor.total_trabalhadores || 0} trabalhadores
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSetorSelecionado(setor);
                          setModalSetorOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatusSetor(setor)}
                        className={`p-2 rounded-lg transition-colors ${
                          setor.ativo
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={setor.ativo ? 'Desativar' : 'Reativar'}
                      >
                        {setor.ativo ? (
                          <PowerOff className="w-5 h-5" />
                        ) : (
                          <Power className="w-5 h-5" />
                        )}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteSetor(setor)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modais */}
      {modalUnidadeOpen && (
        <FormularioUnidade
          unidade={unidadeSelecionada}
          onClose={() => {
            setModalUnidadeOpen(false);
            setUnidadeSelecionada(null);
          }}
          onSave={handleSaveUnidade}
        />
      )}

      {modalSetorOpen && (
        <FormularioSetor
          setor={setorSelecionado}
          unidadePreSelecionada={unidadePreSelecionada}
          onClose={() => {
            setModalSetorOpen(false);
            setSetorSelecionado(null);
            setUnidadePreSelecionada(null);
          }}
          onSave={handleSaveSetor}
        />
      )}
    </div>
  );
};