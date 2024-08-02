export interface Trabajador  {
  id?: number,
  id_persona: number,
  email: string,
  password: string,
  id_almacen: number | null,
  id_rol: number,
}