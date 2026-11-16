import { api, protegerPagina } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje, formatearFecha, sumarDias, hoy, tituloSemana, yaHaEmpezado, textoHora } from './utilidades.js';

const usuario = protegerPagina('admin');
let semana = ''; // lunes de la semana que se ve y vacío es la actual
let horaElegida = null; // la hora marcada en el formulario y null es ninguna

if (usuario) {
  pintarMenu(usuario);
  cargarTurnos();
  cargarFormulario();
  cargarAjustes();
}

// Tabla turnos

async function cargarTurnos() {
  let ruta = '/shifts';
  if (semana) {
    ruta += `?week=${semana}`; // query string se puede ver en f12 network
  }

  try {
    const datos = await api(ruta);
    semana = datos.week;
    document.getElementById('titulo-semana').textContent = tituloSemana(semana);
    pintarTurnos(datos.shifts);
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// Una fila por turno cada turno es una hora
function pintarTurnos(turnos) {
  const tabla = document.getElementById('turnos');

  if (turnos.length === 0) {
    tabla.innerHTML = '<tr><td colspan="6">No hay turnos esta semana.</td></tr>';
    return;
  }

  let html = '';
  for (const turno of turnos) {
    // Los turnos que ya han pasado no se quitan para no cambiar el histórico
    let boton = '';
    if (!yaHaEmpezado(turno.date, turno.hour)) {
      boton = `<button class="pequeno peligro" data-id="${turno._id}">Quitar</button>`;
    }

    html += `
      <tr>
        <td><span class="dia">${turno.dayName}</span> ${formatearFecha(turno.date)}</td>
        <td>${textoHora(turno.hour)} - ${textoHora(turno.hour + 1)}</td>
        <td>${turno.charger.name}</td>
        <td>${turno.user.name}</td>
        <td>${turno.manual ? 'A mano' : 'Automático'}</td>
        <td class="acciones">${boton}</td>
      </tr>`;
  }
  tabla.innerHTML = html;
}

document.getElementById('anterior').addEventListener('click', () => {
  semana = sumarDias(semana, -7);
  cargarTurnos();
});

document.getElementById('siguiente').addEventListener('click', () => {
  semana = sumarDias(semana, 7);
  cargarTurnos();
});

// Quitar un turno
document.getElementById('turnos').addEventListener('click', async (evento) => {
  const id = evento.target.dataset.id;
  if (!id) {
    return; // no se ha pulsado un botón
  }
  if (!confirm('¿Quitar este turno? Se buscará a otro usuario para esa hora.')) {
    return;
  }

  try {
    await api(`/shifts/${id}`, 'DELETE');
    mostrarMensaje('Turno quitado', false);
    cargarTurnos();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});

// Rehacer el reparto de la semana que se está viendo
document.getElementById('generar').addEventListener('click', async () => {
  if (!confirm('Se volverán a repartir los turnos automáticos que aún no han llegado. ¿Seguir?')) {
    return;
  }

  try {
    const datos = await api('/shifts/generate', 'POST', { week: semana });
    mostrarMensaje(`Reparto hecho: ${datos.created} turnos nuevos`, false);
    cargarTurnos();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});

// El formulario del turno a mano empieza oculto y este botón lo enseña o lo esconde
document.getElementById('mostrar-formulario').addEventListener('click', () => {
  const formulario = document.getElementById('formulario');
  formulario.hidden = !formulario.hidden;
});

// Rellena los desplegables con usuarios y puntos y pinta los botones de las horas
async function cargarFormulario() {
  try {
    const usuarios = await api('/users');
    const puntos = await api('/chargers');

    let opcionesUsuarios = '';
    for (const u of usuarios) {
      if (u.isActive && u.role === 'user') {
        opcionesUsuarios += `<option value="${u._id}">${u.name}</option>`;
      }
    }

    let opcionesPuntos = '';
    for (const punto of puntos) {
      if (punto.isActive) {
        opcionesPuntos += `<option value="${punto._id}">${punto.name}</option>`;
      }
    }

    // Un botón por hora
    let botonesHoras = '';
    for (let hora = 7; hora <= 22; hora++) {
      botonesHoras += `<button type="button" data-hora="${hora}">${textoHora(hora)}</button>`;
    }

    document.getElementById('usuario').innerHTML = opcionesUsuarios;
    document.getElementById('punto').innerHTML = opcionesPuntos;
    document.getElementById('horas').innerHTML = botonesHoras;
    document.getElementById('fecha').min = hoy(); // el calendario no deja elegir días pasados
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// Al pulsar una hora se queda marcada y se desmarca la que hubiera antes
document.getElementById('horas').addEventListener('click', (evento) => {
  const boton = evento.target;
  if (!boton.dataset.hora) {
    return; // no se ha pulsado un botón
  }

  const marcada = document.querySelector('.horas .marcada');
  if (marcada) {
    marcada.classList.remove('marcada');
  }
  boton.classList.add('marcada');
  horaElegida = Number(boton.dataset.hora);
});

document.getElementById('formulario').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  if (horaElegida === null) {
    mostrarMensaje('Elige una hora', true);
    return;
  }

  const fecha = document.getElementById('fecha').value;
  const datos = {
    userId: document.getElementById('usuario').value,
    chargerId: document.getElementById('punto').value,
    date: fecha,
    hour: horaElegida,
  };

  try {
    await api('/shifts', 'POST', datos);
    mostrarMensaje('Turno añadido', false);
    semana = fecha; // enseña la semana del turno nuevo y el backend coge el lunes de ese día
    cargarTurnos();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});

// Ajustes del reparto como se elige a quién dar cada hora y los límites

async function cargarAjustes() {
  try {
    const ajustes = await api('/shifts/settings');
    document.getElementById('algoritmo').value = ajustes.algorithm;
    document.getElementById('max-semana').value = ajustes.maxHoursPerWeek;
    document.getElementById('max-seguidas').value = ajustes.maxConsecutiveHours;
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

document.getElementById('form-ajustes').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  try {
    await api('/shifts/settings', 'PATCH', {
      algorithm: document.getElementById('algoritmo').value,
      maxHoursPerWeek: Number(document.getElementById('max-semana').value),
      maxConsecutiveHours: Number(document.getElementById('max-seguidas').value),
    });
    mostrarMensaje('Ajustes guardados. Se usarán en los próximos repartos (o pulsa "Rehacer el reparto").', false);
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});
