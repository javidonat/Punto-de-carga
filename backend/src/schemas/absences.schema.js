import { z } from "zod";
import { date } from "./common.schema.js";

// POST /api/absences/me  { from: "2026-11-16", to: "2026-11-22" }  (to null o sin enviar = indefinida)
export const absenceSchema = z.object({
  from: date("El primer día debe ser una fecha AAAA-MM-DD"),
  to: date("El último día debe ser una fecha AAAA-MM-DD").nullable().optional(),
});
