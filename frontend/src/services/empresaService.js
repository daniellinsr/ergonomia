import api from './api';

export const empresaService = {
  async listar(params = {}) {
    const response = await api.get('/empresas', { params });
    return response.data;
  },

  async buscarPorId(id) {
    const response = await api.get(`/empresas/${id}`);
    return response.data;
  },

  async criar(data) {
    const response = await api.post('/empresas', data);
    return response.data;
  },

  async atualizar(id, data) {
    const response = await api.put(`/empresas/${id}`, data);
    return response.data;
  },

  async desativar(id) {
    const response = await api.patch(`/empresas/${id}/desativar`);
    return response.data;
  },

  async reativar(id) {
    const response = await api.patch(`/empresas/${id}/reativar`);
    return response.data;
  },

  async deletar(id) {
    const response = await api.delete(`/empresas/${id}`);
    return response.data;
  },
};