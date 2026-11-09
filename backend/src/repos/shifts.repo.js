import mongoose from "mongoose";
import { Shift } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

const objectId = (id) => new mongoose.Types.ObjectId(String(id));

const POPULATE_CHARGER = { path: "chargerId", select: "name type powerKw" };
const POPULATE_USER = { path: "userId", select: "name email" };

// Filtro "de ahora en adelante": días posteriores a fromDate, o ese mismo día desde fromHour.
// Así no se tocan las horas de hoy que ya han pasado (son histórico)
const fromNow = (fromDate, fromHour) => ({
  $or: [{ date: { $gt: fromDate } }, { date: fromDate, hour: { $gte: fromHour } }],
});

// Filtro "ya han terminado": días anteriores a date, o ese mismo día las horas anteriores a la actual
const ended = (date, hour) => ({
  $or: [{ date: { $lt: date } }, { date, hour: { $lt: hour } }],
});

// ---------- Consultas de turnos ----------

// Turnos de un usuario en una semana, ordenados para poder agruparlos en bloques
const findByUserAndWeek = (userId, week) => {
  return Shift.find({ userId, week }).populate(POPULATE_CHARGER).sort({ date: 1, chargerId: 1, hour: 1 }).lean();
};

// Todos los turnos de una semana (panel del admin)
const findByWeek = (week) => {
  return Shift.find({ week }).populate(POPULATE_USER).populate(POPULATE_CHARGER).sort({ date: 1, hour: 1 }).lean();
};

// Turnos de una semana sin populate (los usa el algoritmo de reparto)
const findByWeekRaw = (week) => {
  return Shift.find({ week }).lean();
};

// ¿Cuántos turnos tiene una semana? (0 = aún no se ha generado)
const countByWeek = (week) => {
  return Shift.countDocuments({ week });
};

// Turnos automáticos de un usuario de ahora en adelante (para quitar los que ya no encajan en su horario)
const findAutomaticByUserFrom = (userId, fromDate, fromHour) => {
  return Shift.find({ userId, manual: false, ...fromNow(fromDate, fromHour) }).lean();
};

const findById = (id) => {
  return Shift.findById(id).lean();
};

const findByIds = (ids) => {
  return Shift.find({ _id: { $in: ids } }).lean();
};

// Turnos de un usuario que ya han terminado y aún no ha confirmado (de cualquier semana)
const findEndedPendingByUser = (userId, date, hour) => {
  return Shift.find({ userId, status: "pending", ...ended(date, hour) })
    .populate(POPULATE_CHARGER)
    .sort({ date: 1, chargerId: 1, hour: 1 })
    .lean();
};

// Turnos sin confirmar de días anteriores a "date" (se les acabó el plazo)
const findPendingBefore = (date) => {
  return Shift.find({ status: "pending", date: { $lt: date } }).sort({ userId: 1, date: 1, hour: 1 }).lean();
};

// Quién estaba en un punto de recarga un día a una hora (para las incidencias)
const findAt = (chargerId, date, hour) => {
  return Shift.findOne({ chargerId, date, hour }).lean();
};

// Cambia el estado de varios turnos (al confirmar, al abrir una incidencia o al acabar el plazo)
const setStatus = (ids, status) => {
  return Shift.updateMany({ _id: { $in: ids } }, { status });
};

const create = async (data) => {
  const shift = await Shift.create(data);
  return shift.toObject();
};

// ordered: false → si alguno choca con otro turno (dos repartos a la vez), se guardan los demás
const createMany = (list) => {
  return Shift.insertMany(list, { ordered: false });
};

const deleteById = (id) => {
  return Shift.findByIdAndDelete(id).lean();
};

const deleteByIds = (ids) => {
  return Shift.deleteMany({ _id: { $in: ids } });
};

// Al regenerar una semana: se borran los turnos automáticos de ahora en adelante (los manuales se quedan)
const deleteAutomaticFrom = (week, fromDate, fromHour) => {
  return Shift.deleteMany({ week, manual: false, ...fromNow(fromDate, fromHour) });
};

// Punto de recarga averiado o eliminado: fuera sus turnos de ahora en adelante
const deleteByChargerFrom = (chargerId, fromDate, fromHour) => {
  return Shift.deleteMany({ chargerId, ...fromNow(fromDate, fromHour) });
};

// Usuario dado de baja o eliminado: fuera sus turnos de ahora en adelante
const deleteByUserFrom = (userId, fromDate, fromHour) => {
  return Shift.deleteMany({ userId, ...fromNow(fromDate, fromHour) });
};

// Ausencia: fuera los turnos del usuario entre dos días (toDate null = sin final), de ahora en adelante
const deleteByUserBetween = (userId, fromDate, toDate, nowDate, nowHour) => {
  const days = toDate ? { $gte: fromDate, $lte: toDate } : { $gte: fromDate };
  return Shift.deleteMany({ userId, $and: [{ date: days }, fromNow(nowDate, nowHour)] });
};

// ---------- Horas (cada turno es 1 hora) ----------

// Horas de cada usuario ANTES de una semana: { "<userId>": 12, ... }. Cuentan todas las que tuvo asignadas
// (aunque no cargara: ocupó el sitio), menos las que no pudo usar porque otro le ocupó el punto
const countHoursBeforeWeek = async (week) => {
  const rows = await Shift.aggregate([
    { $match: { week: { $lt: week }, status: { $ne: "blocked" } } }, // si le ocuparon el sitio, esas horas no le cuentan
    { $group: { _id: "$userId", hours: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((row) => [String(row._id), row.hours]));
};

// Horas cargadas (confirmadas) de un usuario y desglose por semanas
const countHoursOfUser = async (userId) => {
  const byWeek = await Shift.aggregate([
    { $match: { userId: objectId(userId), status: "charged" } },
    { $group: { _id: "$week", hours: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $project: { _id: 0, week: "$_id", hours: 1 } },
  ]);
  const total = byWeek.reduce((sum, row) => sum + row.hours, 0);
  return { total, byWeek };
};

// Horas cargadas (confirmadas) de cada usuario: [{ userId, hours }]
const countHoursByUser = () => {
  return Shift.aggregate([
    { $match: { status: "charged" } },
    { $group: { _id: "$userId", hours: { $sum: 1 } } },
    { $project: { _id: 0, userId: "$_id", hours: 1 } },
  ]);
};

// Para las gráficas: horas agrupadas por día, semana, mes o año. userId = null → de todos
const GROUP_BY = {
  day: "$date",
  week: "$week",
  month: { $substrBytes: ["$date", 0, 7] },
  year: { $substrBytes: ["$date", 0, 4] },
};

const countHoursByPeriod = (period, userId = null) => {
  const match = userId ? { userId: objectId(userId), status: "charged" } : { status: "charged" };
  return Shift.aggregate([
    { $match: match },
    { $group: { _id: GROUP_BY[period], hours: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, period: "$_id", hours: 1 } },
  ]);
};

export default {
  findByUserAndWeek,
  findByWeek,
  findByWeekRaw,
  countByWeek,
  findAutomaticByUserFrom,
  findById,
  findByIds,
  findEndedPendingByUser,
  findPendingBefore,
  findAt,
  setStatus,
  create,
  createMany,
  deleteById,
  deleteByIds,
  deleteAutomaticFrom,
  deleteByChargerFrom,
  deleteByUserFrom,
  deleteByUserBetween,
  countHoursBeforeWeek,
  countHoursOfUser,
  countHoursByUser,
  countHoursByPeriod,
};
