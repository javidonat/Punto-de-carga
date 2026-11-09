import { api, protegerPagina } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje, tituloSemana } from './utilidades.js';

const usuario = protegerPagina();

if (usuario) {
  pintarMenu(usuario);
  if (usuario.role === 'admin') {
    document.getElementById('seccion-admin').hidden = false;
    cargarHistoricoUsuarios();
  } else {
    document.getElementById('seccion-usuario').hidden = false;
    cargarMiHistorico();
  }
}

// Mis horas

async function cargarMiHistorico() {
  try {
    const datos = await api('/history/me');
    document.getElementById('total').textContent = `${datos.total} h`;
    document.getElementById('penalizacion').textContent = `${datos.penaltyHours} h`;
    pintarSemanas(datos.byWeek);
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// Una fila por semana de la más nueva a la más vieja
function pintarSemanas(semanas) {
  const tabla = document.getElementById('semanas');

  if (semanas.length === 0) {
    tabla.innerHTML = '<tr><td colspan="2">Aún no tienes horas de carga.</td></tr>';
    return;
  }

  let html = '';
  for (const semana of semanas) {
    html += `
      <tr>
        <td>${tituloSemana(semana.week)}</td>
        <td>${semana.hours} h</td>
      </tr>`;
  }
  tabla.innerHTML = html;
}

// Horas de cada usuario solo admin

async function cargarHistoricoUsuarios() {
  try {
    const usuarios = await api('/history/users');
    let html = '';
    for (const u of usuarios) {
      html += `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${u.hours} h</td>
          <td>${u.penaltyHours} h</td>
        </tr>`;
    }
    document.getElementById('usuarios').innerHTML = html;
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}