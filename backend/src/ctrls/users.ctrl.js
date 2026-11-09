import usersService from "../services/users.service.js";

// GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await usersService.getAllUsers();
    res.status(200).json({ ok: true, total: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id
const patchUser = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Usuario modificado correctamente", data: user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/active
const patchActive = async (req, res, next) => {
  try {
    const user = await usersService.setActive(req.user.id, req.params.id, req.body);
    res.status(200).json({
      ok: true,
      message: user.isActive ? "Usuario dado de alta correctamente" : "Usuario dado de baja correctamente",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/role
const patchRole = async (req, res, next) => {
  try {
    const user = await usersService.setRole(req.user.id, req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Rol cambiado correctamente", data: user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/softdelete
const patchSoftDelete = async (req, res, next) => {
  try {
    const user = await usersService.softDeleteUser(req.user.id, req.params.id);
    res.status(200).json({ ok: true, message: "Usuario eliminado correctamente", data: user });
  } catch (error) {
    next(error);
  }
};

export default { getUsers, patchUser, patchActive, patchRole, patchSoftDelete };
