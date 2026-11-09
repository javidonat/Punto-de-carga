import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import errorHandler from "./middleware/errorHandler.js";
import AppError from "./services/utils/AppError.js";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import chargersRoutes from "./routes/chargers.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import shiftsRoutes from "./routes/shifts.routes.js";
import historyRoutes from "./routes/history.routes.js";
import absencesRoutes from "./routes/absences.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import incidentsRoutes from "./routes/incidents.routes.js";

const app = express();

// Carpeta del frontend (../../frontend respecto a este archivo)
const FRONTEND = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "frontend");

// --- Middlewares globales ---
app.use(
  helmet({
    // Permite cargar librerías del CDN jsDelivr (por ejemplo Chart.js para las gráficas)
    contentSecurityPolicy: { directives: { scriptSrc: ["'self'", "https://cdn.jsdelivr.net"] } },
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors()); // Permite peticiones desde otros orígenes
app.use(express.json()); // Parsea el body de las peticiones a JSON

// --- Health check (para comprobar que el servidor está vivo) ---
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// --- Rutas de la API ---
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/chargers", chargersRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/shifts", shiftsRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/absences", absencesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/incidents", incidentsRoutes);

// --- Frontend: se sirve desde la misma dirección (http://localhost:3000) ---
app.use(express.static(FRONTEND));

// --- Ruta no encontrada (404) ---
app.use((req, _res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
});

// --- Middleware de errores (siempre al final) ---
app.use(errorHandler);

export default app;
