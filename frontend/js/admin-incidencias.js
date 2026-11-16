import { api, protegerPagina } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje, formatearFecha } from './utilidades.js';

const usuario = protegerPagina('admin');

// Texto y color de cada estado
const ESTADOS = {
  open: { texto: 'Abierta', clase: 'abierta' },
  accepted: { texto: 'Aceptada', clase: 'ok' },
  rejected: { texto: 'Rechazada', clase: 'mal' },
};

if (usuario) {
  pintarMenu(usuario);
  cargarIncidencias();
}

async function cargarIncidencias() {
  try {
    const incidencias = await api('/incidents');
    pintarIncidencias(incidencias);
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

function pintarIncidencias(incidencias) {
  const tbody = document.getElementById('incidencias');

  if (incidencias.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No hay incidencias.</td></tr>';
    return;
  }

  let html = '';
  for (const i of incidencias) {
    const estado = ESTADOS[i.status];
    // reportedUserId es null si nadie tenía ese punto la hora anterior
    const ocupaba = i.reportedUserId ? i.reportedUserId.name : 'No se sabe';
    // Solo las abiertas se pueden aceptar o rechazar
    let botones = '';
    if (i.status === 'open') {
      botones = `
        <div class="acciones">
          <button class="pequeno" data-id="${i._id}" data-estado="accepted">Aceptar</button>
          <button class="pequeno peligro" data-id="${i._id}" data-estado="rejected">Rechazar</button>
        </div>`;
    }

    html += `
      <tr>
        <td>${formatearFecha(i.date)} a las ${String(i.hour).padStart(2, '0')}:00</td>
        <td>${i.chargerId.name}</td>
        <td>${i.reporterId.name}</td>
        <td>${ocupaba}</td>
        <td>${i.description || '-'}</td>
        <td><span class="estado ${estado.clase}">${estado.texto}</span></td>
        <td>${botones}</td>
      </tr>`;
  }
  tbody.innerHTML = html;
}

document.getElementById('incidencias').addEventListener('click', async (evento) => {
  const { id, estado } = evento.target.dataset;
  if (!id) {
    return;
  }
  try {
    await api(`/incidents/${id}`, 'PATCH', { status: estado });
    mostrarMensaje(estado === 'accepted' ? 'Incidencia aceptada: se ha penalizado a quien ocupaba el sitio.' : 'Incidencia rechazada.', false);
    cargarIncidencias();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});
