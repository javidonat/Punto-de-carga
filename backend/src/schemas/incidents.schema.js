import { z } from "zod";
import { shiftIds } from "./shifts.schema.js";
import { date, integer, objectId } from "./common.schema.js";

// POST /api/incidents  { ids: [...], description: "Había un coche blanco" }
export const incidentSchema = z.object({
  ids: shiftIds,
  description: z.string({ error: "La descripción debe ser un texto" }).trim().max(500, "La descripción no puede superar los 500 caracteres").optional(),
});

// POST /api/incidents/manual  (admin)  { reporterId, chargerId, date, hour, reportedUserId?, description? }
// El admin apunta una incidencia que le han contado en persona (por ejemplo, alguien sin la app a mano)
export const manualIncidentSchema = z.object({
  reporterId: objectId("Hay que elegir quién avisa"),
  chargerId: objectId("Hay que elegir el punto de recarga"),
  date: date("La fecha debe ser AAAA-MM-DD"),
  hour: integer("La hora debe ser un número entre 0 y 23", 0, 23),
  reportedUserId: objectId("reportedUserId debe ser un id").nullable().optional(),
  description: z.string({ error: "La descripción debe ser un texto" }).trim().max(500, "La descripción no puede superar los 500 caracteres").optional(),
});

// PATCH /api/incidents/:id  (admin)  { status, reportedUserId? }
// reportedUserId: el admin puede corregir quién ocupaba el sitio (null = no se sabe)
export const resolveSchema = z.object({
  status: z.enum(["accepted", "rejected"], { error: "status tiene que ser accepted o rejected" }),
  reportedUserId: z.string({ error: "reportedUserId debe ser un id" }).nullable().optional(),
});
