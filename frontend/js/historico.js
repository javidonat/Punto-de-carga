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
  cargarGrafica();
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
    rellenarUsuariosGrafica(usuarios);
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

// Gráfica (ampliación) con Chart.js. El usuario ve sus horas y el admin las de todos
let grafica = null; // la gráfica dibujada, para borrarla antes de dibujar otra

async function cargarGrafica() {
  const periodo = document.getElementById('periodo').value;
  let ruta = `/history/stats?period=${periodo}`;
  const elegido = document.getElementById('usuario-grafica').value; // solo el admin: '' = todos
  if (elegido) {
    ruta += `&userId=${elegido}`;
  }
  try {
    const datos = await api(ruta);
    if (grafica) {
      grafica.destroy();
    }
    grafica = new Chart(document.getElementById('grafica'), {
      type: 'bar',
      data: {
        labels: datos.map((d) => d.period),
        datasets: [{ label: 'Horas cargadas', data: datos.map((d) => d.hours), backgroundColor: '#16a34a', borderRadius: 6 }],
      },
      options: {
        aspectRatio: 3, // más ancha que alta
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// Admin: desplegable para ver la gráfica de todos o de un usuario
function rellenarUsuariosGrafica(usuarios) {
  const select = document.getElementById('usuario-grafica');
  for (const u of usuarios) {
    select.innerHTML += `<option value="${u._id}">${u.name}</option>`;
  }
  select.hidden = false;
}

document.getElementById('periodo').addEventListener('change', cargarGrafica);
document.getElementById('usuario-grafica').addEventListener('change', cargarGrafica);
