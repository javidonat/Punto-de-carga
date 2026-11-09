import { z } from "zod";
import { ROLES } from "../models/constants.js";
import { email, password, text } from "./common.schema.js";

// PATCH /api/users/:id/role
export const roleSchema = z.object({
  role: z.enum(ROLES, { error: `El rol tiene que ser ${ROLES.join(" o ")}` }),
});

// PATCH /api/users/:id  (el admin edita un usuario: solo se cambia lo que se envía)
export const updateUserSchema = z
  .object({
    name: text("El nombre es obligatorio", "El nombre debe ser un texto").max(80, "El nombre no puede superar los 80 caracteres").optional(),
    email: email.optional(),
    password: password("La contraseña es obligatoria").optional(),
  })
  .refine((body) => Object.keys(body).length > 0, "No se ha enviado nada para modificar");
