import { Router } from "express";
import usersCtrl from "../ctrls/users.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { isAdmin } from "../middleware/authorization.js";
import { activeSchema, idParamsSchema } from "../schemas/common.schema.js";
import { roleSchema, updateUserSchema } from "../schemas/users.schema.js";

const router = Router();

// Todo solo para administradores:
// GET    /api/users                 → todos los usuarios con sus horas cargadas, penalizaciones y ausencia de hoy
// PATCH  /api/users/:id             → cambiar nombre, email o contraseña (body: { "name", "email", "password" }, todo opcional)
// PATCH  /api/users/:id/active      → dar de alta o de baja (body: { "isActive": false })
// PATCH  /api/users/:id/role        → cambiar el rol (body: { "role": "admin" })
// PATCH  /api/users/:id/softdelete  → borrado lógico (sus horas siguen en el histórico)
router.use(authenticate, isAdmin);

router.get("/", usersCtrl.getUsers);
router.patch("/:id", validate({ params: idParamsSchema, body: updateUserSchema }), usersCtrl.patchUser);
router.patch("/:id/active", validate({ params: idParamsSchema, body: activeSchema }), usersCtrl.patchActive);
router.patch("/:id/role", validate({ params: idParamsSchema, body: roleSchema }), usersCtrl.patchRole);
router.patch("/:id/softdelete", validate({ params: idParamsSchema }), usersCtrl.patchSoftDelete);

export default router;
