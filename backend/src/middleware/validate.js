import AppError from "../services/utils/AppError.js";

// Middleware de validación con Zod. Se usa en las rutas, justo antes del controlador:
//
//   router.post("/", validate({ body: createChargerSchema }), ctrl.postCharger);
//
// Valida req.params, req.query y/o req.body contra el esquema que se le pase. Si todo es correcto,
// sustituye los datos por los ya limpios (campos desconocidos fuera, textos sin espacios sobrantes).
// Si algo falla, lanza un AppError 400 que recoge el middleware de errores.
const validate = (schemas) => (req, _res, next) => {
  const errors = [];
  const clean = {};

  for (const source of ["params", "query", "body"]) {
    const schema = schemas[source];
    if (!schema) {
      continue;
    }

    const result = schema.safeParse(req[source] ?? {});
    if (result.success) {
      clean[source] = result.data;
    } else {
      for (const issue of result.error.issues) {
        errors.push({ field: issue.path.join("."), message: issue.message });
      }
    }
  }

  if (errors.length > 0) {
    const message = [...new Set(errors.map((e) => e.message))].join(". ");
    return next(new AppError(message, 400, errors));
  }

  if (clean.body) {
    req.body = clean.body;
  }
  if (clean.query) {
    req.query = clean.query;
  }
  next();
};

export default validate;
