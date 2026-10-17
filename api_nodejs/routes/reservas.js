import express from "express";

import {
  cadastrarReserva,
  listarReservas,
  excluirReserva
} from "../controllers/reservasController.js";

const router = express.Router();

router.get("/", listarReservas);
router.post("/", cadastrarReserva);
router.delete("/:id", excluirReserva);

export default router;