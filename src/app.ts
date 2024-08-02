import dotenv from "dotenv";
import express from "express";
import adminRoutes from "./routes/admin.routes";
import cors from "cors"

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors())

app.use("/api/admin", adminRoutes);
// app.use("/api/cliente")

export default app;
