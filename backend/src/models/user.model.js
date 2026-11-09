import mongoose from "mongoose";
import { ROLES } from "./constants.js";

const { Schema } = mongoose;

// Usuarios de la aplicación (los que cargan el coche y los administradores)
const userSchema = new Schema(
  {
    name: { type: String, required: [true, "El nombre es obligatorio"], trim: true },
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "El email no es válido"],
    },
    // NUNCA la contraseña en claro: aquí va el hash. select:false evita devolverlo en las consultas
    passwordHash: { type: String, required: [true, "La contraseña es obligatoria"], select: false },
    role: {
      type: String,
      enum: { values: ROLES, message: "El rol '{VALUE}' no es válido" },
      default: "user",
    },
    lastLoginAt: { type: Date, default: null },
    // Versión de los tokens del usuario: el logout la incrementa y los JWT con la versión anterior dejan de valer
    tokenVersion: { type: Number, default: 0, select: false },

    isActive: { type: Boolean, default: true }, // false = dado de baja (no puede entrar ni recibe turnos)
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    // El hash y la versión del token no salen nunca en el JSON, aunque se hayan leído
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.tokenVersion;
        return ret;
      },
    },
  }
);

export default mongoose.model("User", userSchema);
