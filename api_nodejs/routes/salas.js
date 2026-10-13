
import { Router } from 'express';
import {
  cadastrarSala,
  listarSalas,
  excluirSala
} from '../controllers/salasController.js';

const router = Router();

router.post('/', cadastrarSala);
router.get('/', listarSalas);
router.delete('/:id', excluirSala);

export default router;
