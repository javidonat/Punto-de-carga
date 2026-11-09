import { Router } from "express";
import authCtrl from "../ctrls/auth.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { loginSchema, passwordSchema, registerSchema } from "../schemas/auth.schema.js";

const router = Router();

// POST   /api/auth/register  → nombre, email y contraseña. El primero que se registra es el admin
// POST   /api/auth/login     → email + password. Devuelve el JWT y los datos básicos del usuario
// POST   /api/auth/logout    → con Authorization: Bearer <token>. El token deja de valer
// GET    /api/auth/me        → datos del usuario con sesión iniciada
// PATCH  /api/auth/password  → contraseña actual + nueva. Devuelve un token nuevo

router.post("/register", validate({ body: registerSchema }), authCtrl.register);
router.post("/login", validate({ body: loginSchema }), authCtrl.login);
router.post("/logout", authenticate, authCtrl.logout);
router.get("/me", authenticate, authCtrl.me);
router.patch("/password", authenticate, validate({ body: passwordSchema }), authCtrl.changePassword);

export default router;
