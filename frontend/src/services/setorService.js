import api from './api';

export const setorService = {
  async listar(params = {}) {
    const response = await api.get('/setores', { params });
    return response.data;
  },

  async criar(data) {
    const response = await api.post('/setores', data);
    return response.data;
  },

  async atualizar(id, data) {
    const response = await api.put(`/setores/${id}`, data);
    return response.data;
  },

  async desativar(id) {
    const response = await api.patch(`/setores/${id}/desativar`);
    return response.data;
  },

  async reativar(id) {
    const response = await api.patch(`/setores/${id}/reativar`);
    return response.data;
  },

  async deletar(id) {
    const response = await api.delete(`/setores/${id}`);
    return response.data;
  },
};