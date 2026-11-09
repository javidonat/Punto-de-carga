import shiftsService from "../services/shifts.service.js";

// GET /api/shifts/me?week=
const getMyShifts = async (req, res, next) => {
  try {
    const data = await shiftsService.getMyShifts(req.user.id, req.query.week);
    res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/shifts/me/:id
const deleteMyShift = async (req, res, next) => {
  try {
    await shiftsService.cancelMyShift(req.user.id, req.params.id);
    res.status(200).json({ ok: true, message: "Turno cancelado correctamente" });
  } catch (error) {
    next(error);
  }
};

// GET /api/shifts/me/pending
const getMyPending = async (req, res, next) => {
  try {
    const blocks = await shiftsService.getMyPending(req.user.id);
    res.status(200).json({ ok: true, total: blocks.length, data: blocks });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/shifts/me/confirm
const patchConfirm = async (req, res, next) => {
  try {
    await shiftsService.confirmMyShifts(req.user.id, req.body);
    res.status(200).json({ ok: true, message: "Turno confirmado", data: null });
  } catch (error) {
    next(error);
  }
};

// GET /api/shifts?week=
const getWeekShifts = async (req, res, next) => {
  try {
    const data = await shiftsService.getWeekShifts(req.query.week);
    res.status(200).json({ ok: true, total: data.shifts.length, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/shifts/generate
const postGenerate = async (req, res, next) => {
  try {
    const data = await shiftsService.generateWeek(req.body.week);
    res.status(201).json({ ok: true, message: `Se han repartido ${data.created} turnos`, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/shifts
const postShift = async (req, res, next) => {
  try {
    const shift = await shiftsService.createManualShift(req.body);
    res.status(201).json({ ok: true, message: "Turno añadido correctamente", data: shift });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/shifts/:id
const deleteShift = async (req, res, next) => {
  try {
    await shiftsService.deleteShift(req.params.id);
    res.status(200).json({ ok: true, message: "Turno eliminado correctamente" });
  } catch (error) {
    next(error);
  }
};

// GET /api/shifts/settings
const getSettings = async (req, res, next) => {
  try {
    const settings = await shiftsService.getSettings();
    res.status(200).json({ ok: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/shifts/settings
const patchSettings = async (req, res, next) => {
  try {
    const settings = await shiftsService.updateSettings(req.body);
    res.status(200).json({ ok: true, message: "Ajustes guardados correctamente", data: settings });
  } catch (error) {
    next(error);
  }
};

export default { getMyShifts, getMyPending, patchConfirm, deleteMyShift, getWeekShifts, postGenerate, postShift, deleteShift, getSettings, patchSettings };
