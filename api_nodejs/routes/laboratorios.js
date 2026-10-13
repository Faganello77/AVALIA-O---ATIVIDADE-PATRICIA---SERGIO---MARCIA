
import { Router } from 'express';
import {
  cadastrarLaboratorio,
  listarLaboratorios,
  excluirLaboratorio
} from '../controllers/laboratoriosController.js';

const router = Router();

router.post('/', cadastrarLaboratorio);
router.get('/', listarLaboratorios);
router.delete('/:id', excluirLaboratorio);

export default router;
