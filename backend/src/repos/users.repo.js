import { User } from "../models/index.js";
import { ADMIN_ROLE, USER_ROLE } from "../models/constants.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Todos los usuarios no eliminados (activos y dados de baja)
const findAll = () => {
  return User.find({ deletedAt: null }).sort({ createdAt: 1 }).lean();
};

// Usuarios que pueden recibir turnos: los activos con rol "user" (el admin solo administra, no carga)
const findActive = () => {
  return User.find({ role: USER_ROLE, isActive: true, deletedAt: null }).select("name").sort({ createdAt: 1 }).lean();
};

// Administradores activos (para avisarles de las incidencias nuevas)
const findAdmins = () => {
  return User.find({ role: ADMIN_ROLE, isActive: true, deletedAt: null }).select("_id").lean();
};

const findById = (id) => {
  return User.findOne({ _id: id, deletedAt: null }).lean();
};

// Dar de alta o de baja. Al darlo de baja se invalidan sus tokens (deja de poder entrar)
const setActive = (id, isActive) => {
  const data = isActive ? { isActive } : { isActive, $inc: { tokenVersion: 1 } };
  return User.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).lean();
};

// Cambiar el rol. También invalida sus tokens (el rol va dentro del token)
const setRole = (id, role) => {
  return User.findOneAndUpdate({ _id: id, deletedAt: null }, { role, $inc: { tokenVersion: 1 } }, { new: true }).lean();
};

// El admin cambia el nombre, el email o la contraseña de un usuario.
// Si cambia la contraseña también se invalidan sus tokens (tendrá que entrar con la nueva)
const update = (id, data) => {
  const changes = data.passwordHash ? { ...data, $inc: { tokenVersion: 1 } } : data;
  return User.findOneAndUpdate({ _id: id, deletedAt: null }, changes, { new: true, runValidators: true })
    .select("-passwordHash -tokenVersion")
    .lean();
};

// SOFT DELETE: no se borra el documento (sus horas siguen en el histórico), se desactiva y se marca la fecha
const softDelete = (id) => {
  return User.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date(), $inc: { tokenVersion: 1 } },
    { new: true }
  ).lean();
};

export default { findAll, findActive, findAdmins, findById, update, setActive, setRole, softDelete };
