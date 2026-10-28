import { Router } from "express";
import { exigirLogin } from "../middleware/auth.js";

import {
  cadastrarSala,
  listarSalas,
  excluirSala,
} from "../controllers/salasController.js";

const router = Router();

// todas as operações exigem login.
router.use(exigirLogin);

router.post("/", cadastrarSala);
router.get("/", listarSalas);
router.delete("/:id", excluirSala);

export default router;