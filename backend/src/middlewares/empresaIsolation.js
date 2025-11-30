// Middleware para garantir isolamento de dados por empresa
const empresaIsolation = (req, res, next) => {
  // Adiciona automaticamente o filtro de empresa_id nas queries
  req.empresaId = req.user.empresa_id;
  next();
};

module.exports = empresaIsolation;