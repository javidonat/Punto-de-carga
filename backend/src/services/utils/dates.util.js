// Utilidades de fechas. Todas las fechas van como texto "AAAA-MM-DD"

export const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const fromDateString = (text) => {
  const [y, m, d] = text.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const today = () => toDateString(new Date());

// Hora actual (0-23). Junto con today() marca "desde ahora": las horas anteriores ya han pasado
export const currentHour = () => new Date().getHours();

// ¿Ha empezado ya el turno de ese día a esa hora? (los que han empezado ya no se pueden cancelar ni quitar)
export const hasStarted = (date, hour) => date < today() || (date === today() && hour <= currentHour());

// ¿Ha terminado ya el turno de ese día a esa hora? (es lo mismo que "ha empezado la hora siguiente")
export const hasEnded = (date, hour) => hasStarted(date, hour + 1);

// Día de la semana de una fecha: 0 = lunes ... 6 = domingo
export const dayOfWeek = (text) => (fromDateString(text).getDay() + 6) % 7;

// Lunes de la semana de una fecha (por defecto, hoy)
export const mondayOf = (text = today()) => {
  const date = fromDateString(text);
  date.setDate(date.getDate() - dayOfWeek(text));
  return toDateString(date);
};

export const addDays = (text, days) => {
  const date = fromDateString(text);
  date.setDate(date.getDate() + days);
  return toDateString(date);
};

// "AAAA-MM-DD" y que sea una fecha que existe (no vale "2026-02-31")
export const isValidDate = (text) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text || "")) {
    return false;
  }
  return toDateString(fromDateString(text)) === text;
};

// "AAAA-MM-DD" → "DD/MM" (para los textos de los avisos)
export const shortDate = (text) => text.split("-").reverse().slice(0, 2).join("/");
