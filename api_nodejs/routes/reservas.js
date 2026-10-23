import express from "express";

import { exigirLogin } from "../middleware/auth.js";

import {
  cadastrarReserva,
  listarReservas,
  excluirReserva
} from "../controllers/reservasController.js";

const router = express.Router();

// Todas essas operações exigem login
router.get("/", exigirLogin, listarReservas);
router.post("/", exigirLogin, cadastrarReserva);
router.delete("/:id", exigirLogin, excluirReserva);

export default router;