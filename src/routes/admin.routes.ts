import express from "express";
import {
  loginTrabajador,
  registerTrabajador,
} from "../controllers/trabajador/trabajador.controller";
import { authenticateToken } from "../middleware/jwt-auth.middleware";
import categoriaRoutes from "./admin/categoria.routes";

const router = express.Router();

router.post("/login-trabajador", loginTrabajador);
router.post("/register-trabajador", authenticateToken, registerTrabajador);
router.use("/categoria", authenticateToken, categoriaRoutes);

export default router;
