import api from './api';

export const authService = {
  async login(email, senha) {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async me() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};