import { Router } from "express";
import { exigirLogin } from "../middleware/auth.js";

import {
  cadastrarUsuario,
  listarUsuarios,
  excluirUsuario,
} from "../controllers/usuariosController.js";

const router = Router();

// todas as operações exigem login.
router.use(exigirLogin);

router.post("/", cadastrarUsuario);
router.get("/", listarUsuarios);
router.delete("/:id", excluirUsuario);

export default router;