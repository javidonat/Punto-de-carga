# Plan de trabajo: Punto de recarga (unos 15 días)

El backend ya está hecho. Cada paso es **una pantalla del frontend**: HTML + un archivo JS que llama a la API con `api()` y pinta el resultado. Más o menos, un paso por sesión de clase, y en casa terminas lo que falte.

Para cada pantalla nueva, copia la estructura de `inicio.html` (cabecera + `<main class="contenido">`) y crea su archivo en `js/`. Ese archivo empieza con un `import { ... } from './api.js';` de lo que use, y el HTML lo carga con `type="module"`.

## Paso 0 · Arrancarlo y entender lo que hay (en casa, 1 h)
- Arrancar el backend (ver README) y registrarte: serás el admin.
- Leer `js/api.js`, `js/login.js` y `js/registro.js`. Son la base de todo lo demás: si entiendes `fetch`, `async/await`, `try/catch` y `localStorage`, entiendes el proyecto.

## Paso 1 · Menú de navegación (corto)
- Añadir a la cabecera los enlaces a todas las pantallas.
- Los enlaces de admin solo se ven si `usuario.role === 'admin'`.

## Paso 2 · Mi horario semanal ⭐ (obligatorio)
- Una tabla con 7 columnas (lunes a domingo) y una fila por hora (por ejemplo, de 7:00 a 22:00).
- Al hacer clic en una celda se marca o desmarca (`classList.toggle`).
- Al cargar: `GET /api/availability/me` y marcar las celdas que vienen.
- Botón "Guardar": recoger las celdas marcadas y hacer `PUT /api/availability/me` con `{ slots: [...] }`.

## Paso 3 · Mis turnos / avisos ⭐ (obligatorio)
- `GET /api/shifts/me` y mostrar cada bloque (`blocks`) como una tarjeta: *"Lunes 26/10 · Cargador 1 · Enchufa a las 09:00 y desenchufa a las 12:00"*.
- Botones "semana anterior / siguiente" que cambian `?week=`.
- Extra fácil: resaltar el próximo turno.
- Botón "Cancelar" en los turnos que aún no han llegado (`DELETE /api/shifts/me/:id`).

## Paso 3b · Inicio con resumen
- Próximo turno (`GET /api/shifts/me`, el primer bloque que aún no ha pasado).
- Horas cargadas en total (`GET /api/history/me`).
- Aviso si el horario está vacío (`GET /api/availability/me`): "Marca tus horas en Mi horario".
- Admin: cuántos puntos de recarga hay en servicio y cuántos averiados (`GET /api/chargers`).

## Paso 4 · Admin: puntos de recarga ⭐
- Al principio ya hay 4 creados.
- Lista de cargadores (nombre, tipo, potencia) con botón "Averiado / En servicio" (`PATCH /api/chargers/:id/active`) y "Eliminar" (`PATCH /api/chargers/:id/softdelete`).
- Formulario para añadir uno (`POST /api/chargers`).

## Paso 5 · Admin: usuarios ⭐
- Tabla de usuarios (`GET /api/users`) con botones "Dar de baja / alta", "Hacer admin" y "Eliminar" (`PATCH /api/users/:id/active`, `/role` y `/softdelete`).

## Paso 6 · Admin: turnos de la semana ⭐
- Elegir semana y botón "Generar turnos" (`POST /api/shifts/generate`).
- Tabla con los turnos de la semana (`GET /api/shifts?week=`) y botón para borrar cada uno (`DELETE /api/shifts/:id`).
- Formulario para añadir un turno a mano (`POST /api/shifts` con usuario, punto de recarga, fecha y hora).

## Paso 7 · Histórico ⭐ (obligatorio)
- Usuario: total de horas y una tabla por semanas (`GET /api/history/me`).
- Admin: tabla con las horas totales de cada usuario (`GET /api/history/users`).

## Paso 8 · Ampliaciones (si sobra tiempo)
- **Mi cuenta:** formulario para cambiar la contraseña (`PATCH /api/auth/password`; guarda el token nuevo que devuelve). Viene bien si se va a usar de verdad.
- **Gráficas:** con Chart.js (una línea `<script>` desde CDN) y `GET /api/history/stats?period=day|week|month|year`.
- **Cambiar algoritmo:** un `<select>` en el panel de admin con `GET/PATCH /api/shifts/settings`.

## Cambios que pidió el profesor (9 de noviembre)
El backend ya está hecho (guía, sección 19). Pantallas, en este orden:
- **A · El admin solo administra** (guía 20): protegerPagina con rol, menú por rol, Inicio e Histórico separados, no quitar turnos ya empezados.
- **B · Editar usuario** (admin-usuarios): nombre, email y contraseña nueva.
- **C · Ausencias** (Mi horario): no vengo un día, esta semana, la que viene, unas fechas o hasta nuevo aviso.
- **D · Inicio del usuario**: avisos y turnos por confirmar (He cargado / No he cargado / Mi sitio estaba ocupado).
- **E · Incidencias** (página nueva del admin): aceptar o rechazar.

## Último día · Repaso
**Cómo será la presentación (lo dijo el profesor):** irá mirando el proyecto y preguntará de repente "¿dónde está el código de X?", y además pedirá **añadir o cambiar una funcionalidad en el momento**. Para prepararlo:
- Saber de memoria qué archivo hace cada cosa (pantalla → su HTML, su JS en `js/`, y qué ruta de la API llama).
- **Comprobar el PDF del proyecto:** repasar punto por punto que está todo lo que pide el enunciado, mejoras incluidas (hace falta pasarle el PDF a Claude).
- **Revisión final del código (la hace Claude):** repasar todo el proyecto, frontend y backend, y comprobar que está bien estructurado, organizado de la mejor forma, sin código repetido y con nombres y comentarios coherentes.
- Practicar cambios en vivo: por ejemplo, cambiar las horas de la tabla del horario, añadir un enlace al menú, añadir un campo a un formulario, mostrar un dato más en una tarjeta, o una pantalla nueva sencilla.
- Probarlo todo con los usuarios de prueba (`npm run seed`).
- Preparar qué explicar: el flujo login → token → `api()` y una pantalla de principio a fin.

### Si vas justo de tiempo
Los pasos con ⭐ cubren los requisitos. Lo mínimo para que funcione es 2, 3, 6 y 7. El 4 y el 5 son tablas sencillas que se parecen mucho entre sí.
