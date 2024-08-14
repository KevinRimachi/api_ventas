import { Request, Response, NextFunction } from "express";
import { uploadMiddleware } from "../../../middleware/upload.middleware";
import { connection } from "../../../db/config.db";
import { Producto } from "../../../interfaces/producto.interface";
import { parse } from "fast-csv";
import fs from "fs";
import path from "path";
import {
  handleMulterError,
  uploadSingleImage,
} from "../../../middleware/image-upload.middleware";

const SP_REGISTRAR_PRODUCTO = "CALL sp_registrar_producto(?, ?, ?, ?, ?, ?, ?)";

export const cargaProductos = async (req: Request, res: Response) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: err.message || "Error al procesar el archivo" });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se ha subido ningún archivo" });
    }

    const filePath = path.resolve(req.file.path);

    try {
      const products: Producto[] = [];
      const duplicados: Producto[] = [];

      fs.createReadStream(filePath)
        .pipe(parse({ headers: true, skipEmptyLines: true } as any)) // Cast to `any` to bypass TypeScript issue
        .on("data", (row: any) => {
          // Convertir el objeto a la interfaz Producto
          const product: Producto = {
            nombre_producto: row.nombre_producto,
            descripcion: row.descripcion || null,
            precio: parseFloat(row.precio),
            cantidad_stock: parseInt(row.cantidad_stock, 10),
            estado: row.estado,
            id_categoria: parseInt(row.id_categoria, 10),
            id_almacen: parseInt(row.id_almacen, 10),
          };
          products.push(product);
        })
        .on("end", async () => {
          try {
            await Promise.all(
              products.map(async (product) => {
                const [result] = await connection.query(
                  "CALL sp_cargar_productos(?, ?, ?, ?, ?, ?, ?, @p_duplicado)",
                  [
                    product.nombre_producto,
                    product.descripcion,
                    product.precio,
                    product.cantidad_stock,
                    product.estado,
                    product.id_categoria,
                    product.id_almacen,
                  ]
                );

                // Extraer el valor del parámetro de salida
                const [[{ p_duplicado }]]: any = await connection.query(
                  "SELECT @p_duplicado AS p_duplicado"
                );

                if (p_duplicado === 1) {
                  duplicados.push(product);
                }
              })
            );

            // Eliminar el archivo
            fs.unlinkSync(filePath);

            if (duplicados.length === products.length) {
              // Todos los productos son duplicados
              res.status(200).json({
                message:
                  "Los datos son correcto. Pero todos los productos en el archivo fueron identificados como duplicados y no se registro en la base de datos.",
                duplicados,
              });
            } else if (duplicados.length > 0) {
              // Algunos productos son duplicados
              res.status(200).json({
                message:
                  "Los datos son correcto. Algunos productos fueron identificados como duplicados y no se registro en la base de datos.",
                duplicados,
              });
            } else {
              // Ningún producto es duplicado
              res.status(200).json({
                message: "Archivo subido y datos procesados con éxito",
              });
            }
          } catch (error) {
            res.status(500).json({ error: "Error al procesar los datos." });
            console.error(error);
          }
        });
    } catch (error) {
      res.status(500).json({ error: "Error al procesar el archivo." });
      console.error(error);
    }
  });
};

export const insertarProductos = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }

    console.log("Archivo recibido:", req.file);

    const {
      nombre_producto,
      descripcion,
      precio,
      cantidad_stock,
      id_categoria,
      id_almacen,
    }: Producto = req.body;

    const imagen_producto = req.file ? req.file.buffer : null;

    if (
      !nombre_producto ||
      !descripcion ||
      !precio ||
      !cantidad_stock ||
      !id_categoria ||
      !id_almacen
    ) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    try {
      const [rows] = await connection.query(
        "SELECT * FROM productos WHERE nombre_producto = ? AND id_categoria = ? AND id_almacen = ?",
        [nombre_producto, id_categoria, id_almacen]
      );

      if ((rows as any[]).length > 0) {
        return res.status(400).json({
          message:
            "El producto ya existe en la categoría y almacén seleccionados",
        });
      }

      await connection.query(SP_REGISTRAR_PRODUCTO, [
        nombre_producto,
        descripcion || null,
        precio,
        cantidad_stock,
        id_categoria,
        id_almacen,
        imagen_producto || null,
      ]);

      const newProducto: Producto = {
        nombre_producto,
        descripcion,
        precio,
        cantidad_stock,
        id_categoria,
        id_almacen,
        imagen_producto: imagen_producto
          ? imagen_producto.toString("base64")
          : undefined,
      };

      res.status(201).json({
        message: "Producto registrado exitosamente",
        producto: newProducto,
      });
    } catch (error) {
      console.error("Error al registrar el producto:", error);
      res
        .status(500)
        .json({ message: "Error al registrar el producto", error });
    }
  });
};

export const actualizarProducto = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }

    const id = req.params.id; // Obtener ID desde los parámetros de la URL
    const {
      nombre_producto,
      descripcion,
      precio,
      cantidad_stock,
      id_categoria,
      id_almacen,
    }: Partial<Producto> = req.body; // Permitir campos opcionales
    const imagen_producto = req.file ? req.file.buffer : null; // Buffer de imagen

    // Validar que se haya proporcionado el ID del producto
    if (!id) {
      return res
        .status(400)
        .json({ message: "El ID del producto es obligatorio" });
    }

    try {
      // Llamar al procedimiento almacenado
      await connection.query(
        "CALL sp_actualizar_producto(?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id,
          nombre_producto || null,
          descripcion || null,
          precio || null,
          cantidad_stock || null,
          id_categoria || null,
          id_almacen || null,
          imagen_producto || null,
        ]
      );

      // Obtener el producto actualizado desde la base de datos
      const [updatedRows] = await connection.query(
        "SELECT * FROM productos WHERE id = ?",
        [id]
      );
      const updatedProducto = (updatedRows as any[])[0];

      // Crear el objeto de respuesta con los campos actualizados
      const updatedResponse: Partial<Producto> = {};
      Object.keys(req.body).forEach((key) => {
        updatedResponse[key as keyof Producto] = updatedProducto[key];
      });

      res.status(200).json({
        message: `Producto "${updatedProducto.nombre_producto}" actualizado exitosamente`,
        producto: updatedResponse,
      });
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      res
        .status(500)
        .json({ message: "Error al actualizar el producto", error });
    }
  });
};

export const obtenerProductos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Realizar la consulta con JOIN para obtener el nombre de la categoría
    const [rows] = await connection.query(`
      SELECT p.id, p.nombre_producto, c.nombre_categoria AS categoria, p.precio, p.estado
      FROM productos p
      JOIN categorias c ON p.id_categoria = c.id
    `);

    res.status(200).json({ productos: rows });
  } catch (error) {
    console.error("Error al obtener los productos básicos:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los productos básicos", error });
  }
};

export const obtenerDetallesProducto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {id} = req.params;

    // Consultar el producto por ID
    const [[producto]]: any = await connection.query(
      "SELECT nombre_producto, id_categoria, precio, estado, cantidad_stock, imagen_producto FROM productos WHERE id = ?",
      [id]
    );

    if (!producto) {
      res.status(404).json({ message: "Producto no encontrado" });
      return;
    }

    // Enviar la información del producto
    res.status(200).json(producto);
  } catch (error) {
    console.error("Error al obtener los detalles del producto:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los detalles del producto", error });
  }
};
