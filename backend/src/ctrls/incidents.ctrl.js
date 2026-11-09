import incidentsService from "../services/incidents.service.js";

// POST /api/incidents
const postIncident = async (req, res, next) => {
  try {
    const incident = await incidentsService.createIncident(req.user, req.body);
    res.status(201).json({ ok: true, message: "Incidencia enviada: el administrador la revisará", data: incident });
  } catch (error) {
    next(error);
  }
};

// GET /api/incidents/me
const getMine = async (req, res, next) => {
  try {
    const incidents = await incidentsService.getMine(req.user.id);
    res.status(200).json({ ok: true, total: incidents.length, data: incidents });
  } catch (error) {
    next(error);
  }
};

// GET /api/incidents
const getAll = async (req, res, next) => {
  try {
    const incidents = await incidentsService.getAll();
    res.status(200).json({ ok: true, total: incidents.length, data: incidents });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/incidents/:id
const patchIncident = async (req, res, next) => {
  try {
    const incident = await incidentsService.resolveIncident(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Incidencia resuelta", data: incident });
  } catch (error) {
    next(error);
  }
};

export default { postIncident, getMine, getAll, patchIncident };
