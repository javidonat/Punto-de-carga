import notificationsService from "../services/notifications.service.js";

// GET /api/notifications/me
const getMine = async (req, res, next) => {
  try {
    const notifications = await notificationsService.getMine(req.user.id);
    res.status(200).json({ ok: true, total: notifications.length, data: notifications });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/me/:id/read
const patchRead = async (req, res, next) => {
  try {
    const notification = await notificationsService.markRead(req.user.id, req.params.id);
    res.status(200).json({ ok: true, message: "Aviso marcado como leído", data: notification });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/me/read-all
const patchReadAll = async (req, res, next) => {
  try {
    await notificationsService.markAllRead(req.user.id);
    res.status(200).json({ ok: true, message: "Todos los avisos marcados como leídos", data: null });
  } catch (error) {
    next(error);
  }
};

export default { getMine, patchRead, patchReadAll };
