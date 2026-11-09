// Clase para crear errores personalizados con código de estado HTTP
//
// Uso:  throw new AppError("Punto de recarga no encontrado", 404);
//       throw new AppError("Datos no válidos", 400, [{ field: "name", message: "..." }]);
class AppError extends Error {
  // message    → texto que verá el cliente
  // statusCode → código HTTP (400, 404, 409...)
  // errors     → (opcional) detalle por campo, útil en errores de validación
  constructor(message, statusCode = 500, errors = undefined) {
    super(message); // Llama al constructor de Error con el mensaje
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true; // Error previsto (no es un bug): su mensaje se puede mostrar al cliente
    if (errors) {
      this.errors = errors;
    }

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export default AppError;
