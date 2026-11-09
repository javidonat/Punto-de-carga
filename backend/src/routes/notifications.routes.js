import { Router } from "express";
import notificationsCtrl from "../ctrls/notifications.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { idParamsSchema } from "../schemas/common.schema.js";

const router = Router();

// Para todos (usuarios y admins):
// GET    /api/notifications/me           → mis avisos sin leer
// PATCH  /api/notifications/me/read-all  → marcarlos todos como leídos
// PATCH  /api/notifications/me/:id/read  → marcar uno como leído
router.use(authenticate);

router.get("/me", notificationsCtrl.getMine);
router.patch("/me/read-all", notificationsCtrl.patchReadAll);
router.patch("/me/:id/read", validate({ params: idParamsSchema }), notificationsCtrl.patchRead);

export default router;
