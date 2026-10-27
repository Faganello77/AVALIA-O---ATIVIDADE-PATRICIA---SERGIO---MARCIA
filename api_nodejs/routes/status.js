import { Router } from "express";
import { exigirLogin } from "../middleware/auth.js";
import { listarStatus } from "../controllers/statusController.js";

const router = Router();

// Consultar os status também exige login.
router.use(exigirLogin);

router.get("/", listarStatus);

export default router;