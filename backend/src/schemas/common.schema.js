import { z } from "zod";
import { isValidDate } from "../services/utils/dates.util.js";

// Piezas de validación que se repiten en varios esquemas

// Texto obligatorio: distingue "falta" de "no es texto"
export const text = (required, type) =>
  z
    .string({ error: (issue) => (issue.input === undefined ? required : type) })
    .trim()
    .min(1, required);

// Id de MongoDB (24 caracteres hexadecimales)
export const objectId = (message) => z.string({ error: message }).regex(/^[a-f\d]{24}$/i, message);

// Fecha "AAAA-MM-DD" que exista de verdad
export const date = (message) => z.string({ error: message }).refine(isValidDate, message);

// Número entero entre min y max
export const integer = (message, min, max) => z.number({ error: message }).int(message).min(min, message).max(max, message);

export const email = text("El email es obligatorio", "El email debe ser un texto").regex(/^\S+@\S+\.\S+$/, "El email no es válido");

export const password = (required) =>
  z
    .string({ error: (issue) => (issue.input === undefined ? required : "La contraseña debe ser un texto") })
    .min(4, "La contraseña debe tener al menos 4 caracteres")
    .max(100, "La contraseña no puede superar los 100 caracteres");

// :id en la URL
export const idParamsSchema = z.object({ id: objectId("El id no es válido") });

// PATCH /:id/active
export const activeSchema = z.object({
  isActive: z.boolean({ error: "isActive es obligatorio y debe ser true o false" }),
});

// ?week=AAAA-MM-DD (cualquier día vale: el servicio usa el lunes de esa semana). Sin week → la semana actual
export const weekQuerySchema = z.object({
  week: date("La semana debe ser una fecha AAAA-MM-DD").optional(),
});
