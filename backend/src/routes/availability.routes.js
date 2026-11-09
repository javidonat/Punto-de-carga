import { Router } from "express";
import availabilityCtrl from "../ctrls/availability.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { isUser } from "../middleware/authorization.js";
import { slotsSchema } from "../schemas/availability.schema.js";

const router = Router();

// GET    /api/availability/me  → mi horario semanal: [{ day, hour }, ...]
// PUT    /api/availability/me  → sustituye mi horario entero (body: { "slots": [{ "day": 0, "hour": 9 }] })
router.use(authenticate, isUser); // el admin no tiene horario: no carga

router.get("/me", availabilityCtrl.getMySlots);
router.put("/me", validate({ body: slotsSchema }), availabilityCtrl.putMySlots);

export default router;
