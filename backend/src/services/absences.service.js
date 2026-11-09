import mongoose from "mongoose";
import absencesRepo from "../repos/absences.repo.js";
import shiftsRepo from "../repos/shifts.repo.js";
import shiftsService from "./shifts.service.js";
import AppError from "./utils/AppError.js";
import { currentHour, today } from "./utils/dates.util.js";

// Ausencias: el usuario avisa de que unos días no viene (un día, una semana, unas fechas o indefinidamente).
// Esos días no recibe turnos, los que ya tenía se reparten entre los demás, y no tiene que tocar su horario

// GET /api/absences/me: mis ausencias que aún no han terminado
const getMine = (userId) => {
  return absencesRepo.findCurrentByUser(userId, today());
};

// POST /api/absences/me  { from, to }  (to null = indefinida, hasta que la quite)
const createMine = async (userId, { from, to = null }) => {
  if (from < today()) {
    throw new AppError("La ausencia no puede empezar en un día que ya ha pasado", 400);
  }
  if (to !== null && to < from) {
    throw new AppError("El último día no puede ser anterior al primero", 400);
  }

  const absence = await absencesRepo.create({ userId, from, to });
  // Fuera sus turnos de esos días (de ahora en adelante) y se reparten entre los demás
  await shiftsRepo.deleteByUserBetween(userId, from, to, today(), currentHour());
  await shiftsService.fillGaps();
  return absence;
};

// DELETE /api/absences/me/:id: vuelve antes de lo previsto (o se reactiva). Vuelve a entrar en el reparto
const deleteMine = async (userId, id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id de la ausencia no es válido", 400);
  }
  const absence = await absencesRepo.findById(id);
  if (!absence || String(absence.userId) !== userId) {
    throw new AppError("Ausencia no encontrada", 404);
  }
  await absencesRepo.deleteById(id);
  await shiftsService.fillGaps();
};

export default { getMine, createMine, deleteMine };
