import { z } from "zod";
import { email, password, text } from "./common.schema.js";

// POST /api/auth/register
export const registerSchema = z.object({
  name: text("El nombre es obligatorio", "El nombre debe ser un texto").max(80, "El nombre no puede superar los 80 caracteres"),
  email,
  password: password("La contraseña es obligatoria"),
});

// POST /api/auth/login
export const loginSchema = z.object({
  email,
  password: z
    .string({ error: (issue) => (issue.input === undefined ? "La contraseña es obligatoria" : "La contraseña debe ser un texto") })
    .min(1, "La contraseña es obligatoria"),
});

// PATCH /api/auth/password
export const passwordSchema = z.object({
  currentPassword: z.string({ error: "La contraseña actual es obligatoria" }).min(1, "La contraseña actual es obligatoria"),
  newPassword: password("La contraseña nueva es obligatoria"),
});
