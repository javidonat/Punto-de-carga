import { z } from "zod";
import { objectId } from "./common.schema.js";

// GET /api/history/stats?period=day|week|month|year[&userId=]
export const statsQuerySchema = z.object({
  period: z.enum(["day", "week", "month", "year"], { error: "period tiene que ser day, week, month o year" }).default("day"),
  userId: objectId("El usuario no es válido").optional(),
});
