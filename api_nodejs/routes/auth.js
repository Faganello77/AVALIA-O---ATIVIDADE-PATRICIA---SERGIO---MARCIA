import { Router } from 'express';

import {
  login,
  verificarSessao,
  logout
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.get('/sessao', verificarSessao);
router.post('/logout', logout);

export default router;