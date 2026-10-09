
import { Router } from 'express';
import { listarStatus } from '../controllers/statusController.js';

const router = Router();

router.get('/', listarStatus);

export default router;
