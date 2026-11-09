import jwt from "jsonwebtoken";
import AppError from "./AppError.js";

// Creación y verificación de los JWT.
// SECRET (firma) y JWT_EXPIRES_IN (caducidad) vienen del .env: nunca se escriben en el código

const ALGORITHM = "HS256";

const getSecret = () => {
  if (!process.env.SECRET) {
    throw new AppError("Falta la variable SECRET en el .env", 500);
  }
  return process.env.SECRET;
};

// Caducidad del token: "1h", "7d"... (por defecto 7 días)
export const getExpires = () => process.env.JWT_EXPIRES_IN || "7d";

// Crea un token firmado con el id del usuario (sub), su email y su rol.
// tokenVersion sirve para el logout: al salir se incrementa y los tokens anteriores dejan de valer
export const createToken = ({ id, email, role, tokenVersion = 0 }) => {
  return jwt.sign({ email, role, tokenVersion }, getSecret(), {
    subject: String(id),
    expiresIn: getExpires(),
    algorithm: ALGORITHM,
  });
};

// Verifica la firma con SECRET y la caducidad (exp) y devuelve el payload.
// Si el token no es válido, ha caducado o le falta el email o el rol → 401
export const verifyToken = (token) => {
  const secret = getSecret();

  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  } catch {
    throw new AppError("Tienes que iniciar sesión", 401);
  }

  if (!payload.sub || !payload.email || !payload.role) {
    throw new AppError("Tienes que iniciar sesión", 401);
  }
  return payload;
};
