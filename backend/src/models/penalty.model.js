import mongoose from "mongoose";

const { Schema } = mongoose;

// Penalización: horas de castigo que se suman al contador del reparto (ver PENALTY_HOURS en constants.js)
const penaltySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hours: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true }, // texto que ve el usuario
  },
  { timestamps: true }
);

penaltySchema.index({ userId: 1 });

export default mongoose.model("Penalty", penaltySchema);
