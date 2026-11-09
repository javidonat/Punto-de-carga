// Roles de usuario. El primero que se registra es "admin"; el resto, "user"
export const ROLES = ["admin", "user"];
export const ADMIN_ROLE = "admin";
export const USER_ROLE = "user";

// Algoritmos de reparto de turnos (ampliación 2 del enunciado):
//   hours  → gana quien tenga menos horas en total (semanas anteriores + esta). Es el del enunciado
//   week   → gana quien tenga menos horas ESTA semana (reparto más igualado cada semana)
//   random → sorteo entre los disponibles
export const ALGORITHMS = ["hours", "week", "random"];

// Días de la semana: 0 = lunes ... 6 = domingo
export const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

// Día a partir del cual se generan solos los turnos de la semana siguiente (4 = viernes)
export const AUTO_GENERATE_DAY = 4;

// Puntos de recarga que se crean la primera vez que arranca el servidor
export const DEFAULT_CHARGERS = 4;

// Estado de un turno (cada hora). Después de cargar, el usuario confirma qué pasó:
//   pending      → aún no ha confirmado (o el turno no ha llegado)
//   charged      → "He cargado"
//   not_charged  → "No he cargado" (no fue o no lo necesitó)
//   blocked      → "Mi sitio estaba ocupado" (abre una incidencia contra quien lo ocupaba)
//   unconfirmed  → no lo confirmó a tiempo
export const SHIFT_STATUS = ["pending", "charged", "not_charged", "blocked", "unconfirmed"];

// Lo que puede responder el usuario al confirmar (blocked va por las incidencias)
export const CONFIRM_STATUS = ["charged", "not_charged"];

// Penalizaciones: horas de castigo que se suman al contador del reparto, así los demás tienen prioridad.
// Cancelar un turno ANTES de que empiece no penaliza
export const PENALTY_HOURS = {
  not_charged: 1, // dijo que no cargó: ocupó el sitio sin aprovecharlo, pero avisó
  unconfirmed: 3, // no confirmó a tiempo
  blocking: 5, // dejó el coche en el sitio de otro (incidencia aceptada por el admin)
};

// Días que tiene el usuario para confirmar: hasta que acaba el día siguiente al turno
export const CONFIRM_DAYS = 1;

// Estado de una incidencia
export const INCIDENT_STATUS = ["open", "accepted", "rejected"];
