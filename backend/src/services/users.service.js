import mongoose from "mongoose";
import usersRepo from "../repos/users.repo.js";
import shiftsRepo from "../repos/shifts.repo.js";
import penaltiesRepo from "../repos/penalties.repo.js";
import absencesRepo from "../repos/absences.repo.js";
import shiftsService from "./shifts.service.js";
import AppError from "./utils/AppError.js";
import { hashPassword } from "./utils/password.js";
import { ADMIN_ROLE } from "../models/constants.js";
import { currentHour, today } from "./utils/dates.util.js";

// ---------- Funciones auxiliares ----------

const validateId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id del usuario no es válido", 400);
  }
};

// Un admin no puede darse de baja, quitarse el rol ni eliminarse a sí mismo
// (así siempre queda al menos un administrador)
const notYourself = (adminId, id) => {
  if (adminId === String(id)) {
    throw new AppError("No puedes cambiarte a ti mismo", 400);
  }
};

const notFound = () => new AppError("Usuario no encontrado", 404);

// ---------- Operaciones ----------

// GET /api/users: todos los usuarios con sus horas cargadas, sus horas de penalización
// y su ausencia de hoy si la tienen (absence: { from, to } o null)
const getAllUsers = async () => {
  const [users, hours, penaltyHours, absences] = await Promise.all([
    usersRepo.findAll(),
    shiftsRepo.countHoursByUser(),
    penaltiesRepo.sumByUser(),
    absencesRepo.findBetween(today(), today()),
  ]);
  const hoursByUser = Object.fromEntries(hours.map((row) => [String(row.userId), row.hours]));
  const absenceByUser = Object.fromEntries(absences.map((a) => [String(a.userId), { from: a.from, to: a.to }]));
  return users.map((user) => {
    const id = String(user._id);
    return {
      ...user,
      totalHours: hoursByUser[id] || 0,
      penaltyHours: penaltyHours[id] || 0,
      absence: absenceByUser[id] || null,
    };
  });
};

// PATCH /api/users/:id/active: dar de alta o de baja. Al darlo de baja pierde sus turnos de ahora en adelante.
// En los dos casos se rellenan los huecos (sus horas pasan a otros, o vuelve a entrar en el reparto)
const setActive = async (adminId, id, { isActive }) => {
  validateId(id);
  notYourself(adminId, id);

  const user = await usersRepo.setActive(id, isActive);
  if (!user) {
    throw notFound();
  }
  if (!isActive) {
    await shiftsRepo.deleteByUserFrom(id, today(), currentHour());
  }
  await shiftsService.fillGaps();
  return user;
};

// PATCH /api/users/:id  { name, email, password }: el admin corrige los datos de un usuario
// o le pone una contraseña nueva si la ha olvidado. Solo se cambia lo que se envía
const updateUser = async (id, { name, email, password }) => {
  validateId(id);

  const data = {};
  if (name !== undefined) {
    data.name = name;
  }
  if (email !== undefined) {
    data.email = email;
  }
  if (password !== undefined) {
    data.passwordHash = await hashPassword(password);
  }

  const user = await usersRepo.update(id, data); // email repetido → MongoDB da 11000 → 409
  if (!user) {
    throw notFound();
  }
  return user;
};

// PATCH /api/users/:id/role. Los admins no reciben turnos: si pasa a admin pierde los suyos de ahora en adelante;
// si vuelve a ser usuario, vuelve a entrar en el reparto
const setRole = async (adminId, id, { role }) => {
  validateId(id);
  notYourself(adminId, id);

  const user = await usersRepo.setRole(id, role);
  if (!user) {
    throw notFound();
  }
  if (role === ADMIN_ROLE) {
    await shiftsRepo.deleteByUserFrom(id, today(), currentHour());
  }
  await shiftsService.fillGaps();
  return user;
};

// PATCH /api/users/:id/softdelete: sus horas pasadas se quedan en el histórico
const softDeleteUser = async (adminId, id) => {
  validateId(id);
  notYourself(adminId, id);

  const user = await usersRepo.softDelete(id);
  if (!user) {
    throw notFound();
  }
  await shiftsRepo.deleteByUserFrom(id, today(), currentHour());
  await shiftsService.fillGaps();
  return user;
};

export default { getAllUsers, updateUser, setActive, setRole, softDeleteUser };
