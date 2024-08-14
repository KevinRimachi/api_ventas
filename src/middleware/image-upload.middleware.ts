import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes JPEG y PNG.') as any, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limita el tamaño del archivo a 5 MB
  }
});

export const uploadSingleImage = upload.single('imagen_producto');

export const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El tamaño del archivo excede el límite permitido de 5 MB.' });
    }
    return res.status(400).json({ message: `Error en la carga del archivo: ${err.message}` });
  }
  // Otros errores
  return res.status(500).json({ message: 'Error en el servidor.' });
};