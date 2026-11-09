import mongoose from "mongoose";

const { Schema } = mongoose;

// Ausencia: días en los que el usuario NO va a venir, aunque su horario diga que sí.
// Sirve para un día suelto (from = to), una semana (de lunes a domingo) o indefinida (to = null)
const absenceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    from: { type: String, required: true }, // "AAAA-MM-DD", primer día que no viene
    to: { type: String, default: null }, // último día que no viene. null = hasta que la quite
  },
  { timestamps: true }
);

absenceSchema.index({ userId: 1, from: 1 });

export default mongoose.model("Absence", absenceSchema);
