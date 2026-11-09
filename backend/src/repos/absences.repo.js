import { Absence } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Ausencias de un usuario que aún no han terminado (las de antes de hoy ya no interesan)
const findCurrentByUser = (userId, fromDate) => {
  return Absence.find({ userId, $or: [{ to: null }, { to: { $gte: fromDate } }] }).sort({ from: 1 }).lean();
};

// Ausencias de todos que tocan alguno de los días entre fromDate y toDate (las de una semana, para el reparto)
const findBetween = (fromDate, toDate) => {
  return Absence.find({ from: { $lte: toDate }, $or: [{ to: null }, { to: { $gte: fromDate } }] }).lean();
};

const findById = (id) => {
  return Absence.findById(id).lean();
};

const create = async (data) => {
  const absence = await Absence.create(data);
  return absence.toObject();
};

const deleteById = (id) => {
  return Absence.findByIdAndDelete(id).lean();
};

export default { findCurrentByUser, findBetween, findById, create, deleteById };
