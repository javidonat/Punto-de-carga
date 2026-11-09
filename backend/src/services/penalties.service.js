import penaltiesRepo from "../repos/penalties.repo.js";
import shiftsRepo from "../repos/shifts.repo.js";
import notificationsService from "./notifications.service.js";
import { addDays, shortDate, today } from "./utils/dates.util.js";
import { CONFIRM_DAYS, PENALTY_HOURS } from "../models/constants.js";

// Penalizaciones: se suman como horas de castigo al contador del reparto (ver shifts.service.js → runAssignment),
// así el usuario penalizado tiene menos prioridad las semanas siguientes. Al usuario le llega un aviso.
// Sus penalizaciones las ve en el histórico (history.service.js)

// Pone varias penalizaciones de una vez: [{ userId, kind, reason }]. kind es una clave de PENALTY_HOURS
const penalizeMany = async (list) => {
  if (list.length === 0) {
    return;
  }
  const penalties = list.map(({ userId, kind, reason }) => ({ userId, hours: PENALTY_HOURS[kind], reason }));
  await penaltiesRepo.createMany(penalties);
  await notificationsService.notifyMany(
    penalties.map((p) => ({ userId: p.userId, message: `Penalización de ${p.hours} h: ${p.reason}` }))
  );
};

const penalize = (userId, kind, reason) => {
  return penalizeMany([{ userId, kind, reason }]);
};

// Tarea automática (cada hora, ver server.js): los turnos que siguen sin confirmar cuando se acaba el plazo
// (el día siguiente al turno) pasan a "unconfirmed" y su dueño recibe UNA penalización por cada día
const checkUnconfirmed = async () => {
  const shifts = await shiftsRepo.findPendingBefore(addDays(today(), -CONFIRM_DAYS));
  if (shifts.length === 0) {
    return;
  }
  await shiftsRepo.setStatus(
    shifts.map((shift) => shift._id),
    "unconfirmed"
  );

  // Un usuario con 3 horas sin confirmar el mismo día → una sola penalización
  const days = new Map();
  for (const shift of shifts) {
    days.set(`${shift.userId}|${shift.date}`, { userId: shift.userId, date: shift.date });
  }
  await penalizeMany(
    [...days.values()].map(({ userId, date }) => ({
      userId,
      kind: "unconfirmed",
      reason: `no confirmaste si cargaste el ${shortDate(date)}`,
    }))
  );
};

export default { penalize, penalizeMany, checkUnconfirmed };
