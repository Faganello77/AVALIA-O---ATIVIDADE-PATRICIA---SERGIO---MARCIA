import helmet from "helmet";
import rateLimit from "express-rate-limit";

// protege os cabeçalhos.
export const protecaoCabecalhos = helmet();

// limite geral da API.
export const limiteRequisicoes = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    mensagem: "Muitas requisições. Aguarde um pouco e tente novamente.",
  },
});

// limite específico para tentativas de login.
export const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    mensagem:
      "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
  },
});