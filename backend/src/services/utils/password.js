import argon2 from "argon2";

// Contraseñas: nunca se guardan en claro, solo su hash con Argon2id.
// El hash ya incluye la sal y los parámetros, así que verify no necesita nada más

export const hashPassword = (password) => {
  return argon2.hash(password, { type: argon2.argon2id });
};

// true si la contraseña coincide con el hash. Un hash con formato incorrecto cuenta como no válido
export const verifyPassword = async (password, hash) => {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
};
