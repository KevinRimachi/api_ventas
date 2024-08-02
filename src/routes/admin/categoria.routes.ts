import express from "express"
import { actualizarCategoria, eliminarCategoria, obtenerCategoriaPorId, obtenerCategorias, registrarCategoria} from "../../controllers/admin/categorias/categorias.controller"

const router = express.Router()

router.post('/registrar-categoria', registrarCategoria)
router.get('/obtener-categoria', obtenerCategorias)
router.get('/obtener-categoria/:id', obtenerCategoriaPorId)
router.put('/actualizar-categoria/:id', actualizarCategoria)
router.delete('/eliminar-categoria/:id', eliminarCategoria)

export default router;