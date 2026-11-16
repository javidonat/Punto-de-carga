import mongoose from "mongoose";
import notificationsRepo from "../repos/notifications.repo.js";
import usersRepo from "../repos/users.repo.js";
import AppError from "./utils/AppError.js";

// Avisos para los usuarios. Los crean otros servicios (turnos, penalizaciones, incidencias)
// y el usuario los ve en su página de inicio hasta que los marca como leídos

// Crea varios avisos de una vez: [{ userId, message }, ...]
const notifyMany = async (list) => {
  if (list.length > 0) {
    await notificationsRepo.createMany(list);
  }
};

const notify = (userId, message) => {
  return notifyMany([{ userId, message }]);
};

// Un aviso para cada administrador (por ejemplo, cuando alguien abre una incidencia).
// incidentId: para poder quitarlo cuando un admin resuelva esa incidencia
const notifyAdmins = async (message, incidentId = null) => {
  const admins = await usersRepo.findAdmins();
  await notifyMany(admins.map((admin) => ({ userId: admin._id, message, incidentId })));
};

// La incidencia ya está resuelta: su aviso desaparece del inicio de todos los admins
const clearIncident = (incidentId) => {
  return notificationsRepo.markReadByIncident(incidentId);
};

// GET /api/notifications/me: mis avisos sin leer
const getMine = (userId) => {
  return notificationsRepo.findUnreadByUser(userId);
};

// PATCH /api/notifications/me/:id/read
const markRead = async (userId, id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id del aviso no es válido", 400);
  }
  const notification = await notificationsRepo.markRead(id, userId);
  if (!notification) {
    throw new AppError("Aviso no encontrado", 404);
  }
  return notification;
};

// PATCH /api/notifications/me/read-all
const markAllRead = async (userId) => {
  await notificationsRepo.markAllRead(userId);
};

export default { notify, notifyMany, notifyAdmins, clearIncident, getMine, markRead, markAllRead };
