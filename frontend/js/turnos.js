import { api, protegerPagina } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje, sumarDias, hoy, tarjetaTurno, tituloSemana, yaHaEmpezado } from './utilidades.js';

const usuario = protegerPagina('user');
let semana = '';

if (usuario) {
  pintarMenu(usuario);
  cargarTurnos();
}

// Pide al servidor los turnos de la semana y los pinta
async function cargarTurnos() {
  let ruta = '/shifts/me';
  if (semana) {
    ruta += `?week=${semana}`;
  }

  try {
    const datos = await api(ruta);
    semana = datos.week;
    document.getElementById('titulo-semana').textContent = tituloSemana(semana);
    pintarTurnos(datos.blocks);
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// Una tarjeta por bloque de horas seguidas
function pintarTurnos(bloques) {
  const contenedor = document.getElementById('turnos');

  if (bloques.length === 0) {
    contenedor.innerHTML = '<p class="subtitulo">No tienes turnos esta semana.</p>';
    return;
  }

    let html = '';
    for (const bloque of bloques) {
      // Solo se pueden cancelar los turnos de hoy en adelante
      let boton = '';
      if (!yaHaEmpezado(bloque.date, bloque.startHour)) {
        boton = `<button class="cancelar" data-ids="${bloque.ids.join(',')}">Cancelar</button>`;
      }

      html += tarjetaTurno(bloque, boton);
    }
    contenedor.innerHTML = html;
}

document.getElementById('anterior').addEventListener('click', () => {
  semana = sumarDias(semana, -7);
  cargarTurnos();
});

document.getElementById('siguiente').addEventListener('click', () => {
  semana = sumarDias(semana, 7);
  cargarTurnos();
});

document.getElementById('turnos').addEventListener('click', async (evento) => {
  const boton = evento.target;
  if (!boton.classList.contains('cancelar')) {
    return;
  }
  if (!confirm('¿Seguro que quieres cancelar este turno?')) {
    return;
  }

  const ids = boton.dataset.ids.split(',');
  try {
    for (const id of ids) {
      await api(`/shifts/me/${id}`, 'DELETE');
    }
    mostrarMensaje('Turno cancelado', false);
    cargarTurnos();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});