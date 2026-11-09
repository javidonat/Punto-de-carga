import mongoose from "mongoose";

const { Schema } = mongoose;

// Aviso para un usuario (sale en su página de inicio hasta que lo marca como leído).
// Por ejemplo: "Se te ha asignado un turno nuevo" o "Tienes una penalización"
const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
