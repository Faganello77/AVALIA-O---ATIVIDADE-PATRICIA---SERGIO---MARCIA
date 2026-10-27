import { Router } from "express";
import { limiteLogin } from "../middleware/security.js";

import {
  login,
  verificarSessao,
  logout,
} from "../controllers/authController.js";

const router = Router();

// Login com limite específico de tentativas.
router.post("/login", limiteLogin, login);

// Consulta da sessão atual.
router.get("/sessao", verificarSessao);

// Encerra a sessão.
router.post("/logout", logout);

export default router;