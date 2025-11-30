import api from './api';

export const trabalhadorService = {
  async listar(params = {}) {
    const response = await api.get('/trabalhadores', { params });
    return response.data;
  },

  async buscarPorId(id) {
    const response = await api.get(`/trabalhadores/${id}`);
    return response.data;
  },

  async criar(data) {
    const response = await api.post('/trabalhadores', data);
    return response.data;
  },

  async atualizar(id, data) {
    const response = await api.put(`/trabalhadores/${id}`, data);
    return response.data;
  },

  async desativar(id) {
    const response = await api.patch(`/trabalhadores/${id}/desativar`);
    return response.data;
  },

  async reativar(id) {
    const response = await api.patch(`/trabalhadores/${id}/reativar`);
    return response.data;
  },

  async deletar(id) {
    const response = await api.delete(`/trabalhadores/${id}`);
    return response.data;
  },
};