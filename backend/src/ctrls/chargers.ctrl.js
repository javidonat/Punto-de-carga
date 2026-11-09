import chargersService from "../services/chargers.service.js";

// GET /api/chargers
const getChargers = async (req, res, next) => {
  try {
    const chargers = await chargersService.getAllChargers();
    res.status(200).json({ ok: true, total: chargers.length, data: chargers });
  } catch (error) {
    next(error);
  }
};

// POST /api/chargers
const postCharger = async (req, res, next) => {
  try {
    const charger = await chargersService.createCharger(req.body);
    res.status(201).json({ ok: true, message: "Punto de recarga creado correctamente", data: charger });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/chargers/:id
const patchCharger = async (req, res, next) => {
  try {
    const charger = await chargersService.updateCharger(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Punto de recarga modificado correctamente", data: charger });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/chargers/:id/active
const patchActive = async (req, res, next) => {
  try {
    const charger = await chargersService.setActive(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      message: charger.isActive ? "Punto de recarga en servicio" : "Punto de recarga marcado como averiado",
      data: charger,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/chargers/:id/softdelete
const patchSoftDelete = async (req, res, next) => {
  try {
    const charger = await chargersService.softDeleteCharger(req.params.id);
    res.status(200).json({ ok: true, message: "Punto de recarga eliminado correctamente", data: charger });
  } catch (error) {
    next(error);
  }
};

export default { getChargers, postCharger, patchCharger, patchActive, patchSoftDelete };
