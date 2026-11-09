import { Router } from "express";
import shiftsCtrl from "../ctrls/shifts.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { isAdmin, isUser } from "../middleware/authorization.js";
import { idParamsSchema, weekQuerySchema } from "../schemas/common.schema.js";
import { confirmSchema, generateSchema, manualShiftSchema, settingsSchema } from "../schemas/shifts.schema.js";

const router = Router();

// GET    /api/shifts/me?week=      → mis turnos de la semana y los avisos de enchufar/desenchufar
// GET    /api/shifts/me/pending    → mis turnos que ya han terminado y aún no he confirmado (en bloques)
// PATCH  /api/shifts/me/confirm    → confirmar un bloque (body: { "ids": [...], "status": "charged" | "not_charged" })
// DELETE /api/shifts/me/:id        → cancelar un turno mío que aún no ha empezado
// GET    /api/shifts/settings      → algoritmo y límites del reparto (admin)
// PATCH  /api/shifts/settings      → cambiarlos (admin)
// GET    /api/shifts?week=         → todos los turnos de la semana (admin)
// POST   /api/shifts/generate      → repartir los turnos de la semana (admin, body: { "week": "2026-11-02" })
// POST   /api/shifts               → turno a mano (admin)
// DELETE /api/shifts/:id           → quitar un turno que aún no ha empezado (admin)
router.use(authenticate);

router.get("/me", isUser, validate({ query: weekQuerySchema }), shiftsCtrl.getMyShifts);
router.get("/me/pending", isUser, shiftsCtrl.getMyPending);
router.patch("/me/confirm", isUser, validate({ body: confirmSchema }), shiftsCtrl.patchConfirm);
router.delete("/me/:id", isUser, validate({ params: idParamsSchema }), shiftsCtrl.deleteMyShift);

router.get("/settings", isAdmin, shiftsCtrl.getSettings);
router.patch("/settings", isAdmin, validate({ body: settingsSchema }), shiftsCtrl.patchSettings);
router.get("/", isAdmin, validate({ query: weekQuerySchema }), shiftsCtrl.getWeekShifts);
router.post("/generate", isAdmin, validate({ body: generateSchema }), shiftsCtrl.postGenerate);
router.post("/", isAdmin, validate({ body: manualShiftSchema }), shiftsCtrl.postShift);
router.delete("/:id", isAdmin, validate({ params: idParamsSchema }), shiftsCtrl.deleteShift);

export default router;
