import express from "express"
import { actualizarProducto, cargaProductos, insertarProductos, obtenerDetallesProducto, obtenerProductos } from "../../controllers/admin/productos/producto.controller"

const router = express.Router()

router.post('/cargar-productos', cargaProductos)
router.get('/obtener-productos', obtenerProductos)
router.get('/obtener-detalle-producto/:id', obtenerDetallesProducto)
router.post('/crear-producto', insertarProductos)
router.put('/editar-producto/:id', actualizarProducto)

export default router