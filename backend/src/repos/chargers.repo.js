import { Charger } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

const count = () => {
  return Charger.countDocuments();
};

// Todos los no eliminados (en servicio y averiados)
const findAll = () => {
  return Charger.find({ deletedAt: null }).sort({ createdAt: 1 }).lean();
};

// Solo los que están en servicio: son los que reciben turnos
const findActive = () => {
  return Charger.find({ isActive: true, deletedAt: null }).sort({ createdAt: 1 }).lean();
};

const findById = (id) => {
  return Charger.findOne({ _id: id, deletedAt: null }).lean();
};

const create = async (data) => {
  const charger = await Charger.create(data);
  return charger.toObject();
};

const createMany = (list) => {
  return Charger.insertMany(list);
};

const update = (id, data) => {
  return Charger.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true, runValidators: true }).lean();
};

// SOFT DELETE: el documento se queda (los turnos antiguos siguen apuntando a él)
const softDelete = (id) => {
  return Charger.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  ).lean();
};

export default { count, findAll, findActive, findById, create, createMany, update, softDelete };
