import { api, protegerPagina } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje, formatearFecha, hoy, sumarDias, lunesDe } from './utilidades.js';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HORA_INICIO = 7;
const HORA_FIN = 22; //porque la última de es de 21 a 22

const usuario = protegerPagina('user');

if (usuario) {
  pintarMenu(usuario);
  pintarTabla();
  cargarHorario();
  cargarAusencias();
  document.getElementById('desde').min = hoy();
  document.getElementById('hasta').min = hoy();
}

function pintarTabla() {
  let html = '<tr><th></th>';
  for (const dia of DIAS) {
    html += `<th>${dia}</th>`;
  }
  html += '</tr>';

  for (let hora = HORA_INICIO; hora < HORA_FIN; hora++) {
    html += `<tr><th>${hora}:00</th>`;
    for (let dia = 0; dia < 7; dia++) {
      html += `<td data-dia="${dia}" data-hora="${hora}"></td>`;
    }
    html += '</tr>';
  }

  document.getElementById('horario').innerHTML = html;
}

document.getElementById('horario').addEventListener('click', (evento) => {
  const celda = evento.target;
  if (celda.tagName === 'TD') {
    celda.classList.toggle('marcada');
  }
});

// Pide al servidor las horas guardadas y marca esas casillas
async function cargarHorario() {
  try {
    const slots = await api('/availability/me');
    for (const slot of slots) {
      const celda = document.querySelector(`td[data-dia="${slot.day}"][data-hora="${slot.hour}"]`);
      // Si la hora no está en la tabla no hay casilla que marcar
      if (celda) {
        celda.classList.add('marcada');
      }
    }
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// Ausencias
async function cargarAusencias() {
  try {
    const ausencias = await api('/absences/me');
    pintarAusencias(ausencias);
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// El 16/11, Del 16/11 al 22/11 o Desde el 16/11, sin fecha de vuelta
function textoAusencia(ausencia) {
  if (ausencia.to === null) {
    return `Desde el ${formatearFecha(ausencia.from)}, sin fecha de vuelta`;
  }
  if (ausencia.from === ausencia.to) {
    return `El ${formatearFecha(ausencia.from)}`;
  }
  return `Del ${formatearFecha(ausencia.from)} al ${formatearFecha(ausencia.to)}`;
}

function pintarAusencias(ausencias) {
  const contenedor = document.getElementById('ausencias');
  if (ausencias.length === 0) {
    contenedor.innerHTML = '<p class="subtitulo">No tienes ninguna ausencia puesta.</p>';
    return;
  }

  let html = '';
  for (const ausencia of ausencias) {
    html += `
      <div class="turno">
        <p>${textoAusencia(ausencia)}</p>
        <button class="cancelar" data-id="${ausencia._id}">Quitar</button>
      </div>`;
  }
  contenedor.innerHTML = html;
}

// La usan los botones rápidos y el formulario, hasta = null -> indefinida
async function crearAusencia(desde, hasta) {
  try {
    await api('/absences/me', 'POST', { from: desde, to: hasta });
    mostrarMensaje('Ausencia guardada: tus turnos de esos días pasan a otros', false);
    cargarAusencias();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// Botones rápidos cada uno calcula sus fechas
document.querySelector('.botones-ausencia').addEventListener('click', (evento) => {
  const tipo = evento.target.dataset.ausencia;
  if (!tipo) {
    return; // no se ha pulsado un botón
  }
  if (!confirm('¿Seguro? Perderás tus turnos de esos días.')) {
    return;
  }

  const lunes = lunesDe(hoy());
  if (tipo === 'hoy') {
    crearAusencia(hoy(), hoy());
  }
  if (tipo === 'esta') {
    crearAusencia(hoy(), sumarDias(lunes, 6)); // de hoy al domingo
  }
  if (tipo === 'siguiente') {
    crearAusencia(sumarDias(lunes, 7), sumarDias(lunes, 13)); // de lunes a domingo de la que viene
  }
  if (tipo === 'indefinida') {
    crearAusencia(hoy(), null);
  }
});

// Unas fechas concretas
document.getElementById('form-ausencia').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const desde = document.getElementById('desde').value;
  const hasta = document.getElementById('hasta').value;
  crearAusencia(desde, hasta);
  document.getElementById('form-ausencia').reset();
});

// Quitar una ausencia vuelves a entrar en el reparto
document.getElementById('ausencias').addEventListener('click', async (evento) => {
  const id = evento.target.dataset.id;
  if (!id) {
    return;
  }
  try {
    await api(`/absences/me/${id}`, 'DELETE');
    mostrarMensaje('Ausencia quitada: vuelves a entrar en el reparto', false);
    cargarAusencias();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});

// Coge las casillas marcadas y las manda al servidor
document.getElementById('guardar').addEventListener('click', async () => {
  const slots = [];
  for (const celda of document.querySelectorAll('td.marcada')) {
    slots.push({ day: Number(celda.dataset.dia), hour: Number(celda.dataset.hora) });
  }

  try {
    await api('/availability/me', 'PUT', { slots });
    mostrarMensaje('Horario guardado', false);
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});