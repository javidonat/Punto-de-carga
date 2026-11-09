import { Router } from "express";
import chargersCtrl from "../ctrls/chargers.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { isAdmin } from "../middleware/authorization.js";
import { activeSchema, idParamsSchema } from "../schemas/common.schema.js";
import { createChargerSchema, updateChargerSchema } from "../schemas/chargers.schema.js";

const router = Router();

// GET    /api/chargers                 → todos los puntos de recarga (cualquier usuario con sesión)
// POST   /api/chargers                 → crear uno (admin)
// PATCH  /api/chargers/:id             → cambiar nombre, tipo o potencia (admin)
// PATCH  /api/chargers/:id/active      → en servicio o averiado (admin, body: { "isActive": false })
// PATCH  /api/chargers/:id/softdelete  → quitarlo (admin)
router.use(authenticate);

router.get("/", chargersCtrl.getChargers);
router.post("/", isAdmin, validate({ body: createChargerSchema }), chargersCtrl.postCharger);
router.patch("/:id/active", isAdmin, validate({ params: idParamsSchema, body: activeSchema }), chargersCtrl.patchActive);
router.patch("/:id/softdelete", isAdmin, validate({ params: idParamsSchema }), chargersCtrl.patchSoftDelete);
router.patch("/:id", isAdmin, validate({ params: idParamsSchema, body: updateChargerSchema }), chargersCtrl.patchCharger);

export default router;
