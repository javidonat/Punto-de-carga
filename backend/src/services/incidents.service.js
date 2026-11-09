import mongoose from "mongoose";
import incidentsRepo from "../repos/incidents.repo.js";
import shiftsRepo from "../repos/shifts.repo.js";
import shiftsService from "./shifts.service.js";
import notificationsService from "./notifications.service.js";
import penaltiesService from "./penalties.service.js";
import AppError from "./utils/AppError.js";
import { hasStarted, shortDate } from "./utils/dates.util.js";

// Incidencias: "no he podido cargar porque mi punto de recarga estaba ocupado".
// Se apunta contra quien tenía ese punto justo la hora anterior (lo normal es que no quitara el coche).
// El admin la revisa: si la acepta, esa persona recibe una penalización

const validateId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id de la incidencia no es válido", 400);
  }
};

// POST /api/incidents  { ids, description }  ids = las horas del turno que no pudo cargar
const createIncident = async (user, { ids, description = "" }) => {
  const shifts = await shiftsService.findMyPendingShifts(user.id, ids);
  const first = shifts[0];
  if (!hasStarted(first.date, first.hour)) {
    throw new AppError("Solo puedes avisar de una incidencia cuando tu turno ha empezado", 400);
  }

  // ¿Quién estaba en ese punto de recarga la hora anterior?
  const previous = await shiftsRepo.findAt(first.chargerId, first.date, first.hour - 1);
  const reportedUserId = previous && String(previous.userId) !== user.id ? previous.userId : null;

  await shiftsRepo.setStatus(ids, "blocked");
  const incident = await incidentsRepo.create({
    reporterId: user.id,
    reportedUserId,
    chargerId: first.chargerId,
    date: first.date,
    hour: first.hour,
    shiftIds: ids,
    description,
  });
  await notificationsService.notifyAdmins(`Nueva incidencia: a un usuario le han ocupado su punto de recarga el ${shortDate(first.date)}`);
  return incident;
};

// GET /api/incidents/me: las incidencias que he puesto yo
const getMine = (userId) => {
  return incidentsRepo.findByReporter(userId);
};

// GET /api/incidents: todas (admin), primero las abiertas
const getAll = () => {
  return incidentsRepo.findAll();
};

// PATCH /api/incidents/:id  { status: "accepted" | "rejected" }  (admin)
// Aceptada → penalización para quien ocupaba el sitio. En los dos casos se avisa a quien la puso
const resolveIncident = async (id, { status }) => {
  validateId(id);
  const incident = await incidentsRepo.resolve(id, status);
  if (!incident) {
    throw new AppError("Incidencia no encontrada o ya resuelta", 404);
  }

  const day = shortDate(incident.date);
  if (status === "accepted" && incident.reportedUserId) {
    await penaltiesService.penalize(incident.reportedUserId, "blocking", `ocupaste un punto de recarga que no era tuyo el ${day}`);
  }
  const result = status === "accepted" ? "aceptada" : "rechazada";
  await notificationsService.notify(incident.reporterId, `Tu incidencia del ${day} ha sido ${result}`);
  return incident;
};

export default { createIncident, getMine, getAll, resolveIncident };
