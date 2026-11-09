import { z } from "zod";
import { shiftIds } from "./shifts.schema.js";

// POST /api/incidents  { ids: [...], description: "Había un coche blanco" }
export const incidentSchema = z.object({
  ids: shiftIds,
  description: z.string({ error: "La descripción debe ser un texto" }).trim().max(500, "La descripción no puede superar los 500 caracteres").optional(),
});

// PATCH /api/incidents/:id  (admin)
export const resolveSchema = z.object({
  status: z.enum(["accepted", "rejected"], { error: "status tiene que ser accepted o rejected" }),
});
