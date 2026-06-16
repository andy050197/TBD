// Middleware de autenticación (placeholder)
module.exports = (req, res, next) => {
  // Por ahora, permitir todas las peticiones sin autenticación
  // Si se necesita, se puede implementar JWT u otro método
  next();
};