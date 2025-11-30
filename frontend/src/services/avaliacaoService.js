import api from './api';

export const avaliacaoService = {
  async listar(params = {}) {
    const response = await api.get('/avaliacoes', { params });
    return response.data;
  },

  async buscarPorId(id) {
    const response = await api.get(`/avaliacoes/${id}`);
    return response.data;
  },

  async criar(data) {
    const response = await api.post('/avaliacoes', data);
    return response.data;
  },

  async togglePerigo(avaliacaoId, perigoId, identificado) {
    const response = await api.patch(`/avaliacoes/${avaliacaoId}/perigo/${perigoId}`, {
      identificado,
    });
    return response.data;
  },

  async classificarRisco(avaliacaoId, perigoIdentificadoId, data) {
    const response = await api.post(
      `/avaliacoes/${avaliacaoId}/perigo/${perigoIdentificadoId}/classificar`,
      data
    );
    return response.data;
  },

  async finalizar(id) {
    const response = await api.patch(`/avaliacoes/${id}/finalizar`);
    return response.data;
  },

  async reabrir(id) {
    const response = await api.patch(`/avaliacoes/${id}/reabrir`);
    return response.data;
  },

  async deletar(id) {
    const response = await api.delete(`/avaliacoes/${id}`);
    return response.data;
  },
};
