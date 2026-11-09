import { Notification } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Varios avisos de una vez: [{ userId, message }, ...]
const createMany = (list) => {
  return Notification.insertMany(list);
};

// Los avisos sin leer de un usuario, los más nuevos primero
const findUnreadByUser = (userId) => {
  return Notification.find({ userId, read: false }).sort({ createdAt: -1 }).lean();
};

// Marca como leído un aviso (solo si es de ese usuario)
const markRead = (id, userId) => {
  return Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true }).lean();
};

const markAllRead = (userId) => {
  return Notification.updateMany({ userId, read: false }, { read: true });
};

export default { createMany, findUnreadByUser, markRead, markAllRead };
