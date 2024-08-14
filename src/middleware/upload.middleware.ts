import multer from "multer";
import path from "path";

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/"); // Carpeta para archivos subidos
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Usa el nombre original del archivo
  },
});

// Filtro para archivos CSV con nombre específico
const fileFilter = (req: any, file: any, cb: any) => {
  const expectedFilename = "carga_productos.csv";
  if (
    file.originalname !== expectedFilename ||
    !file.originalname.match(/\.(csv)$/)
  ) {
    return cb(
      new Error(
        `El archivo debe llamarse ${expectedFilename} y ser un archivo CSV`
      ),
      false
    );
  }
  cb(null, true);
};

// Configuración de multer
const upload = multer({ storage, fileFilter });

export const uploadMiddleware = upload.single("file");
