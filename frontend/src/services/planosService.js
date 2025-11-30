import api from './api';

const planosService = {
  // Planos 5W2H
  planos5w2h: {
    listar: (params) => api.get('/planos5w2h', { params }),
    buscarPorId: (id) => api.get(`/planos5w2h/${id}`),
    criar: (data) => api.post('/planos5w2h', data),
    atualizar: (id, data) => api.put(`/planos5w2h/${id}`, data),
    atualizarProgresso: (id, data) => api.patch(`/planos5w2h/${id}/progresso`, data),
    excluir: (id) => api.delete(`/planos5w2h/${id}`),
    estatisticas: () => api.get('/planos5w2h/estatisticas'),
  },

  // Ações Corretivas
  acoesCorretivas: {
    listar: (params) => api.get('/acoes-corretivas', { params }),
    buscarPorId: (id) => api.get(`/acoes-corretivas/${id}`),
    criar: (data) => api.post('/acoes-corretivas', data),
    atualizar: (id, data) => api.put(`/acoes-corretivas/${id}`, data),
    atualizarProgresso: (id, data) => api.patch(`/acoes-corretivas/${id}/progresso`, data),
    excluir: (id) => api.delete(`/acoes-corretivas/${id}`),
    estatisticas: () => api.get('/acoes-corretivas/estatisticas'),
  },

  // Ciclos PDCA
  ciclosPDCA: {
    listar: (params) => api.get('/ciclos-pdca', { params }),
    buscarPorId: (id) => api.get(`/ciclos-pdca/${id}`),
    criar: (data) => api.post('/ciclos-pdca', data),
    atualizar: (id, data) => api.put(`/ciclos-pdca/${id}`, data),
    avancarFase: (id) => api.patch(`/ciclos-pdca/${id}/avancar-fase`),
    atualizarProgresso: (id, data) => api.patch(`/ciclos-pdca/${id}/progresso`, data),
    excluir: (id) => api.delete(`/ciclos-pdca/${id}`),
    estatisticas: () => api.get('/ciclos-pdca/estatisticas'),
  },
};

export default planosService;
