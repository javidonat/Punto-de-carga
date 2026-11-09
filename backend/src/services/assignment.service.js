import { addDays } from "./utils/dates.util.js";

// Algoritmo que reparte los turnos de una semana. Es una función "pura": no habla con la base de datos,
// recibe todos los datos ya cargados y devuelve la lista de turnos nuevos (así se puede probar fácilmente).
//
// Para cada día y hora (de ahora en adelante) y cada punto de recarga en servicio:
//   1. Busca los usuarios activos que han dicho que pueden cargar a esa hora.
//   2. Descarta a los que ya tienen turno a esa hora, los que cancelaron esa hora concreta,
//      los que han dicho que ese día no vienen (ausencias) y los que han llegado al máximo de horas de la semana.
//   3. Si quien cargaba la hora anterior en ese punto de recarga puede seguir, sigue
//      (hasta maxConsecutiveHours horas seguidas), para no enchufar y desenchufar cada hora.
//   4. Los puntos que quedan libres son para quien "menos ha cargado" según el algoritmo elegido
//      (ver constants.js). Si esa persona ya estaba en un punto la hora anterior, se queda en el mismo.
//
// Parámetros:
//   week           lunes de la semana ("AAAA-MM-DD")
//   fromDate       primer día que se reparte (hoy): los anteriores ya son histórico
//   fromHour       primera hora que se reparte de fromDate (la hora actual). Por defecto 0
//   chargerIds     ids de los puntos de recarga en servicio
//   userIds        ids de los usuarios activos
//   slotsByUser    { "<userId>": [{ day, hour }, ...] } horario de cada usuario
//   existingShifts turnos que ya hay esa semana y se quedan (todos los que no se van a rehacer)
//   cancelled      [{ userId, date, hour }] horas que cada usuario canceló: no se le vuelven a dar
//   absences       [{ userId, from, to }] días en los que el usuario no viene (to null = sin final)
//   hoursBefore    { "<userId>": 12 } horas de cada usuario en semanas anteriores (más sus penalizaciones)
//   settings       { algorithm, maxHoursPerWeek, maxConsecutiveHours }
export const assignShifts = ({
  week,
  fromDate,
  fromHour = 0,
  chargerIds,
  userIds,
  slotsByUser,
  existingShifts,
  cancelled = [],
  absences = [],
  hoursBefore,
  settings,
}) => {
  const maxWeek = settings.maxHoursPerWeek || Infinity; // 0 = sin límite
  const maxInARow = settings.maxConsecutiveHours || 1;

  // Quién está en cada punto de recarga a cada hora ("cargador|fecha|hora" → userId)
  const occupied = new Map();
  // Qué usuarios ya tienen turno a cada hora ("usuario|fecha|hora")
  const busy = new Set();
  // Horas de cada usuario esta semana
  const hoursWeek = {};

  for (const id of userIds) {
    hoursWeek[id] = 0;
  }

  const addShift = (userId, chargerId, date, hour) => {
    occupied.set(`${chargerId}|${date}|${hour}`, userId);
    busy.add(`${userId}|${date}|${hour}`);
    hoursWeek[userId] = (hoursWeek[userId] || 0) + 1;
  };

  // Horas canceladas ("usuario|fecha|hora")
  const refused = new Set(cancelled.map((c) => `${c.userId}|${c.date}|${c.hour}`));

  // ¿Ese usuario ha dicho que ese día no viene?
  const isAbsent = (userId, date) =>
    absences.some((a) => a.userId === userId && a.from <= date && (a.to === null || a.to >= date));

  for (const shift of existingShifts) {
    addShift(String(shift.userId), String(shift.chargerId), shift.date, shift.hour);
  }

  // Cuántas horas seguidas lleva este usuario en este punto de recarga justo antes de "hour"
  const hoursInARow = (userId, chargerId, date, hour) => {
    let count = 0;
    while (hour - count - 1 >= 0 && occupied.get(`${chargerId}|${date}|${hour - count - 1}`) === userId) {
      count++;
    }
    return count;
  };

  // Usuarios que pueden cargar en cada franja ("dia-hora" → [userId, ...])
  const availableAt = new Map();
  for (const userId of userIds) {
    for (const slot of slotsByUser[userId] || []) {
      const key = `${slot.day}-${slot.hour}`;
      if (!availableAt.has(key)) {
        availableAt.set(key, []);
      }
      availableAt.get(key).push(userId);
    }
  }

  // Elige al que menos ha cargado. Si empatan, gana el que va antes en la lista (el más antiguo)
  const choose = (candidates) => {
    if (settings.algorithm === "random") {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    const total = (id) => (hoursBefore[id] || 0) + hoursWeek[id];
    const score = (id) => (settings.algorithm === "week" ? [hoursWeek[id], total(id)] : [total(id), 0]);
    return [...candidates].sort((a, b) => {
      const [a1, a2] = score(a);
      const [b1, b2] = score(b);
      return a1 - b1 || a2 - b2 || userIds.indexOf(a) - userIds.indexOf(b);
    })[0];
  };

  const newShifts = [];
  for (let day = 0; day < 7; day++) {
    const date = addDays(week, day);
    if (date < fromDate) {
      continue;
    }

    // Hoy se empieza en la hora actual: las anteriores ya han pasado
    const firstHour = date === fromDate ? fromHour : 0;
    for (let hour = firstHour; hour < 24; hour++) {
      let candidates = (availableAt.get(`${day}-${hour}`) || []).filter(
        (id) =>
          !busy.has(`${id}|${date}|${hour}`) &&
          !refused.has(`${id}|${date}|${hour}`) &&
          !isAbsent(id, date) &&
          hoursWeek[id] < maxWeek
      );

      const assign = (userId, chargerId) => {
        addShift(userId, chargerId, date, hour);
        newShifts.push({ userId, chargerId, week, date, day, hour, manual: false });
        candidates = candidates.filter((id) => id !== userId);
      };

      // Puntos de recarga libres a esta hora (en servicio y sin turno manual)
      let free = chargerIds.filter((chargerId) => !occupied.has(`${chargerId}|${date}|${hour}`));

      // 1.º Quien ya estaba cargando la hora anterior sigue en el mismo punto (sin pasar de maxInARow)
      for (const chargerId of [...free]) {
        const previous = occupied.get(`${chargerId}|${date}|${hour - 1}`);
        if (candidates.includes(previous) && hoursInARow(previous, chargerId, date, hour) < maxInARow) {
          assign(previous, chargerId);
          free = free.filter((id) => id !== chargerId);
        }
      }

      // 2.º Los puntos que quedan, para quien menos ha cargado. Si esa persona estaba
      // en un punto la hora anterior y sigue libre, se queda en él para no mover el coche
      while (free.length > 0 && candidates.length > 0) {
        const chosen = choose(candidates);
        const own = free.find((chargerId) => occupied.get(`${chargerId}|${date}|${hour - 1}`) === chosen);
        const chargerId = own || free[0];
        assign(chosen, chargerId);
        free = free.filter((id) => id !== chargerId);
      }
    }
  }
  return newShifts;
};
