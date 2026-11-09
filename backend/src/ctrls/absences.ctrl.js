import absencesService from "../services/absences.service.js";

// GET /api/absences/me
const getMine = async (req, res, next) => {
  try {
    const absences = await absencesService.getMine(req.user.id);
    res.status(200).json({ ok: true, total: absences.length, data: absences });
  } catch (error) {
    next(error);
  }
};

// POST /api/absences/me
const postMine = async (req, res, next) => {
  try {
    const absence = await absencesService.createMine(req.user.id, req.body);
    res.status(201).json({ ok: true, message: "Ausencia guardada: tus turnos de esos días pasan a otros", data: absence });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/absences/me/:id
const deleteMine = async (req, res, next) => {
  try {
    await absencesService.deleteMine(req.user.id, req.params.id);
    res.status(200).json({ ok: true, message: "Ausencia quitada: vuelves a entrar en el reparto", data: null });
  } catch (error) {
    next(error);
  }
};

export default { getMine, postMine, deleteMine };
