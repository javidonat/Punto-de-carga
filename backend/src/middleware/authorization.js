import AppError from "../services/utils/AppError.js";
import { ADMIN_ROLE, USER_ROLE } from "../models/constants.js";

// Autorización. Va siempre DESPUÉS de authenticate (necesita req.user).
// Sin usuario autenticado → 401; autenticado pero sin permiso → 403

const unauthorized = () => new AppError("Tienes que iniciar sesión", 401);
const forbidden = (roles) =>
  new AppError(roles.includes(ADMIN_ROLE) ? "Solo para administradores" : "Esto es solo para usuarios: el administrador no carga", 403);

// Solo deja pasar a los roles indicados. Ej: router.use(authenticate, authorizeRoles("admin"))
export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(unauthorized());
  }
  if (!roles.includes(req.user.role)) {
    return next(forbidden(roles));
  }
  next();
};

// Solo administradores
export const isAdmin = authorizeRoles(ADMIN_ROLE);

// Solo usuarios normales (los que cargan): horario, turnos, ausencias, confirmar e incidencias
export const isUser = authorizeRoles(USER_ROLE);
