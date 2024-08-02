import { Request, Response } from "express";
import { connection } from "../../../db/config.db";
import { Categoria } from "../../../interfaces/categoria.interface";

const CATEGORY_NOT_FOUND_MESSAGE = "Categoría no encontrada";
const CATEGORY_ALREADY_EXISTS_MESSAGE = "La categoría ya existe";
const CATEGORY_REQUIRED_MESSAGE = "El nombre de la categoría es obligatorio";
const DATABASE_ERROR_MESSAGE = "Error en la base de datos";

const validateCategoryName = (nombre_categoria: string) => {
  if (!nombre_categoria) {
    return CATEGORY_REQUIRED_MESSAGE;
  }
  return;
};

export const registrarCategoria = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { nombre_categoria } = req.body;

  const validationError = validateCategoryName(nombre_categoria);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const [categoriaExistente] = await connection.execute(
      "SELECT * FROM categorias WHERE nombre_categoria = ?",
      [nombre_categoria]
    );

    if ((categoriaExistente as any).length > 0) {
      res.status(400).json({ message: CATEGORY_ALREADY_EXISTS_MESSAGE });
      return;
    }

    await connection.execute(
      "INSERT INTO categorias (nombre_categoria) VALUES (?)",
      [nombre_categoria]
    );

    const nuevaCategoria: Categoria = { nombre_categoria };
    res.status(201).json({
      message: "Categoría registrada exitosamente",
      categoria: nuevaCategoria,
    });
  } catch (error) {
    res.status(500).json({ message: `${DATABASE_ERROR_MESSAGE}: ${error}` });
  }
};

export const obtenerCategorias = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await connection.execute("SELECT * FROM categorias");
    const categorias: Categoria[] = (rows as any).map((row: any) => ({
      id: row.id,
      nombre_categoria: row.nombre_categoria,
    }));

    res.status(200).json({ categorias });
  } catch (error) {
    res.status(500).json({ message: `${DATABASE_ERROR_MESSAGE}: ${error}` });
  }
};

export const obtenerCategoriaPorId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute(
      "SELECT * FROM categorias WHERE id = ?",
      [id]
    );

    if ((rows as any).length === 0) {
      res.status(404).json({ message: CATEGORY_NOT_FOUND_MESSAGE });
      return;
    }

    const categoria: Categoria = (rows as any)[0];
    res.status(200).json({ categoria });
  } catch (error) {
    res.status(500).json({ message: `${DATABASE_ERROR_MESSAGE}: ${error}` });
  }
};

export const actualizarCategoria = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { nombre_categoria } = req.body;

  const validationError = validateCategoryName(nombre_categoria);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const [result] = await connection.execute(
      "UPDATE categorias SET nombre_categoria = ? WHERE id = ?",
      [nombre_categoria, id]
    );

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ message: CATEGORY_NOT_FOUND_MESSAGE });
      return;
    }

    const categoriaActualizada: Categoria = {
      id: parseInt(id, 10),
      nombre_categoria,
    };
    res.status(200).json({
      message: "Categoría actualizada exitosamente",
      categoria: categoriaActualizada,
    });
  } catch (error) {
    res.status(500).json({ message: `${DATABASE_ERROR_MESSAGE}: ${error}` });
  }
};

export const eliminarCategoria = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const [result] = await connection.execute(
      "DELETE FROM categorias WHERE id = ?",
      [id]
    );

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ message: CATEGORY_NOT_FOUND_MESSAGE });
      return;
    }

    res.status(200).json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: `${DATABASE_ERROR_MESSAGE}: ${error}` });
  }
};
