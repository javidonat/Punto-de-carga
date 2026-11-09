import { Setting } from "../models/index.js";

// Solo hay un documento de ajustes. Si no existe todavía, se crea con los valores por defecto
const get = async () => {
  const setting = await Setting.findOne().lean();
  if (setting) {
    return setting;
  }
  const created = await Setting.create({});
  return created.toObject();
};

const update = async (data) => {
  await get(); // por si aún no existe
  return Setting.findOneAndUpdate({}, data, { new: true, runValidators: true }).lean();
};

export default { get, update };
