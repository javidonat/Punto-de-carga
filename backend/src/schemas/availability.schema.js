import { z } from "zod";
import { integer } from "./common.schema.js";

// PUT /api/availability/me  { slots: [{ day: 0, hour: 9 }, ...] }
export const slotsSchema = z.object({
  slots: z
    .array(
      z.object({
        day: integer("El día tiene que ser un número del 0 (lunes) al 6 (domingo)", 0, 6),
        hour: integer("La hora tiene que ser un número del 0 al 23", 0, 23),
      }),
      { error: "slots tiene que ser una lista de franjas" }
    )
    .max(168, "Una semana no tiene más de 168 horas"),
});
