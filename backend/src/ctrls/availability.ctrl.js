import availabilityService from "../services/availability.service.js";

// GET /api/availability/me
const getMySlots = async (req, res, next) => {
  try {
    const slots = await availabilityService.getMySlots(req.user.id);
    res.status(200).json({ ok: true, total: slots.length, data: slots });
  } catch (error) {
    next(error);
  }
};

// PUT /api/availability/me
const putMySlots = async (req, res, next) => {
  try {
    const slots = await availabilityService.replaceMySlots(req.user.id, req.body);
    res.status(200).json({ ok: true, message: "Horario guardado correctamente", total: slots.length, data: slots });
  } catch (error) {
    next(error);
  }
};

export default { getMySlots, putMySlots };
