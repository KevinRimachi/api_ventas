import {NextFunction, Request, Response} from 'express' 
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'my_secret_key%%%'

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      error: "No autorizado",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decode) => {
    if (err) {
      console.error("Error en la autenticacion: ", err);
      return res.status(403).json({
        error: "no tienes acceso a este recurso",
      });
    }

    next();
  });
}