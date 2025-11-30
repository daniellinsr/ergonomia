// Opções de Severidade
export const SEVERIDADES = [
  { value: 'Inexistente', label: 'Inexistente', peso: 1, color: 'bg-gray-100 text-gray-800' },
  { value: 'Levemente Prejudicial', label: 'Levemente Prejudicial', peso: 2, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Prejudicial', label: 'Prejudicial', peso: 3, color: 'bg-orange-100 text-orange-800' },
  { value: 'Extremamente Prejudicial', label: 'Extremamente Prejudicial', peso: 10, color: 'bg-red-100 text-red-800' },
];

// Opções de Tempo de Exposição
export const TEMPOS_EXPOSICAO = [
  { value: 'Curto', label: 'Curto (até 2 horas)', horas: 'Até 2 horas' },
  { value: 'Médio', label: 'Médio (2 a 4 horas)', horas: 'De 2 a 4 horas' },
  { value: 'Longo', label: 'Longo (mais de 4 horas)', horas: 'Mais de 4 horas' },
];

// Opções de Intensidade
export const INTENSIDADES = [
  { value: 'Baixa', label: 'Baixa' },
  { value: 'Média', label: 'Média' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Altíssima', label: 'Altíssima' },
];

// Matriz de Probabilidade
const MATRIZ_PROBABILIDADE = {
  'Curto': {
    'Baixa': { probabilidade: 'Baixa', peso: 0.5 },
    'Média': { probabilidade: 'Baixa', peso: 0.5 },
    'Alta': { probabilidade: 'Média', peso: 1 },
    'Altíssima': { probabilidade: 'Alta', peso: 1.5 }
  },
  'Médio': {
    'Baixa': { probabilidade: 'Baixa', peso: 0.5 },
    'Média': { probabilidade: 'Média', peso: 1 },
    'Alta': { probabilidade: 'Alta', peso: 1.5 },
    'Altíssima': { probabilidade: 'Altíssima', peso: 2 }
  },
  'Longo': {
    'Baixa': { probabilidade: 'Média', peso: 1 },
    'Média': { probabilidade: 'Alta', peso: 1.5 },
    'Alta': { probabilidade: 'Altíssima', peso: 2 },
    'Altíssima': { probabilidade: 'Altíssima', peso: 2 }
  }
};

// Calcular probabilidade
export const calcularProbabilidade = (tempoExposicao, intensidade) => {
  if (!tempoExposicao || !intensidade) return null;
  return MATRIZ_PROBABILIDADE[tempoExposicao]?.[intensidade] || null;
};

// Calcular nível de risco
export const calcularNivelRisco = (severidade, probabilidade) => {
  const sev = SEVERIDADES.find(s => s.value === severidade);
  const prob = calcularProbabilidade(probabilidade?.tempo, probabilidade?.intensidade);
  
  if (!sev || !prob) return null;
  
  const nivel = sev.peso * prob.peso;
  
  let classificacao = '';
  let cor = '';
  
  if (nivel <= 1) {
    classificacao = 'Trivial';
    cor = 'bg-green-100 text-green-800';
  } else if (nivel <= 3) {
    classificacao = 'Tolerável';
    cor = 'bg-blue-100 text-blue-800';
  } else if (nivel <= 6) {
    classificacao = 'Moderado';
    cor = 'bg-yellow-100 text-yellow-800';
  } else if (nivel <= 12) {
    classificacao = 'Substancial';
    cor = 'bg-orange-100 text-orange-800';
  } else {
    classificacao = 'Intolerável';
    cor = 'bg-red-100 text-red-800';
  }
  
  return { nivel, classificacao, cor };
};

// Agrupar perigos por categoria
export const agruparPerigosPorCategoria = (perigos) => {
  const grupos = {
    'Biomecânicos': [],
    'Mobiliário/Equipamentos': [],
    'Organização/Cognitivo/Psicossociais': [],
    'Condições Ambientais': [],
  };
  
  perigos.forEach(perigo => {
    if (grupos[perigo.categoria]) {
      grupos[perigo.categoria].push(perigo);
    }
  });
  
  return grupos;
};

// Obter cor do status
export const getStatusColor = (status) => {
  const cores = {
    'em_andamento': 'bg-blue-100 text-blue-800',
    'concluida': 'bg-green-100 text-green-800',
    'cancelada': 'bg-red-100 text-red-800',
  };
  return cores[status] || 'bg-gray-100 text-gray-800';
};

// Obter label do status
export const getStatusLabel = (status) => {
  const labels = {
    'em_andamento': 'Em Andamento',
    'concluida': 'Concluída',
    'cancelada': 'Cancelada',
  };
  return labels[status] || status;
};