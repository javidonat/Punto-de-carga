import { api, protegerPagina } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje, formatearFecha, sumarDias, hoy, tarjetaTurno } from './utilidades.js';

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
    await cargarAusencia();
    await cargarPendientes();
    await cargarAvisos();

    // 1 Ha rellenado su horario
    const slots = await api('/availability/me');
    if (slots.length === 0) {
      document.getElementById('aviso').innerHTML =
        '<p class="aviso">Aún no has marcado tus horas. <a href="horario.html">Rellena tu horario</a> para que te asignen turnos.</p>';
    }

    // 2 Próximo turno
    const bloque = await buscarProximoTurno();
    if (bloque) {
      document.getElementById('proximo').innerHTML = tarjetaTurno(bloque);
    } else {
      document.getElementById('proximo').innerHTML = '<p class="subtitulo">No tienes turnos próximos.</p>';
    }

    // 3 Horas en total
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
    await cargarAvisos();
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

// Avisos

async function cargarAvisos() {
  const avisos = await api('/notifications/me');
  const contenedor = document.getElementById('avisos');

  if (avisos.length === 0) {
    contenedor.innerHTML = '<p class="subtitulo">No tienes avisos nuevos.</p>';
    return;
  }

  let html = '<button id="leer-todos" class="pequeno secundario">Marcar todos como leídos</button>';
  for (const aviso of avisos) {
    html += `
      <div class="turno">
        <p>${aviso.message} <small>(${formatearFecha(aviso.createdAt.slice(0, 10))})</small></p>
        <button class="pequeno" data-id="${aviso._id}">Leído</button>
      </div>`;
  }
  contenedor.innerHTML = html;
}

document.getElementById('avisos').addEventListener('click', async (evento) => {
  const boton = evento.target;
  try {
    if (boton.id === 'leer-todos') {
      await api('/notifications/me/read-all', 'PATCH');
    } else if (boton.dataset.id) {
      await api(`/notifications/me/${boton.dataset.id}/read`, 'PATCH');
    } else {
      return;
    }
    cargarAvisos();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});

// Turnos por confirmar

async function cargarPendientes() {
  const bloques = await api('/shifts/me/pending');
  const contenedor = document.getElementById('pendientes');

  if (bloques.length === 0) {
    contenedor.innerHTML = '<p class="subtitulo">No tienes turnos por confirmar.</p>';
    return;
  }

  let html = '';
  for (const bloque of bloques) {
    const ids = bloque.ids.join(',');
    html += tarjetaTurno(bloque, `
      <div class="acciones">
        <button class="pequeno" data-ids="${ids}" data-accion="charged">He cargado</button>
        <button class="pequeno secundario" data-ids="${ids}" data-accion="not_charged">No he cargado</button>
        <button class="pequeno peligro" data-ids="${ids}" data-accion="ocupado">Mi sitio estaba ocupado</button>
      </div>`);
  }
  contenedor.innerHTML = html;
}

document.getElementById('pendientes').addEventListener('click', async (evento) => {
  const { ids, accion } = evento.target.dataset;
  if (!accion) {
    return;
  }
  const lista = ids.split(',');

  try {
    if (accion === 'ocupado') {
      const descripcion = prompt('Cuéntanos qué pasó (opcional):');
      if (descripcion === null) {
        return; // ha pulsado Cancelar
      }
      await api('/incidents', 'POST', { ids: lista, description: descripcion });
      mostrarMensaje('Incidencia enviada. El administrador la revisará.', false);
    } else {
      await api('/shifts/me/confirm', 'PATCH', { ids: lista, status: accion });
      mostrarMensaje('Turno confirmado.', false);
    }
    cargarPendientes();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});

// Ausencia de hoy

async function cargarAusencia() {
  const ausencias = await api('/absences/me');
  const actual = ausencias.find((ausencia) => ausencia.from <= hoy());
  if (!actual) {
    return;
  }

  const hasta = actual.to ? `hasta el ${formatearFecha(actual.to)}` : 'hasta nuevo aviso';
  document.getElementById('ausente').innerHTML = `
    <div class="aviso turno">
      <p>Estás ausente ${hasta}, así que no recibes turnos.</p>
      <button class="pequeno" data-id="${actual._id}">Volver ya</button>
    </div>`;
}

document.getElementById('ausente').addEventListener('click', async (evento) => {
  const id = evento.target.dataset.id;
  if (!id) {
    return;
  }
  try {
    await api(`/absences/me/${id}`, 'DELETE');
    document.getElementById('ausente').innerHTML = '';
    mostrarMensaje('Vuelves a estar en el reparto.', false);
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});
