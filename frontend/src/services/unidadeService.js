import api from './api';

export const unidadeService = {
  async listar(params = {}) {
    const response = await api.get('/unidades', { params });
    return response.data;
  },

  async buscarPorId(id) {
    const response = await api.get(`/unidades/${id}`);
    return response.data;
  },

  async criar(data) {
    const response = await api.post('/unidades', data);
    return response.data;
  },

  async atualizar(id, data) {
    const response = await api.put(`/unidades/${id}`, data);
    return response.data;
  },

  async desativar(id) {
    const response = await api.patch(`/unidades/${id}/desativar`);
    return response.data;
  },

  async reativar(id) {
    const response = await api.patch(`/unidades/${id}/reativar`);
    return response.data;
  },

  async deletar(id) {
    const response = await api.delete(`/unidades/${id}`);
    return response.data;
  },
};