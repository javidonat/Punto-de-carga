import { User } from "../models/index.js";

// Consultas de usuarios que solo necesita la autenticación (registro, login, logout y el middleware).
// Son las únicas que leen passwordHash y tokenVersion (en el modelo tienen select: false)

// ¿Hay algún usuario? (el primero en registrarse será el admin)
const countUsers = () => {
  return User.countDocuments();
};

const create = async (data) => {
  const user = await User.create(data);
  return user.toJSON();
};

// Login: el usuario (no eliminado) con ese email, con el hash de su contraseña
const findByEmailWithPassword = (email) => {
  return User.findOne({ email: email.toLowerCase(), deletedAt: null }).select("+passwordHash +tokenVersion").lean();
};

// Cambiar contraseña: el usuario con su hash
const findByIdWithPassword = (id) => {
  return User.findOne({ _id: id, deletedAt: null }).select("+passwordHash +tokenVersion").lean();
};

// Middleware de autenticación: el usuario del token con su tokenVersion
const findByIdForAuth = (id) => {
  return User.findOne({ _id: id, deletedAt: null }).select("+tokenVersion").lean();
};

const updateLastLogin = (id) => {
  return User.updateOne({ _id: id }, { lastLoginAt: new Date() });
};

// Logout: los tokens emitidos antes dejan de valer
const incrementTokenVersion = (id) => {
  return User.updateOne({ _id: id }, { $inc: { tokenVersion: 1 } });
};

// Nueva contraseña. También invalida los tokens anteriores (las demás sesiones abiertas)
const updatePassword = (id, passwordHash) => {
  return User.findOneAndUpdate({ _id: id }, { passwordHash, $inc: { tokenVersion: 1 } }, { new: true })
    .select("+tokenVersion")
    .lean();
};

export default {
  countUsers,
  create,
  findByEmailWithPassword,
  findByIdWithPassword,
  findByIdForAuth,
  updateLastLogin,
  incrementTokenVersion,
  updatePassword,
};
