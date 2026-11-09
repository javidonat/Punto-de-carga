import mongoose from "mongoose";
import { Penalty } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

const createMany = (list) => {
  return Penalty.insertMany(list);
};

// Penalizaciones de un usuario, las más nuevas primero
const findByUser = (userId) => {
  return Penalty.find({ userId: new mongoose.Types.ObjectId(String(userId)) }).sort({ createdAt: -1 }).lean();
};

// Horas de castigo de cada usuario: { "<userId>": 6, ... }
const sumByUser = async () => {
  const rows = await Penalty.aggregate([{ $group: { _id: "$userId", hours: { $sum: "$hours" } } }]);
  return Object.fromEntries(rows.map((row) => [String(row._id), row.hours]));
};

export default { createMany, findByUser, sumByUser };
