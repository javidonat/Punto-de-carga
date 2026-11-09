import mongoose from "mongoose";
import { SHIFT_STATUS } from "./constants.js";

const { Schema } = mongoose;

// Turno de carga: qué usuario carga en qué punto de recarga, qué día y a qué hora (franja de 1 hora).
// Las fechas se guardan como texto "AAAA-MM-DD" para no tener líos con las zonas horarias
const shiftSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    chargerId: { type: Schema.Types.ObjectId, ref: "Charger", required: true },
    week: { type: String, required: true }, // lunes de la semana
    date: { type: String, required: true }, // día concreto
    day: { type: Number, required: true, min: 0, max: 6 }, // 0 = lunes ... 6 = domingo
    hour: { type: Number, required: true, min: 0, max: 23 },
    manual: { type: Boolean, default: false }, // true = lo puso el admin a mano (no se toca al regenerar)
    status: { type: String, enum: SHIFT_STATUS, default: "pending" }, // lo que confirmó el usuario (ver constants.js)
  },
  { timestamps: true }
);

// Un punto de recarga solo puede tener un coche a la vez, y un usuario solo un turno a la vez
shiftSchema.index({ chargerId: 1, date: 1, hour: 1 }, { unique: true });
shiftSchema.index({ userId: 1, date: 1, hour: 1 }, { unique: true });
shiftSchema.index({ week: 1 });
shiftSchema.index({ status: 1, date: 1 });

export default mongoose.model("Shift", shiftSchema);
