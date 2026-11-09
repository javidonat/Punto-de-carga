import authService from "../services/auth.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ ok: true, message: "Cuenta creada correctamente", data });
  } catch (error) {
    next(error); // Pasa el error al middleware de errores
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.status(200).json({ ok: true, message: "Sesión iniciada correctamente", data });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout (req.user lo pone el middleware de autenticación)
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.status(200).json({ ok: true, message: "Sesión cerrada correctamente" });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const me = (req, res) => {
  res.status(200).json({ ok: true, data: req.user });
};

// PATCH /api/auth/password
const changePassword = async (req, res, next) => {
  try {
    const data = await authService.changePassword(req.user.id, req.body);
    res.status(200).json({ ok: true, message: "Contraseña cambiada correctamente", data });
  } catch (error) {
    next(error);
  }
};

export default { register, login, logout, me, changePassword };
