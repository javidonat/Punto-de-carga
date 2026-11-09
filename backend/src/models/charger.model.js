import mongoose from "mongoose";

const { Schema } = mongoose;

// Punto de recarga. Al principio hay 4; el admin puede añadir, quitar o marcar como averiado
const chargerSchema = new Schema(
  {
    name: { type: String, required: [true, "El nombre es obligatorio"], trim: true },
    type: { type: String, trim: true, default: "" }, // tipo de conector, p. ej. "Tipo 2" o "Schuko"
    powerKw: { type: Number, min: [0, "La potencia no puede ser negativa"], default: null }, // null = sin dato

    isActive: { type: Boolean, default: true }, // false = averiado / fuera de servicio
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Charger", chargerSchema);
