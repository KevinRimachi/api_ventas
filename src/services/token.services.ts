import jwt from "jsonwebtoken";
import { Trabajador } from "../interfaces/trabajador.interface";
import { Cliente } from "../interfaces/cliente.interface";

const JWT_SECRET = process.env.JWT_SECRET || "my_secret_key%%%";

export const generateToken = (user_auth: Cliente | Trabajador): string => {
  return jwt.sign({ id: user_auth.id, email: user_auth.email }, JWT_SECRET, {
    expiresIn: "2h",
  });
};
