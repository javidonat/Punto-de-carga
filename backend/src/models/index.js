// Registra todos los modelos de una vez. Hace falta para que populate() encuentre
// los modelos referenciados (User, Charger...) aunque nadie los haya importado antes.
import User from "./user.model.js";
import Charger from "./charger.model.js";
import Availability from "./availability.model.js";
import Shift from "./shift.model.js";
import Setting from "./setting.model.js";
import Cancellation from "./cancellation.model.js";
import Absence from "./absence.model.js";
import Notification from "./notification.model.js";
import Incident from "./incident.model.js";
import Penalty from "./penalty.model.js";

export { User, Charger, Availability, Shift, Setting, Cancellation, Absence, Notification, Incident, Penalty };
