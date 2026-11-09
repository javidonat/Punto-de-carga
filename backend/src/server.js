import "dotenv/config";
import app from "./app.js";
import conectarDB from "./config/db.js";
import chargersService from "./services/chargers.service.js";
import shiftsService from "./services/shifts.service.js";
import penaltiesService from "./services/penalties.service.js";

const PORT = process.env.PORT || 3000;
const ONE_HOUR = 60 * 60 * 1000;

// Tareas automáticas: genera la semana siguiente a partir del viernes y rellena huecos (shifts.service.js),
// y penaliza los turnos que no se han confirmado a tiempo (penalties.service.js).
// Si fallan, se apunta en la terminal pero el servidor sigue funcionando
const autoTasks = () => {
  shiftsService.autoGenerate().catch((err) => console.error("Error en el reparto automático:", err));
  penaltiesService.checkUnconfirmed().catch((err) => console.error("Error al revisar las confirmaciones:", err));
};

// Primero conectamos a MongoDB, luego arrancamos el servidor
conectarDB()
  .then(() => chargersService.ensureDefaultChargers()) // los 4 puntos de recarga, si aún no hay ninguno
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor arrancado en http://localhost:${PORT}`);
    });
    autoTasks(); // al arrancar
    setInterval(autoTasks, ONE_HOUR); // y después, cada hora
  })
  .catch((err) => {
    console.error("Error al iniciar:", err);
    process.exit(1);
  });
