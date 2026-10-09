
import { Router } from 'express';
import {
  cadastrarLaboratorio,
  listarLaboratorios
} from '../controllers/laboratoriosController.js';

const router = Router();

router.post('/', cadastrarLaboratorio);
router.get('/', listarLaboratorios);

export default router;
