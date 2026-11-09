import availabilityRepo from "../repos/availability.repo.js";
import shiftsService from "./shifts.service.js";

// Ordena por día y hora y quita las franjas repetidas
const cleanSlots = (slots) => {
  const unique = new Map();
  for (const slot of slots) {
    unique.set(`${slot.day}-${slot.hour}`, { day: slot.day, hour: slot.hour });
  }
  return [...unique.values()].sort((a, b) => a.day - b.day || a.hour - b.hour);
};

// GET /api/availability/me: las franjas en las que el usuario puede cargar
const getMySlots = async (userId) => {
  const availability = await availabilityRepo.findByUserId(userId);
  return availability ? cleanSlots(availability.slots) : [];
};

// PUT /api/availability/me: sustituye el horario entero y adapta sus turnos al horario nuevo
const replaceMySlots = async (userId, { slots }) => {
  const availability = await availabilityRepo.replaceSlots(userId, cleanSlots(slots));
  await shiftsService.adaptToNewSlots(userId, availability.slots);
  return availability.slots;
};

export default { getMySlots, replaceMySlots };
