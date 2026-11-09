# ⚡ Punto de recarga

Aplicación web para repartir los turnos de los puntos de recarga de coches eléctricos del instituto. Cada usuario marca en qué horas puede cargar y la aplicación reparte los puntos de forma justa: tiene prioridad quien menos horas lleva.

## Qué se puede hacer

**Usuarios**
- Marcar su horario semanal (las horas en las que pueden cargar).
- Ver sus turnos de la semana y cancelar los que aún no han empezado.
- Ausentarse un día, una semana o hasta nuevo aviso con un botón.
- Confirmar después de cada turno si han cargado, o avisar de que su sitio estaba ocupado.
- Recibir avisos (turnos nuevos, penalizaciones, incidencias resueltas) y ver su histórico de horas.

**Administradores**
- Gestionar los puntos de recarga (añadir, editar, marcar como averiados).
- Gestionar los usuarios (editar sus datos, dar de baja, hacer admin).
- Ver y ajustar el reparto de cada semana, y poner o quitar turnos a mano.
- Resolver las incidencias y ver el histórico de todos.

## Tecnologías

- `backend/` → API REST con **Node.js, Express y MongoDB (Mongoose)**. Validación con **Zod**, contraseñas con **argon2** y sesiones con **JWT**.
- `frontend/` → **HTML, CSS y JavaScript** sin frameworks, con módulos (`import`/`export`).

## Cómo arrancarlo

Necesitas **Node.js** y **MongoDB** funcionando en tu ordenador.

1. Dentro de `backend`, copia `.env.example` a un archivo nuevo llamado `.env` y rellena `SECRET` con una clave larga. Para generar una:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Instala y arranca:
   ```bash
   cd backend
   npm install      # solo la primera vez
   npm run seed     # opcional: usuarios de prueba (contraseña de todos: 1234)
   npm run seed -- --reset   # BORRA toda la base de datos y vuelve a crear los usuarios de prueba
   npm run dev      # o npm start
   ```
3. Abre **http://localhost:3000**. El backend sirve también el frontend.

- La base de datos se llama `punto-recarga`. Se ve con MongoDB Compass.
- Al arrancar por primera vez se crean **4 puntos de recarga**.
- **El primero que se registra es el administrador** (si usas el seed, el admin es `admin@recarga.com`).
- Las sesiones usan **JWT** y caducan a los 7 días (`JWT_EXPIRES_IN` en el `.env`).

## Estructura del backend

```
src/
  server.js        conecta a MongoDB y arranca el servidor
  app.js           middlewares, rutas y el frontend
  config/db.js     conexión a MongoDB
  routes/          qué URL va a qué controlador (y con qué validación y permisos)
  ctrls/           reciben la petición y devuelven la respuesta JSON
  services/        la lógica (reglas del negocio). assignment.service.js = el reparto de turnos
  repos/           las consultas a MongoDB (la única capa que habla con la base de datos)
  models/          los esquemas de Mongoose (users, chargers, availabilities, shifts, absences,
                   notifications, incidents, penalties, cancellations, settings)
  schemas/         validación de los datos que llegan (Zod)
  middleware/      autenticación (JWT), permisos (admin / usuario), validación y errores
  seed.js          datos de prueba
```

## Respuestas de la API

Todas siguen el mismo formato:

```js
{ ok: true, message: "Punto de recarga creado correctamente", data: { ... } }   // bien
{ ok: true, total: 4, data: [ ... ] }                                            // listas
{ ok: false, status: 404, message: "Punto de recarga no encontrado" }            // error
```

En el frontend, `api()` de `frontend/js/api.js` ya devuelve directamente `data`, y si hay error lanza `message`:

```js
import { api } from './api.js';

const puntos = await api('/chargers');                              // GET
await api('/availability/me', 'PUT', { slots: [{ day: 0, hour: 9 }] }); // PUT con datos
```

Días: `0 = lunes ... 6 = domingo`. Horas: `0-23` (cada turno es una franja de 1 hora). Fechas: `'AAAA-MM-DD'`.

## Rutas

🔒 = necesita sesión · 👤 = solo usuarios (el admin no carga, solo administra) · 👑 = solo admin

### Sesión (`/api/auth`)
| Método | Ruta | Envía | `data` que devuelve |
|---|---|---|---|
| POST | `/register` | `{ name, email, password }` | `{ token, user: { _id, name, email, role } }` |
| POST | `/login` | `{ email, password }` | igual que register |
| POST | `/logout` 🔒 | | |
| GET | `/me` 🔒 | | `{ id, name, email, role }` |
| PATCH | `/password` 🔒 | `{ currentPassword, newPassword }` | igual que login (**guarda el token nuevo**: el viejo deja de valer) |

### Mi horario (`/api/availability`)
| Método | Ruta | Envía | `data` |
|---|---|---|---|
| GET | `/me` 👤 | | `[{ day, hour }]` |
| PUT | `/me` 👤 | `{ slots: [{ day, hour }] }` (sustituye todo) | las franjas guardadas |

### Turnos (`/api/shifts`)
| Método | Ruta | Envía | `data` |
|---|---|---|---|
| GET | `/me?week=AAAA-MM-DD` 👤 | | `{ week, shifts, blocks }`. Cada bloque: `{ date, dayName, charger: { name }, plugIn: "09:00", plugOut: "12:00" }` → la pantalla de avisos |
| GET | `/me/pending` 👤 | | bloques de mis turnos **ya terminados** que aún no he confirmado |
| PATCH | `/me/confirm` 👤 | `{ ids, status: "charged" \| "not_charged" }` | confirma un bloque ("no he cargado" = penalización de 1 h) |
| DELETE | `/me/:id` 👤 | | cancela un turno mío que **aún no ha empezado** |
| GET | `?week=` 👑 | | `{ week, shifts }` con `user` y `charger` |
| POST | `/generate` 👑 | `{ week }` | `{ week, created, algorithm }` |
| POST | `/` 👑 | `{ userId, chargerId, date, hour }` | turno manual |
| DELETE | `/:id` 👑 | | quita un turno que aún no ha empezado (se avisa al usuario) |
| GET | `/settings` 👑 | | `{ algorithm, maxHoursPerWeek, maxConsecutiveHours }` |
| PATCH | `/settings` 👑 | cualquiera de esos campos | ajustes nuevos |

Sin `week` se usa la semana actual. Vale cualquier día: se usa el lunes de su semana.

### Puntos de recarga (`/api/chargers`)
| Método | Ruta | Envía |
|---|---|---|
| GET | `/` 🔒 | |
| POST | `/` 👑 | `{ name, type?, powerKw? }` |
| PATCH | `/:id` 👑 | `{ name?, type?, powerKw? }` |
| PATCH | `/:id/active` 👑 | `{ isActive: false }` = averiado (se quitan sus turnos desde hoy) |
| PATCH | `/:id/softdelete` 👑 | |

### Usuarios (`/api/users`, todo 👑)
| Método | Ruta | Envía |
|---|---|---|
| GET | `/` | devuelve también `totalHours` (cargadas), `penaltyHours` y `absence` (su ausencia de hoy o `null`) |
| PATCH | `/:id` | `{ name?, email?, password? }`: corregir datos o poner una contraseña nueva |
| PATCH | `/:id/active` | `{ isActive: false }` = dar de baja |
| PATCH | `/:id/role` | `{ role: "admin" }` o `"user"` (un admin no recibe turnos) |
| PATCH | `/:id/softdelete` | |

### Histórico (`/api/history`)
| Método | Ruta | `data` |
|---|---|---|
| GET | `/me` 🔒 | `{ total, byWeek: [{ week, hours }], penaltyHours, penalties }`. Solo cuentan las horas **confirmadas como cargadas** |
| GET | `/users` 👑 | `[{ _id, name, email, hours, penaltyHours }]` (sin los admins), de más horas a menos |
| GET | `/stats?period=day\|week\|month\|year` 🔒 | `[{ period, hours }]` para las gráficas. El admin ve las de todos o añade `&userId=` |

### Ausencias (`/api/absences`, todo 👤)
| Método | Ruta | Envía | Qué hace |
|---|---|---|---|
| GET | `/me` | | mis ausencias que aún no han terminado: `[{ _id, from, to }]` |
| POST | `/me` | `{ from, to }` (`to: null` = indefinida) | esos días no recibo turnos; los que tenía pasan a otros |
| DELETE | `/me/:id` | | quito la ausencia y vuelvo al reparto |

### Avisos (`/api/notifications`, 🔒)
| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/me` | mis avisos sin leer: `[{ _id, message, createdAt }]` |
| PATCH | `/me/:id/read` | marcar uno como leído |
| PATCH | `/me/read-all` | marcarlos todos |

### Incidencias (`/api/incidents`)
| Método | Ruta | Envía | Qué hace |
|---|---|---|---|
| POST | `/` 👤 | `{ ids, description? }` | "mi punto estaba ocupado": el turno queda `blocked` y se apunta contra quien tenía ese punto la hora anterior |
| GET | `/me` 👤 | | las que he puesto yo |
| GET | `/` 👑 | | todas, primero las abiertas (con `reporterId`, `reportedUserId` y `chargerId` rellenos) |
| PATCH | `/:id` 👑 | `{ status: "accepted" \| "rejected" }` | aceptada → penalización de 5 h para quien ocupó el sitio |

## Cómo se reparten los turnos

El reparto (`services/assignment.service.js`) recorre cada día y cada hora de la semana, de ahora en adelante, y en cada hora reparte los puntos de recarga en servicio:

1. Mira qué usuarios activos (no admins) han marcado esa hora en su horario, quitando a los que ya tienen turno a esa hora, a los que **cancelaron esa hora concreta** y a los que tienen una **ausencia** ese día.
2. Quien ya estaba cargando la hora anterior sigue en el mismo punto, hasta 3 horas seguidas (`maxConsecutiveHours`). Así nadie enchufa y desenchufa cada hora.
3. Los puntos que quedan libres son para quien **menos horas lleva hasta ahora** (sus turnos de semanas anteriores **más sus horas de penalización**). Si Ana lleva 2 horas y Bea 8, el turno es para Ana. Si esa persona ya estaba en un punto la hora anterior, se queda en el mismo.

### Qué pasa solo, sin que haga nada el admin

- **Cada viernes** (y cada hora a partir de entonces, si aún no se ha hecho) se genera sola la semana siguiente.
- **Se rellenan los huecos sin mover a nadie** cuando alguien cancela un turno, cambia su horario, se avería, arregla o añade un punto de recarga, o se da de baja o de alta a un usuario. Las horas libres se reparten entre quien pueda.
- **Las cancelaciones se recuerdan** (colección `cancellations`): a quien cancela una hora no se le vuelve a dar, ni al rellenar huecos ni al regenerar la semana.
- Si un usuario **desmarca horas** de su horario, pierde los turnos automáticos que ya no encajan y se buscan sustitutos.
- Si un usuario pone una **ausencia** (un día, una semana o indefinida), pierde sus turnos de esos días y se buscan sustitutos.
- A quien recibe un turno al rellenar un hueco **le llega un aviso** (se ve en Inicio).
- **Cada hora** se revisan los turnos sin confirmar: si acabó el día siguiente al turno y no se ha confirmado, pasa a `unconfirmed` y hay **penalización de 3 h** (una por día).

### Después de cargar: confirmar, incidencias y penalizaciones

Cuando termina un turno, el usuario dice qué pasó (tiene hasta que acaba el día siguiente):

| Respuesta | Estado del turno | Penalización |
|---|---|---|
| He cargado | `charged` (cuenta en el histórico) | no |
| No he cargado | `not_charged` | 1 h |
| Mi sitio estaba ocupado | `blocked` + incidencia | no (y esas horas no le cuentan para el reparto). Si el admin la acepta, 5 h para quien ocupó el sitio |
| No contesta a tiempo | `unconfirmed` | 3 h |

Las penalizaciones son **horas de castigo que se suman al contador del reparto**: el penalizado tiene menos prioridad las semanas siguientes. Cancelar un turno **antes** de que empiece no penaliza. Los valores están en `PENALTY_HOURS` (`models/constants.js`).

El botón "Generar" del admin sigue existiendo para rehacer una semana entera: borra los turnos automáticos que aún no han llegado y los reparte otra vez. Los turnos que el admin pone a mano y los que ya han pasado no se tocan. En los ajustes se puede cambiar el algoritmo (`hours`, `week` o `random`) y poner un máximo de horas por semana (ampliación 2 del enunciado).
