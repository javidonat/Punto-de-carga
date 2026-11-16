import { z } from "zod";
import { shiftIds } from "./shifts.schema.js";

// POST /api/incidents  { ids: [...], description: "Había un coche blanco" }
export const incidentSchema = z.object({
  ids: shiftIds,
  description: z.string({ error: "La descripción debe ser un texto" }).trim().max(500, "La descripción no puede superar los 500 caracteres").optional(),
});

// PATCH /api/incidents/:id  (admin)  { status, reportedUserId? }
// reportedUserId: el admin puede corregir quién ocupaba el sitio (null = no se sabe)
export const resolveSchema = z.object({
  status: z.enum(["accepted", "rejected"], { error: "status tiene que ser accepted o rejected" }),
  reportedUserId: z.string({ error: "reportedUserId debe ser un id" }).nullable().optional(),
});
