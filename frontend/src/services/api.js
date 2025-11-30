import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
  timeout: 10000, // 10 segundos timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ignora erros de requisições canceladas/abortadas
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      // Só redireciona se não estiver já na página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;