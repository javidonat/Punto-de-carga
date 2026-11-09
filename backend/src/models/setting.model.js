import mongoose from "mongoose";
import { ALGORITHMS } from "./constants.js";

const { Schema } = mongoose;

// Ajustes del reparto de turnos. Solo hay un documento (lo crea settings.repo.js la primera vez)
const settingSchema = new Schema(
  {
    algorithm: {
      type: String,
      enum: { values: ALGORITHMS, message: "El algoritmo '{VALUE}' no es válido" },
      default: "hours",
    },
    maxHoursPerWeek: { type: Number, min: 0, default: 0 }, // 0 = sin límite
    maxConsecutiveHours: { type: Number, min: 1, default: 3 }, // horas seguidas en el mismo punto de recarga
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);
