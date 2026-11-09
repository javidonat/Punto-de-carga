import mongoose from "mongoose";
import { INCIDENT_STATUS } from "./constants.js";

const { Schema } = mongoose;

// Incidencia: un usuario no pudo cargar en su turno porque su punto de recarga estaba ocupado.
// Se apunta contra quien tenía ese punto justo la hora anterior (lo más probable es que no quitara el coche).
// El admin la revisa: si la acepta, esa persona recibe una penalización
const incidentSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // quien avisa
    reportedUserId: { type: Schema.Types.ObjectId, ref: "User", default: null }, // quien ocupaba el sitio (null = no se sabe)
    chargerId: { type: Schema.Types.ObjectId, ref: "Charger", required: true },
    date: { type: String, required: true },
    hour: { type: Number, required: true, min: 0, max: 23 }, // hora en la que empezaba el turno
    shiftIds: [{ type: Schema.Types.ObjectId, ref: "Shift" }], // las horas del turno que no pudo cargar
    description: { type: String, trim: true, default: "" },
    status: { type: String, enum: INCIDENT_STATUS, default: "open" },
  },
  { timestamps: true }
);

incidentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Incident", incidentSchema);
