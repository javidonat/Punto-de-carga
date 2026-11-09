import { api, protegerPagina } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje, sumarDias, hoy, tarjetaTurno } from './utilidades.js';

const usuario = protegerPagina();

if (usuario) {
  pintarMenu(usuario);
  document.getElementById('nombre').textContent = usuario.name;
  if (usuario.role === 'admin') {
    document.getElementById('rol').textContent = 'Eres administrador';
    cargarResumenAdmin();
  } else {
    document.getElementById('rol').textContent = 'Eres usuario';
    document.getElementById('seccion-usuario').hidden = false;
    cargarResumenUsuario();
  }
}

// Pide al servidor cada dato y lo pinta en su caja
async function cargarResumenUsuario() {
  try {
    // 1 - ¿Ha rellenado su horario?
    const slots = await api('/availability/me');
    if (slots.length === 0) {
      document.getElementById('aviso').innerHTML =
        '<p class="aviso">Aún no has marcado tus horas. <a href="horario.html">Rellena tu horario</a> para que te asignen turnos.</p>';
    }

    // 2 - Próximo turno
    const bloque = await buscarProximoTurno();
    if (bloque) {
      document.getElementById('proximo').innerHTML = tarjetaTurno(bloque);
    } else {
      document.getElementById('proximo').innerHTML = '<p class="subtitulo">No tienes turnos próximos.</p>';
    }

    // 3 - Horas en total
    const historial = await api('/history/me');
    document.getElementById('horas').textContent = historial.total;

  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// Busca el primer bloque que aún no ha terminado en esta semana o en la siguiente
async function buscarProximoTurno() {
  const ahora = new Date().getHours();
  const estaSemana = await api('/shifts/me');
  const siguiente = await api(`/shifts/me?week=${sumarDias(estaSemana.week, 7)}`);
  const bloques = estaSemana.blocks.concat(siguiente.blocks);

  for (const bloque of bloques) {
    const yaHaPasado = bloque.date < hoy() || (bloque.date === hoy() && bloque.endHour <= ahora);
    if (!yaHaPasado) {
      return bloque;
    }
  }
  return null;
}

// Admin cuántos puntos de recarga hay en servicio y cuántos averiados
async function cargarResumenAdmin() {
  try {
    const puntos = await api('/chargers');
    let enServicio = 0;
    for (const punto of puntos) {
      if (punto.isActive) {
        enServicio++;
      }
    }
    const averiados = puntos.length - enServicio;

    document.getElementById('resumen-admin').innerHTML = `
      <h2>Puntos de recarga</h2>
      <p><strong>${enServicio}</strong> en servicio y <strong>${averiados}</strong> averiados.
      <a href="admin-puntos.html">Gestionar</a></p>`;
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}