import { z } from "zod";
import { text } from "./common.schema.js";

// Esquemas de validación de los puntos de recarga.
// Los campos que no aparecen aquí (isActive, deletedAt...) se descartan del body

const fields = {
  name: text("El nombre es obligatorio", "El nombre debe ser un texto").max(60, "El nombre no puede superar los 60 caracteres"),
  type: z.string({ error: "El tipo debe ser un texto" }).trim().max(40, "El tipo no puede superar los 40 caracteres").optional(),
  powerKw: z
    .number({ error: "La potencia debe ser un número" })
    .min(0, "La potencia no puede ser negativa")
    .max(1000, "La potencia no puede superar los 1000 kW")
    .nullable() // null = sin dato
    .optional(),
};

// POST: el nombre es obligatorio
export const createChargerSchema = z.object(fields);

// PATCH: todos los campos son opcionales (se modifican solo los que se envían)
export const updateChargerSchema = z.object(fields).partial();
