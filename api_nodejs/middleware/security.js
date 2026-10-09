
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const protecaoCabecalhos = helmet();

export const limiteRequisicoes = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Muitas requisições. Tente novamente mais tarde.'
});
