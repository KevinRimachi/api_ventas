export interface Persona {
  id: number;
  nombre: string;
  id_direccion: number | null;
  id_documento: number | null;
  telefono: string | null;
  imagen_perfil: ArrayBuffer | null; // Suponiendo que 'imagen_perfil' es un LONGBLOB
  direccion: string | null;
  estado: string;
}