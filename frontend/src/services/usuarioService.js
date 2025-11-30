import api from './api';

export const usuarioService = {
  async listar(params = {}) {
    const response = await api.get('/usuarios', { params });
    return response.data;
  },

  async buscarPorId(id) {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  async criar(data) {
    const response = await api.post('/usuarios', data);
    return response.data;
  },

  async atualizar(id, data) {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  },

  async desativar(id) {
    const response = await api.patch(`/usuarios/${id}/desativar`);
    return response.data;
  },

  async reativar(id) {
    const response = await api.patch(`/usuarios/${id}/reativar`);
    return response.data;
  },

  async deletar(id) {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  },
};
