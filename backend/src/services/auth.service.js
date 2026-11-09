import authRepo from "../repos/auth.repo.js";
import AppError from "./utils/AppError.js";
import { hashPassword, verifyPassword } from "./utils/password.js";
import { createToken, getExpires } from "./utils/jwt.js";
import { ADMIN_ROLE, USER_ROLE } from "../models/constants.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

// Hash de relleno: si el email no existe se verifica igualmente contra él, para que la respuesta
// tarde lo mismo y no se pueda averiguar qué emails están registrados
let dummyHash;
const getDummyHash = async () => (dummyHash ??= await hashPassword("contraseña-de-relleno"));

// Lo que se devuelve al registrarse, al entrar y al cambiar la contraseña
const session = (user) => ({
  token: createToken({ id: user._id, email: user.email, role: user.role, tokenVersion: user.tokenVersion ?? 0 }),
  tokenType: "Bearer",
  expiresIn: getExpires(),
  user: { _id: user._id, name: user.name, email: user.email, role: user.role },
});

// POST /api/auth/register: el primero que se registra es el administrador (lo pide el enunciado)
const register = async ({ name, email, password }) => {
  const isFirst = (await authRepo.countUsers()) === 0;
  const user = await authRepo.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    role: isFirst ? ADMIN_ROLE : USER_ROLE,
  });
  return session(user);
};

// POST /api/auth/login
const login = async ({ email, password }) => {
  const user = await authRepo.findByEmailWithPassword(email);

  // Mismo mensaje si el email no existe o la contraseña no coincide (no se revela qué emails existen)
  const validPassword = await verifyPassword(password, user ? user.passwordHash : await getDummyHash());
  if (!user || !validPassword) {
    throw new AppError("Email o contraseña incorrectos", 401);
  }
  if (!user.isActive) {
    throw new AppError("Tu cuenta está dada de baja", 403);
  }

  await authRepo.updateLastLogin(user._id);
  return session(user);
};

// POST /api/auth/logout: invalida todos los tokens del usuario (también los de otros dispositivos)
const logout = async (userId) => {
  await authRepo.incrementTokenVersion(userId);
};

// PATCH /api/auth/password: los tokens anteriores dejan de valer, así que se devuelve uno nuevo
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await authRepo.findByIdWithPassword(userId);
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError("La contraseña actual no es correcta", 401);
  }

  const updated = await authRepo.updatePassword(userId, await hashPassword(newPassword));
  return session(updated);
};

export default { register, login, logout, changePassword };
