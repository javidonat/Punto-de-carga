import mongoose from "mongoose";
import shiftsRepo from "../repos/shifts.repo.js";
import usersRepo from "../repos/users.repo.js";
import chargersRepo from "../repos/chargers.repo.js";
import availabilityRepo from "../repos/availability.repo.js";
import settingsRepo from "../repos/settings.repo.js";
import cancellationsRepo from "../repos/cancellations.repo.js";
import absencesRepo from "../repos/absences.repo.js";
import penaltiesRepo from "../repos/penalties.repo.js";
import notificationsService from "./notifications.service.js";
import penaltiesService from "./penalties.service.js";
import AppError from "./utils/AppError.js";
import { assignShifts } from "./assignment.service.js";
import { addDays, currentHour, dayOfWeek, hasEnded, hasStarted, mondayOf, shortDate, today } from "./utils/dates.util.js";
import { AUTO_GENERATE_DAY, DAY_NAMES, USER_ROLE } from "../models/constants.js";

// ---------- Funciones auxiliares ----------

const validateId = (id, what = "turno") => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`El id del ${what} no es válido`, 400);
  }
};

const hourText = (hour) => `${String(hour % 24).padStart(2, "0")}:00`;

// Junta las horas seguidas en el mismo punto de recarga (y con el mismo estado) en un solo bloque:
// "lunes 26/10, Punto de recarga 1: enchufar a las 09:00 y desenchufar a las 12:00"
const groupInBlocks = (shifts) => {
  const blocks = [];
  for (const shift of shifts) {
    const last = blocks[blocks.length - 1];
    if (
      last &&
      last.date === shift.date &&
      last.charger._id === shift.charger._id &&
      last.endHour === shift.hour &&
      last.status === shift.status
    ) {
      last.endHour = shift.hour + 1;
      last.ids.push(shift._id);
    } else {
      // ids: los turnos (horas) que forman el bloque, para poder cancelarlo o confirmarlo entero
      blocks.push({
        ids: [shift._id],
        date: shift.date,
        day: shift.day,
        dayName: shift.dayName,
        charger: shift.charger,
        status: shift.status,
        startHour: shift.hour,
        endHour: shift.hour + 1,
      });
    }
  }
  return blocks.map((block) => ({ ...block, plugIn: hourText(block.startHour), plugOut: hourText(block.endHour) }));
};

// Datos de un turno tal y como los recibe el frontend
const toShift = (shift) => ({
  _id: String(shift._id),
  date: shift.date,
  day: shift.day,
  dayName: DAY_NAMES[shift.day],
  hour: shift.hour,
  manual: shift.manual,
  status: shift.status || "pending",
  charger: { _id: String(shift.chargerId._id), name: shift.chargerId.name },
});

// Texto de un bloque para los avisos: "lunes 10/11, Punto de recarga 1, de 09:00 a 11:00"
const blockText = (block) => `${block.dayName} ${shortDate(block.date)}, ${block.charger.name}, de ${block.plugIn} a ${block.plugOut}`;

// Turnos de un usuario que todavía no han empezado (solo esos se pueden cancelar o quitar)
const checkNotStarted = (shift, message) => {
  if (hasStarted(shift.date, shift.hour)) {
    throw new AppError(message, 400);
  }
};

// ---------- Turnos del usuario ----------

// GET /api/shifts/me?week=: mis turnos de la semana y los avisos de enchufar/desenchufar
const getMyShifts = async (userId, day) => {
  const week = mondayOf(day); // cualquier día vale: se usa el lunes de su semana
  const shifts = (await shiftsRepo.findByUserAndWeek(userId, week)).map(toShift);
  return { week, shifts, blocks: groupInBlocks(shifts) };
};

// DELETE /api/shifts/me/:id: el usuario cancela un turno suyo que aún no ha llegado.
// Así esas horas no le cuentan y el admin puede dárselas a otro
const cancelMyShift = async (userId, id) => {
  validateId(id);

  const shift = await shiftsRepo.findById(id);
  if (!shift || String(shift.userId) !== userId) {
    throw new AppError("Turno no encontrado", 404);
  }
  checkNotStarted(shift, "Ese turno ya ha empezado o ha pasado: no se puede cancelar");
  await cancelShift(shift);
};

// GET /api/shifts/me/pending: mis turnos que ya han terminado y aún no he confirmado, en bloques
const getMyPending = async (userId) => {
  const shifts = (await shiftsRepo.findEndedPendingByUser(userId, today(), currentHour())).map(toShift);
  return groupInBlocks(shifts);
};

// Comprueba que los turnos son del usuario y están sin confirmar. Los devuelve ordenados por día y hora
const findMyPendingShifts = async (userId, ids) => {
  const shifts = await shiftsRepo.findByIds(ids);
  if (shifts.length !== ids.length || shifts.some((shift) => String(shift.userId) !== userId)) {
    throw new AppError("Turno no encontrado", 404);
  }
  if (shifts.some((shift) => shift.status !== "pending")) {
    throw new AppError("Ese turno ya está confirmado", 400);
  }
  return shifts.sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);
};

// PATCH /api/shifts/me/confirm  { ids, status: "charged" | "not_charged" }
// Después de un turno, el usuario dice si ha cargado. Si no ha cargado, penalización pequeña
// (ocupó el sitio sin aprovecharlo, pero al menos avisa)
const confirmMyShifts = async (userId, { ids, status }) => {
  const shifts = await findMyPendingShifts(userId, ids);
  if (shifts.some((shift) => !hasEnded(shift.date, shift.hour))) {
    throw new AppError("Solo puedes confirmar un turno cuando ha terminado", 400);
  }
  await shiftsRepo.setStatus(ids, status);
  if (status === "not_charged") {
    await penaltiesService.penalize(userId, "not_charged", `no cargaste en tu turno del ${shortDate(shifts[0].date)}`);
  }
};

// Cancela un turno: se apunta la cancelación (para no volver a dárselo a esa persona),
// se borra y se busca a otro que pueda a esa hora
const cancelShift = async (shift) => {
  await cancellationsRepo.create(shift.userId, shift.date, shift.hour);
  await shiftsRepo.deleteById(shift._id);
  await fillGaps();
};

// ---------- Administración ----------

// GET /api/shifts?week=: todos los turnos de la semana
const getWeekShifts = async (day) => {
  const week = mondayOf(day);
  const shifts = await shiftsRepo.findByWeek(week);
  return {
    week,
    shifts: shifts.map((shift) => ({
      ...toShift(shift),
      user: { _id: String(shift.userId._id), name: shift.userId.name, email: shift.userId.email },
    })),
  };
};

// ---------- Reparto ----------

// Carga todo lo que necesita el algoritmo, reparte las horas libres de la semana
// (de ahora en adelante) y guarda los turnos nuevos. Los turnos que ya hay se respetan
const runAssignment = async (week) => {
  const fromDate = today();
  const fromHour = currentHour();

  const [chargers, users, existingShifts, cancelled, absences, hoursBefore, penaltyHours, settings] = await Promise.all([
    chargersRepo.findActive(),
    usersRepo.findActive(),
    shiftsRepo.findByWeekRaw(week),
    cancellationsRepo.findBetween(week, addDays(week, 6)),
    absencesRepo.findBetween(week, addDays(week, 6)),
    shiftsRepo.countHoursBeforeWeek(week),
    penaltiesRepo.sumByUser(),
    settingsRepo.get(),
  ]);

  // Las penalizaciones cuentan como horas ya cargadas: así el penalizado tiene menos prioridad
  for (const [userId, hours] of Object.entries(penaltyHours)) {
    hoursBefore[userId] = (hoursBefore[userId] || 0) + hours;
  }

  const userIds = users.map((user) => String(user._id));
  const availability = await availabilityRepo.findByUserIds(userIds);
  const slotsByUser = Object.fromEntries(availability.map((a) => [String(a.userId), a.slots]));

  const newShifts = assignShifts({
    week,
    fromDate,
    fromHour,
    chargerIds: chargers.map((charger) => String(charger._id)),
    userIds,
    slotsByUser,
    existingShifts,
    cancelled: cancelled.map((c) => ({ userId: String(c.userId), date: c.date, hour: c.hour })),
    absences: absences.map((a) => ({ userId: String(a.userId), from: a.from, to: a.to })),
    hoursBefore,
    settings,
  });

  if (newShifts.length === 0) {
    return [];
  }
  try {
    return await shiftsRepo.createMany(newShifts);
  } catch (error) {
    // 11000 = otro reparto ha ocupado alguna de esas horas a la vez; los demás turnos sí se han guardado
    if (error.code !== 11000) {
      throw error;
    }
    return error.insertedDocs || [];
  }
};

// Avisa a cada usuario de sus turnos nuevos (un aviso por bloque de horas seguidas)
const notifyNewShifts = async (created) => {
  if (created.length === 0) {
    return;
  }
  const chargers = await chargersRepo.findAll();
  const chargerNames = Object.fromEntries(chargers.map((charger) => [String(charger._id), charger.name]));

  // Mismo formato que toShift, ordenados por usuario, día, punto y hora para poder agruparlos
  const shifts = created
    .map((shift) => ({
      _id: String(shift._id),
      userId: String(shift.userId),
      date: shift.date,
      day: shift.day,
      dayName: DAY_NAMES[shift.day],
      hour: shift.hour,
      status: "pending",
      charger: { _id: String(shift.chargerId), name: chargerNames[String(shift.chargerId)] },
    }))
    .sort((a, b) => a.userId.localeCompare(b.userId) || a.date.localeCompare(b.date) || a.charger._id.localeCompare(b.charger._id) || a.hour - b.hour);

  const list = [];
  for (const userId of new Set(shifts.map((shift) => shift.userId))) {
    for (const block of groupInBlocks(shifts.filter((shift) => shift.userId === userId))) {
      list.push({ userId, message: `Tienes un turno nuevo: ${blockText(block)}` });
    }
  }
  await notificationsService.notifyMany(list);
};

// POST /api/shifts/generate: rehace la semana. Borra los turnos automáticos que aún no han llegado
// y los reparte otra vez. Los manuales, los que ya han pasado y las cancelaciones se respetan
const generateWeek = async (day) => {
  const week = mondayOf(day);
  // Las semanas que ya han terminado no se tocan, para no cambiar el histórico
  if (addDays(week, 6) < today()) {
    throw new AppError("No se pueden generar turnos de una semana que ya ha pasado", 400);
  }

  await shiftsRepo.deleteAutomaticFrom(week, today(), currentHour());
  const [created, settings] = await Promise.all([runAssignment(week), settingsRepo.get()]);
  return { week, created: created.length, algorithm: settings.algorithm };
};

// Rellena los huecos libres SIN mover a nadie: se llama sola cuando alguien cancela, se ausenta o cambia
// su horario, se avería o se añade un punto de recarga, o se da de baja a un usuario.
// Se rellena la semana actual y la siguiente si ya está generada. A quien recibe un turno nuevo le llega un aviso
const fillGaps = async () => {
  const thisWeek = mondayOf();
  const nextWeek = addDays(thisWeek, 7);

  const created = await runAssignment(thisWeek);
  if ((await shiftsRepo.countByWeek(nextWeek)) > 0) {
    created.push(...(await runAssignment(nextWeek)));
  }
  await notifyNewShifts(created);
  return created.length;
};

// Tarea automática (al arrancar el servidor y cada hora, ver server.js):
// a partir del viernes se genera la semana siguiente si aún no tiene turnos, y se rellenan los huecos
const autoGenerate = async () => {
  const nextWeek = addDays(mondayOf(), 7);
  if (dayOfWeek(today()) >= AUTO_GENERATE_DAY && (await shiftsRepo.countByWeek(nextWeek)) === 0) {
    const result = await generateWeek(nextWeek);
    console.log(`📅 Turnos de la semana del ${nextWeek} generados solos: ${result.created}`);
  }
  await fillGaps();
};

// El usuario ha cambiado su horario: se le quitan los turnos automáticos que ya no encajan
// (horas que ha desmarcado) y se reparten los huecos, también con sus horas nuevas
const adaptToNewSlots = async (userId, slots) => {
  const canDo = new Set(slots.map((slot) => `${slot.day}-${slot.hour}`));
  const shifts = await shiftsRepo.findAutomaticByUserFrom(userId, today(), currentHour());
  const notFitting = shifts.filter((shift) => !canDo.has(`${shift.day}-${shift.hour}`));

  if (notFitting.length > 0) {
    await shiftsRepo.deleteByIds(notFitting.map((shift) => shift._id));
  }
  await fillGaps();
};

// POST /api/shifts: turno puesto a mano por el admin
const createManualShift = async ({ userId, chargerId, date, hour }) => {
  validateId(userId, "usuario");
  validateId(chargerId, "punto de recarga");

  const user = await usersRepo.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError("Usuario no encontrado o dado de baja", 404);
  }
  if (user.role !== USER_ROLE) {
    throw new AppError("Los administradores no reciben turnos", 400);
  }
  const charger = await chargersRepo.findById(chargerId);
  if (!charger || !charger.isActive) {
    throw new AppError("Punto de recarga no encontrado o averiado", 404);
  }
  if (hasStarted(date, hour)) {
    throw new AppError("No se pueden poner turnos en horas que ya han empezado o pasado", 400);
  }

  // Si el punto de recarga o el usuario ya están ocupados a esa hora, MongoDB lo impide (índices únicos → 409)
  return shiftsRepo.create({ userId, chargerId, week: mondayOf(date), date, day: dayOfWeek(date), hour, manual: true });
};

// DELETE /api/shifts/:id: el admin quita un turno que aún no ha empezado. Cuenta como cancelación
// (no se le vuelve a dar a esa persona y se busca a otro). Los que ya han empezado son histórico y no se tocan
const deleteShift = async (id) => {
  validateId(id);

  const shift = await shiftsRepo.findById(id);
  if (!shift) {
    throw new AppError("Turno no encontrado", 404);
  }
  checkNotStarted(shift, "Ese turno ya ha empezado o ha pasado: no se puede quitar");
  await cancelShift(shift);
  await notificationsService.notify(
    shift.userId,
    `El administrador te ha quitado el turno del ${DAY_NAMES[shift.day]} ${shortDate(shift.date)} a las ${hourText(shift.hour)}`
  );
};

// GET / PATCH /api/shifts/settings: algoritmo y límites del reparto
const getSettings = () => {
  return settingsRepo.get();
};

const updateSettings = async (body) => {
  if (Object.keys(body).length === 0) {
    throw new AppError("No se ha enviado ningún ajuste para modificar", 400);
  }
  return settingsRepo.update(body);
};

export default {
  getMyShifts,
  cancelMyShift,
  getMyPending,
  findMyPendingShifts,
  confirmMyShifts,
  getWeekShifts,
  generateWeek,
  fillGaps,
  autoGenerate,
  adaptToNewSlots,
  createManualShift,
  deleteShift,
  getSettings,
  updateSettings,
};
