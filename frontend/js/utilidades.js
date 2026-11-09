export function mostrarMensaje(texto, esError) {
  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = texto;
  mensaje.className = esError ? 'error' : 'exito';
}

export function formatearFecha(fecha) {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}`;
}

export function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function hoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function tarjetaTurno(bloque, extra = '') {
  return `
    <div class="turno">
      <div>
        <h3><span class="dia">${bloque.dayName}</span> ${formatearFecha(bloque.date)} · ${bloque.charger.name}</h3>
        <p>Enchufa a las <strong>${bloque.plugIn}</strong> y desenchufa a las <strong>${bloque.plugOut}</strong></p>
      </div>
      ${extra}
    </div>`;
}

export function tituloSemana(lunes) {
  return `Semana del ${formatearFecha(lunes)} al ${formatearFecha(sumarDias(lunes, 6))}`;
}

// ¿Ha empezado ya el turno de ese día a esa hora?
export function yaHaEmpezado(fecha, hora) {
  return fecha < hoy() || (fecha === hoy() && hora <= new Date().getHours());
}

// Lunes de la semana de una fecha AAAA-MM-DD
export function lunesDe(fecha) {
  const diaSemana = (new Date(`${fecha}T12:00:00`).getDay() + 6) % 7; // 0 es lunes y 6 es domingo
  return sumarDias(fecha, -diaSemana);
}