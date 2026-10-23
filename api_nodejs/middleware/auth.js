// Verifica se o usuário está autenticado
export function exigirLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      mensagem: 'Você precisa fazer login para acessar este recurso.'
    });
  }

  next();
}