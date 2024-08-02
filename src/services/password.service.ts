import bcrypt from "bcrypt";

const SALT_ROUNDS: number = 10;

// leemos y encriptamos la contraseña ingresada
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// leer y compara el password
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
