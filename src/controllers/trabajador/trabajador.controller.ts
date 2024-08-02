import { Request, Response } from "express";
import { generateToken } from "../../services/token.services";
import { comparePassword, hashPassword } from "../../services/password.service";
import { connection } from "../../db/config.db";
import { Trabajador } from "../../interfaces/trabajador.interface";

// Definir los nombres de los procedimientos almacenados en MySQL
const SP_REGISTRAR_TRABAJADOR =
  "CALL sp_registrar_trabajador(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

export const registerTrabajador = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    imagen_perfil,
    tipo_documento,
    numero_documento,
    pais,
    departamento,
    provincia,
    distrito,
    telefono,
    direccion,
    email,
    password,
    id_almacen,
    id_rol,
  } = req.body;

  try {
    // Validaciones básicas
    if (
      !nombre ||
      !apellido_paterno ||
      !apellido_materno ||
      !tipo_documento ||
      !numero_documento ||
      !pais ||
      !departamento ||
      !provincia ||
      !distrito ||
      !telefono ||
      !direccion ||
      !email ||
      !password ||
      !id_almacen ||
      !id_rol
    ) {
      res.status(400).json({ message: "Todos los campos son obligatorios" });
      return;
    }

    // Hasheamos la contraseña antes de almacenarla en la base de datos
    const hashedPassword = await hashPassword(password);

    // Obtener una conexión del pool
    const conn = await connection.getConnection();

    try {
      // Comenzar una transacción para asegurar la integridad de los datos
      await conn.beginTransaction();

      // Llamada a SP_REGISTER_TRABAJADOR
      const [rows, _] = await conn.query(SP_REGISTRAR_TRABAJADOR, [
        nombre,
        apellido_paterno,
        apellido_materno,
        imagen_perfil,
        tipo_documento,
        numero_documento,
        pais,
        departamento,
        provincia,
        distrito,
        telefono,
        direccion,
        email,
        hashedPassword,
        id_almacen,
        id_rol,
      ]);

      const idPersona = (rows as any)[0][0].idPersona;

      // Finalizar la transacción
      await conn.commit();

      // Construir el objeto del nuevo trabajador registrado
      const newTrabajador: Trabajador = {
        id_persona: idPersona,
        email,
        password: hashedPassword,
        id_almacen,
        id_rol,
      };

      const token = generateToken(newTrabajador);
      res.status(201).json({ token });
    } catch (error: any) {
      // Revertir la transacción en caso de error
      await conn.rollback();
      if (error?.code === "ER_SIGNAL_EXCEPTION") {
        res.status(400).json({
          message: `los datos ingresados: ${error.sqlMessage}`,
        });
        return;
      } else {
        res.status(500).json({ error: "Error en el registro de trabajador" });
      }
    } finally {
      // Siempre liberar la conexión después de usarla
      conn.release();
    }
  } catch (error) {
    console.error("Error en el registro de trabajador:", error);
    res.status(500).json({ error: "Error en el registro de trabajador" });
  }
};


export const loginTrabajador = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
      // Validar que el email y la contraseña estén presentes
      if (!email || !password) {
          res.status(400).json({
              message: "El email y la contraseña son obligatorios",
          });
          return;
      }

      // Obtener una conexión del pool
      const conn = await connection.getConnection();

      try {
          // Consultar el trabajador por email en la base de datos
          const [rows] = await conn.query(
              "SELECT id_persona, email, password, id_almacen, id_rol FROM trabajador WHERE email = ? LIMIT 1",
              [email]
          );

          // Verificar si se encontró un trabajador
          if ((rows as any[]).length === 0) {
              res.status(404).json({
                  error: "Usuario no encontrado",
              });
              return;
          }

          const trabajador: Trabajador = (rows as any)[0] as Trabajador;

          // Verificar la contraseña
          const passwordMatch = await comparePassword(password, trabajador.password);

          if (!passwordMatch) {
              res.status(401).json({
                  error: "Usuario y contraseña incorrectos",
              });
              return;
          }

          // Generar token de autenticación
          const token = generateToken(trabajador);

          // Devolver el token en la respuesta
          res.status(200).json({ token });

      } catch (error) {
          console.error("Error en el login de trabajador:", error);
          res.status(500).json({ error: "Error en el login de trabajador" });
      } finally {
          // Siempre liberar la conexión después de usarla
          conn.release();
      }

  } catch (error) {
      console.error("Error en el login de trabajador:", error);
      res.status(500).json({ error: "Error en el login de trabajador" });
  }
};