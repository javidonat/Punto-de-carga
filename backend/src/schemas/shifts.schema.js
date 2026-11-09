import { z } from "zod";
import { ALGORITHMS, CONFIRM_STATUS } from "../models/constants.js";
import { date, integer, objectId } from "./common.schema.js";

// POST /api/shifts/generate  { week } (sin week → la semana actual)
export const generateSchema = z.object({
  week: date("La semana debe ser una fecha AAAA-MM-DD").optional(),
});

// POST /api/shifts  (turno manual)
export const manualShiftSchema = z.object({
  userId: objectId("El usuario no es válido"),
  chargerId: objectId("El punto de recarga no es válido"),
  date: date("La fecha debe ser AAAA-MM-DD"),
  hour: integer("La hora tiene que ser un número del 0 al 23", 0, 23),
});

// PATCH /api/shifts/settings
export const settingsSchema = z.object({
  algorithm: z.enum(ALGORITHMS, { error: `El algoritmo tiene que ser ${ALGORITHMS.join(", ")}` }).optional(),
  maxHoursPerWeek: integer("El máximo de horas por semana tiene que ser un número de 0 a 168 (0 = sin límite)", 0, 168).optional(),
  maxConsecutiveHours: integer("Las horas seguidas tienen que ser un número de 1 a 24", 1, 24).optional(),
});

// Lista de ids de turnos (las horas de un bloque)
export const shiftIds = z
  .array(objectId("El id del turno no es válido"), { error: "ids tiene que ser una lista de turnos" })
  .min(1, "Tienes que indicar al menos un turno")
  .max(24, "Un bloque no tiene más de 24 horas");

// PATCH /api/shifts/me/confirm
export const confirmSchema = z.object({
  ids: shiftIds,
  status: z.enum(CONFIRM_STATUS, { error: `status tiene que ser ${CONFIRM_STATUS.join(" o ")}` }),
});
