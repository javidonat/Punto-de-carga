import { Cancellation } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Guarda la cancelación. Si ya existía (canceló dos veces la misma hora), no se duplica
const create = (userId, date, hour) => {
  return Cancellation.updateOne({ userId, date, hour }, { userId, date, hour }, { upsert: true });
};

// Cancelaciones entre dos fechas (las de una semana, para el reparto)
const findBetween = (fromDate, toDate) => {
  return Cancellation.find({ date: { $gte: fromDate, $lte: toDate } }).lean();
};

export default { create, findBetween };
