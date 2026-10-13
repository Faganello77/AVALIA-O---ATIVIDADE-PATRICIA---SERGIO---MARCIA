
import { Router } from 'express';
import {
  cadastrarUsuario,
  listarUsuarios,
  excluirUsuario
} from '../controllers/usuariosController.js';

const router = Router();

router.post('/', cadastrarUsuario);
router.get('/', listarUsuarios);
router.delete('/:id', excluirUsuario);

export default router;
