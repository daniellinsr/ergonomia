import api from './api';

const relatoriosService = {
  inventarioRiscos: (params) => api.get('/relatorios/inventario-riscos', { params }),
  estatisticasGerais: () => api.get('/relatorios/estatisticas-gerais'),
  relatorioPorSetor: () => api.get('/relatorios/por-setor'),
  relatorioPorTrabalhador: (params) => api.get('/relatorios/por-trabalhador', { params }),
  relatorioConsolidado: () => api.get('/relatorios/consolidado'),
};

export default relatoriosService;
