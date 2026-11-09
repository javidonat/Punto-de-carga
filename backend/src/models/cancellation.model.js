import mongoose from "mongoose";

const { Schema } = mongoose;

// Turno cancelado: el usuario dijo que ese día y a esa hora NO puede, aunque su horario diga que sí.
// Se guarda para que el reparto no se lo vuelva a dar (ni al rellenar huecos ni al regenerar la semana)
const cancellationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // "AAAA-MM-DD"
    hour: { type: Number, required: true, min: 0, max: 23 },
  },
  { timestamps: true }
);

cancellationSchema.index({ userId: 1, date: 1, hour: 1 }, { unique: true });
cancellationSchema.index({ date: 1 });

export default mongoose.model("Cancellation", cancellationSchema);
