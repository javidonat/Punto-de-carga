import "dotenv/config";
import mongoose from "mongoose";
import conectarDB from "./config/db.js";
import { User, Availability } from "./models/index.js";
import { hashPassword } from "./services/utils/password.js";
import chargersService from "./services/chargers.service.js";

// Datos de prueba: un admin y tres usuarios con su horario.
// Solo se crean si la base de datos no tiene usuarios (no borra nada).
//   npm run seed
// Para BORRAR TODA la base de datos y empezar de cero con los datos de prueba:
//   npm run seed -- --reset
// Todos tienen la contraseña 1234

const USERS = [
  { name: "Admin", email: "admin@recarga.com", role: "admin", slots: [] },
  { name: "Ana", email: "ana@recarga.com", role: "user", days: [0, 1, 2, 3, 4], from: 8, to: 14 },
  { name: "Bea", email: "bea@recarga.com", role: "user", days: [0, 2, 4], from: 9, to: 17 },
  { name: "Carlos", email: "carlos@recarga.com", role: "user", days: [1, 3], from: 15, to: 20 },
];

// Franjas de esos días entre "from" y "to" (sin incluir "to")
const slotsOf = ({ days = [], from, to }) => days.flatMap((day) => Array.from({ length: to - from }, (_, i) => ({ day, hour: from + i })));

const seed = async () => {
  await conectarDB();
  if (process.argv.includes("--reset")) {
    await mongoose.connection.dropDatabase();
    console.log("🗑️  Base de datos borrada");
  }
  await chargersService.ensureDefaultChargers();

  if ((await User.countDocuments()) > 0) {
    console.log("ℹ️  Ya hay usuarios en la base de datos: no se crea nada");
    return;
  }

  const passwordHash = await hashPassword("1234");
  for (const data of USERS) {
    const user = await User.create({ name: data.name, email: data.email, role: data.role, passwordHash });
    await Availability.create({ userId: user._id, slots: slotsOf(data) });
    console.log(`👤 ${data.email} (${data.role})`);
  }
  console.log("✅ Datos de prueba creados. Contraseña de todos: 1234");
};

seed()
  .catch((err) => console.error("Error en el seed:", err))
  .finally(() => mongoose.disconnect());
