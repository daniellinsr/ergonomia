// Função para calcular probabilidade baseado em tempo e intensidade
const calcularProbabilidade = (tempoExposicao, intensidade) => {
  const matriz = {
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

  return matriz[tempoExposicao]?.[intensidade] || { probabilidade: 'Baixa', peso: 0.5 };
};

// Função para calcular nível de risco
const calcularNivelRisco = (pesoSeveridade, pesoProbabilidade) => {
  const nivelRisco = pesoSeveridade * pesoProbabilidade;
  
  let classificacao = '';
  if (nivelRisco <= 1) classificacao = 'Trivial';
  else if (nivelRisco <= 3) classificacao = 'Tolerável';
  else if (nivelRisco <= 6) classificacao = 'Moderado';
  else if (nivelRisco <= 12) classificacao = 'Substancial';
  else classificacao = 'Intolerável';

  return { nivelRisco, classificacao };
};

// Mapeamento de severidade para peso
const severidadePesos = {
  'Inexistente': 1,
  'Levemente Prejudicial': 2,
  'Prejudicial': 3,
  'Extremamente Prejudicial': 10
};

module.exports = {
  calcularProbabilidade,
  calcularNivelRisco,
  severidadePesos
};