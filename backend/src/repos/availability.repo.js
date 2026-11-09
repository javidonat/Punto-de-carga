import { Availability } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

const findByUserId = (userId) => {
  return Availability.findOne({ userId }).lean();
};

// Los horarios de varios usuarios (los activos, para repartir turnos)
const findByUserIds = (userIds) => {
  return Availability.find({ userId: { $in: userIds } }).lean();
};

// Guarda el horario entero del usuario. Si aún no tenía, lo crea (upsert)
const replaceSlots = (userId, slots) => {
  return Availability.findOneAndUpdate({ userId }, { slots }, { new: true, upsert: true }).lean();
};

export default { findByUserId, findByUserIds, replaceSlots };
