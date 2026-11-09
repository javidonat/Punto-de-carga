import mongoose from "mongoose";
import chargersRepo from "../repos/chargers.repo.js";
import shiftsRepo from "../repos/shifts.repo.js";
import shiftsService from "./shifts.service.js";
import AppError from "./utils/AppError.js";
import { currentHour, today } from "./utils/dates.util.js";
import { DEFAULT_CHARGERS } from "../models/constants.js";

// Campos que se pueden enviar desde fuera (el resto se ignora).
// isActive y deletedAt no están: tienen sus propias rutas
const FIELDS = ["name", "type", "powerKw"];

// ---------- Funciones auxiliares ----------

const validateId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id del punto de recarga no es válido", 400);
  }
};

const pickFields = (body = {}) => {
  const data = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }
  return data;
};

const notFound = () => new AppError("Punto de recarga no encontrado", 404);

// ---------- Operaciones ----------

// Al arrancar el servidor: si no hay ninguno, se crean los 4 del instituto
const ensureDefaultChargers = async () => {
  if ((await chargersRepo.count()) > 0) {
    return;
  }
  const list = [];
  for (let i = 1; i <= DEFAULT_CHARGERS; i++) {
    list.push({ name: `Punto de recarga ${i}` });
  }
  await chargersRepo.createMany(list);
  console.log(`🔌 Creados los ${DEFAULT_CHARGERS} puntos de recarga iniciales`);
};

const getAllChargers = () => {
  return chargersRepo.findAll();
};

// Un punto de recarga nuevo: se reparten sus horas libres de esta semana entre quien pueda
const createCharger = async (body) => {
  const charger = await chargersRepo.create(pickFields(body));
  await shiftsService.fillGaps();
  return charger;
};

// PATCH /:id: modifica solo los campos que se envían
const updateCharger = async (id, body) => {
  validateId(id);

  const data = pickFields(body);
  if (Object.keys(data).length === 0) {
    throw new AppError("No se ha enviado ningún campo para modificar", 400);
  }

  const charger = await chargersRepo.update(id, data);
  if (!charger) {
    throw notFound();
  }
  return charger;
};

// PATCH /:id/active: en servicio o averiado. Si se avería, se quitan sus turnos de ahora en adelante.
// En los dos casos se rellenan los huecos: esas personas pasan a otro punto libre, o se usa el que vuelve a funcionar
const setActive = async (id, { isActive }) => {
  validateId(id);

  const charger = await chargersRepo.update(id, { isActive });
  if (!charger) {
    throw notFound();
  }
  if (!isActive) {
    await shiftsRepo.deleteByChargerFrom(id, today(), currentHour());
  }
  await shiftsService.fillGaps();
  return charger;
};

// PATCH /:id/softdelete: se quita el punto de recarga y sus turnos de ahora en adelante (y se recolocan)
const softDeleteCharger = async (id) => {
  validateId(id);

  const charger = await chargersRepo.softDelete(id);
  if (!charger) {
    throw notFound();
  }
  await shiftsRepo.deleteByChargerFrom(id, today(), currentHour());
  await shiftsService.fillGaps();
  return charger;
};

export default { ensureDefaultChargers, getAllChargers, createCharger, updateCharger, setActive, softDeleteCharger };
