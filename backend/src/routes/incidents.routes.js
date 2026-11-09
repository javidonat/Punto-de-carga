import { Router } from "express";
import incidentsCtrl from "../ctrls/incidents.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { isAdmin, isUser } from "../middleware/authorization.js";
import { idParamsSchema } from "../schemas/common.schema.js";
import { incidentSchema, resolveSchema } from "../schemas/incidents.schema.js";

const router = Router();

// POST   /api/incidents      → "mi punto estaba ocupado" (body: { "ids": [...], "description": "..." })
// GET    /api/incidents/me   → las incidencias que he puesto yo
// GET    /api/incidents      → todas (admin), primero las abiertas
// PATCH  /api/incidents/:id  → aceptar o rechazar (admin, body: { "status": "accepted" | "rejected" })
router.use(authenticate);

router.post("/", isUser, validate({ body: incidentSchema }), incidentsCtrl.postIncident);
router.get("/me", isUser, incidentsCtrl.getMine);
router.get("/", isAdmin, incidentsCtrl.getAll);
router.patch("/:id", isAdmin, validate({ params: idParamsSchema, body: resolveSchema }), incidentsCtrl.patchIncident);

export default router;
