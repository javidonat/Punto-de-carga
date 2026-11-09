import historyService from "../services/history.service.js";

// GET /api/history/me
const getMyHistory = async (req, res, next) => {
  try {
    const data = await historyService.getMyHistory(req.user.id);
    res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/history/users
const getUsersHistory = async (req, res, next) => {
  try {
    const users = await historyService.getUsersHistory();
    res.status(200).json({ ok: true, total: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// GET /api/history/stats?period=&userId=
const getStats = async (req, res, next) => {
  try {
    const stats = await historyService.getStats(req.user, req.query);
    res.status(200).json({ ok: true, total: stats.length, data: stats });
  } catch (error) {
    next(error);
  }
};

export default { getMyHistory, getUsersHistory, getStats };
