import { Router } from "express";
import { exigirLogin } from "../middleware/auth.js";

import {
  cadastrarLaboratorio,
  listarLaboratorios,
  excluirLaboratorio,
} from "../controllers/laboratoriosController.js";

const router = Router();

// todas as operações exigem login.
router.use(exigirLogin);

router.post("/", cadastrarLaboratorio);
router.get("/", listarLaboratorios);
router.delete("/:id", excluirLaboratorio);

export default router;