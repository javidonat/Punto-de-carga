import { Router } from "express";
import historyCtrl from "../ctrls/history.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { isAdmin } from "../middleware/authorization.js";
import { statsQuerySchema } from "../schemas/history.schema.js";

const router = Router();

// GET    /api/history/me     → mis horas totales y por semana
// GET    /api/history/users  → horas totales de cada usuario (admin)
// GET    /api/history/stats?period=day|week|month|year[&userId=]  → datos para las gráficas
router.use(authenticate);

router.get("/me", historyCtrl.getMyHistory);
router.get("/users", isAdmin, historyCtrl.getUsersHistory);
router.get("/stats", validate({ query: statsQuerySchema }), historyCtrl.getStats);

export default router;
