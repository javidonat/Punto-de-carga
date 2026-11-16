import { api, protegerPagina } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje, formatearFecha, textoHora, hoy } from './utilidades.js';

const usuario = protegerPagina('admin');

// Texto y color de cada estado
const ESTADOS = {
  open: { texto: 'Abierta', clase: 'abierta' },
  accepted: { texto: 'Aceptada', clase: 'ok' },
  rejected: { texto: 'Rechazada', clase: 'mal' },
};

let usuarios = []; // los usuarios que se pueden elegir como quien ocupaba el sitio

if (usuario) {
  pintarMenu(usuario);
  cargarIncidencias();
}

async function cargarIncidencias() {
  try {
    const todos = await api('/users');
    usuarios = todos.filter((u) => u.role === 'user');
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
    let ocupaba = i.reportedUserId ? i.reportedUserId.name : 'No se sabe';
    // Solo las abiertas se pueden aceptar o rechazar y antes el admin puede cambiar quién ocupaba el sitio
    let botones = '';
    if (i.status === 'open') {
      ocupaba = selectorOcupaba(i);
      botones = `
        <div class="acciones">
          <button class="pequeno" data-id="${i._id}" data-estado="accepted">Aceptar</button>
          <button class="pequeno peligro" data-id="${i._id}" data-estado="rejected">Rechazar</button>
        </div>`;
    }

    html += `
      <tr>
        <td>${formatearFecha(i.date)} a las ${textoHora(i.hour)}</td>
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

// Desplegable con los usuarios menos el que avisa y sale marcado el que ha puesto el servidor
function selectorOcupaba(i) {
  const actual = i.reportedUserId ? i.reportedUserId._id : '';
  let opciones = '<option value="">No se sabe</option>';
  for (const u of usuarios) {
    if (u._id === i.reporterId._id) {
      continue;
    }
    const marcado = u._id === actual ? 'selected' : '';
    opciones += `<option value="${u._id}" ${marcado}>${u.name}</option>`;
  }
  return `<select id="ocupaba-${i._id}">${opciones}</select>`;
}

// Mensaje al aceptar o rechazar y solo se penaliza si se sabe quién ocupaba el sitio
function textoResultado(incidencia) {
  if (incidencia.status === 'rejected') {
    return 'Incidencia rechazada.';
  }
  if (incidencia.reportedUserId) {
    return 'Incidencia aceptada: se ha penalizado con 5 horas a quien ocupaba el sitio.';
  }
  return 'Incidencia aceptada. No se sabe quién ocupaba el sitio, así que no se penaliza a nadie.';
}

// Incidencia a mano rellena los desplegables y enseña el formulario
async function abrirFormulario() {
  try {
    const puntos = await api('/chargers');
    let opcionesUsuarios = '';
    for (const u of usuarios) {
      opcionesUsuarios += `<option value="${u._id}">${u.name}</option>`;
    }
    document.getElementById('avisa').innerHTML = opcionesUsuarios;
    document.getElementById('ocupaba-nueva').innerHTML = '<option value="">No se sabe</option>' + opcionesUsuarios;

    let opcionesPuntos = '';
    for (const p of puntos) {
      opcionesPuntos += `<option value="${p._id}">${p.name}</option>`;
    }
    document.getElementById('punto').innerHTML = opcionesPuntos;

    let opcionesHoras = '';
    for (let h = 0; h < 24; h++) {
      opcionesHoras += `<option value="${h}">${textoHora(h)}</option>`;
    }
    document.getElementById('hora').innerHTML = opcionesHoras;
    document.getElementById('hora').value = new Date().getHours();
    document.getElementById('fecha').value = hoy();

    document.getElementById('form-incidencia').hidden = false;
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

function cerrarFormulario() {
  document.getElementById('form-incidencia').reset();
  document.getElementById('form-incidencia').hidden = true;
}

document.getElementById('nueva').addEventListener('click', abrirFormulario);
document.getElementById('cancelar-incidencia').addEventListener('click', cerrarFormulario);

document.getElementById('form-incidencia').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const datos = {
    reporterId: document.getElementById('avisa').value,
    chargerId: document.getElementById('punto').value,
    date: document.getElementById('fecha').value,
    hour: Number(document.getElementById('hora').value),
    reportedUserId: document.getElementById('ocupaba-nueva').value || null,
    description: document.getElementById('descripcion').value,
  };
  try {
    await api('/incidents/manual', 'POST', datos);
    mostrarMensaje('Incidencia creada. Ahora puedes aceptarla o rechazarla en la tabla.', false);
    cerrarFormulario();
    cargarIncidencias();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});

// Aceptar o rechazar

document.getElementById('incidencias').addEventListener('click', async (evento) => {
  const { id, estado } = evento.target.dataset;
  if (!id) {
    return;
  }
  try {
    // El elegido en el desplegable y si está vacío es que no se sabe y se manda null
    const elegido = document.getElementById(`ocupaba-${id}`).value;
    const datos = { status: estado, reportedUserId: elegido || null };
    const incidencia = await api(`/incidents/${id}`, 'PATCH', datos);
    mostrarMensaje(textoResultado(incidencia), false);
    cargarIncidencias();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});
