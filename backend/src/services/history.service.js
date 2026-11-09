import shiftsRepo from "../repos/shifts.repo.js";
import usersRepo from "../repos/users.repo.js";
import penaltiesRepo from "../repos/penalties.repo.js";
import { ADMIN_ROLE, USER_ROLE } from "../models/constants.js";

// GET /api/history/me: mis horas cargadas (total y por semana) y mis horas de penalización
const getMyHistory = async (userId) => {
  const [hours, penalties] = await Promise.all([shiftsRepo.countHoursOfUser(userId), penaltiesRepo.findByUser(userId)]);
  const penaltyHours = penalties.reduce((sum, p) => sum + p.hours, 0);
  return { ...hours, penaltyHours, penalties };
};

// GET /api/history/users: horas cargadas y de penalización de cada usuario (sin los admins), de más a menos
const getUsersHistory = async () => {
  const [users, hours, penaltyHours] = await Promise.all([usersRepo.findAll(), shiftsRepo.countHoursByUser(), penaltiesRepo.sumByUser()]);
  const hoursByUser = Object.fromEntries(hours.map((row) => [String(row.userId), row.hours]));
  return users
    .filter((user) => user.role === USER_ROLE)
    .map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      hours: hoursByUser[String(user._id)] || 0,
      penaltyHours: penaltyHours[String(user._id)] || 0,
    }))
    .sort((a, b) => b.hours - a.hours || a.name.localeCompare(b.name));
};

// GET /api/history/stats?period=day|week|month|year[&userId=]: datos para las gráficas.
// Un usuario normal solo ve las suyas; el admin ve las de todos o las de un usuario
const getStats = (user, { period, userId }) => {
  if (user.role !== ADMIN_ROLE) {
    return shiftsRepo.countHoursByPeriod(period, user.id);
  }
  return shiftsRepo.countHoursByPeriod(period, userId || null);
};

export default { getMyHistory, getUsersHistory, getStats };
