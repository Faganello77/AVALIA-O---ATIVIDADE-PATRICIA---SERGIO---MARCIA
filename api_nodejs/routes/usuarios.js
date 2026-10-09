
import { Router } from 'express';
import {
  cadastrarUsuario,
  listarUsuarios
} from '../controllers/usuariosController.js';

const router = Router();

router.post('/', cadastrarUsuario);
router.get('/', listarUsuarios);

export default router;
