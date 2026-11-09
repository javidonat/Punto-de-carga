import mongoose from "mongoose";

const { Schema } = mongoose;

// Una franja de una hora en la que el usuario PUEDE dejar el coche cargando
const slotSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 }, // 0 = lunes ... 6 = domingo
    hour: { type: Number, required: true, min: 0, max: 23 },
  },
  { _id: false }
);

// Horario semanal de un usuario: un documento por usuario con todas sus franjas
const availabilitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    slots: { type: [slotSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Availability", availabilitySchema);
