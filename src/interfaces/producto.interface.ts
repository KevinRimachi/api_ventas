export interface Producto {
  id?: number;
  nombre_producto: string;
  descripcion: string | null;
  precio: number;
  cantidad_stock: number;
  estado?: string;
  id_categoria: number;
  id_almacen: number;
  imagen_producto?: string | null
}