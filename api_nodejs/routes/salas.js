
import { Router } from 'express';
import {
  cadastrarSala,
  listarSalas
} from '../controllers/salasController.js';

const router = Router();

router.post('/', cadastrarSala);
router.get('/', listarSalas);

export default router;
