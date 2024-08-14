import dotenv from "dotenv";
import express from "express";
import adminRoutes from "./routes/admin.routes";
import cors from "cors"
import path from "path";

dotenv.config();
const app = express();

// Configuración para servir archivos estáticos desde la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cors())

app.use("/api/admin", adminRoutes);
// app.use("/api/cliente")

export default app;
