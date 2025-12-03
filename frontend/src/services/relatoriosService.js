import api from './api';

const relatoriosService = {
  inventarioRiscos: (params) => api.get('/relatorios/inventario-riscos', { params }),
  estatisticasGerais: () => api.get('/relatorios/estatisticas-gerais'),
  relatorioPorSetor: () => api.get('/relatorios/por-setor'),
  relatorioAvaliacoesPorSetor: (params) => api.get('/relatorios/avaliacoes-por-setor', { params }),
  relatorioDetalhadoAvaliacoes: (params) => api.get('/relatorios/avaliacoes-detalhado', { params }),
  relatorioConsolidado: () => api.get('/relatorios/consolidado'),
};

export default relatoriosService;
