import { Incident } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

const POPULATE = [
  { path: "reporterId", select: "name email" },
  { path: "reportedUserId", select: "name email" },
  { path: "chargerId", select: "name" },
];

const create = async (data) => {
  const incident = await Incident.create(data);
  return incident.toObject();
};

// Todas (panel del admin): primero las abiertas, y de la más nueva a la más vieja
const findAll = async () => {
  const incidents = await Incident.find().populate(POPULATE).sort({ createdAt: -1 }).lean();
  return [...incidents.filter((i) => i.status === "open"), ...incidents.filter((i) => i.status !== "open")];
};

// Las que ha puesto un usuario
const findByReporter = (reporterId) => {
  return Incident.find({ reporterId }).populate(POPULATE).sort({ createdAt: -1 }).lean();
};

const findById = (id) => {
  return Incident.findById(id).lean();
};

// Solo cambia si sigue abierta (para no resolver dos veces la misma)
const resolve = (id, status) => {
  return Incident.findOneAndUpdate({ _id: id, status: "open" }, { status }, { new: true }).lean();
};

export default { create, findAll, findByReporter, findById, resolve };
