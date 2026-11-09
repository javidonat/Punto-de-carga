import { Router } from "express";
import absencesCtrl from "../ctrls/absences.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { isUser } from "../middleware/authorization.js";
import { idParamsSchema } from "../schemas/common.schema.js";
import { absenceSchema } from "../schemas/absences.schema.js";

const router = Router();

// GET    /api/absences/me      → mis ausencias que aún no han terminado
// POST   /api/absences/me      → no vengo esos días (body: { "from": "2026-11-16", "to": "2026-11-22" }, to null = indefinida)
// DELETE /api/absences/me/:id  → quitar una ausencia (vuelvo a entrar en el reparto)
router.use(authenticate, isUser);

router.get("/me", absencesCtrl.getMine);
router.post("/me", validate({ body: absenceSchema }), absencesCtrl.postMine);
router.delete("/me/:id", validate({ params: idParamsSchema }), absencesCtrl.deleteMine);

export default router;
