import { api, protegerPagina } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje, tituloSemana, formatearFecha } from './utilidades.js';

const usuario = protegerPagina();

if (usuario) {
  pintarMenu(usuario);
  if (usuario.role === 'admin') {
    document.getElementById('seccion-admin').hidden = false;
    cargarHistoricoUsuarios(); // este ya pinta la gráfica al tener los usuarios
  } else {
    document.getElementById('seccion-usuario').hidden = false;
    cargarMiHistorico();
    cargarGrafica();
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

// Gráfica con Chart.js el usuario ve sus horas y el admin las de todos separadas por usuario
let grafica = null; // la gráfica dibujada para borrarla antes de dibujar otra
let usuariosGrafica = []; // los usuarios del desplegable del admin
const COLORES = ['#00873a', '#feb63c', '#2563eb', '#db2777', '#7c3aed', '#0891b2', '#ea580c', '#65a30d'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Pone el periodo más bonito por ejemplo 2026-11 pasa a nov 2026
function textoPeriodo(periodo, valor) {
  if (periodo === 'day') {
    return formatearFecha(valor);
  }
  if (periodo === 'week') {
    return `Semana del ${formatearFecha(valor)}`;
  }
  if (periodo === 'month') {
    const [anio, mes] = valor.split('-');
    return `${MESES[Number(mes) - 1]} ${anio}`;
  }
  return valor;
}

async function cargarGrafica() {
  const periodo = document.getElementById('periodo').value;
  const elegido = document.getElementById('usuario-grafica').value; // solo admin y vacío es todos
  try {
    // Cada serie es un usuario con sus horas y si el admin ve todos hay una por usuario
    let series = [];
    if (usuario.role === 'admin' && !elegido) {
      const peticiones = usuariosGrafica.map((u) => api(`/history/stats?period=${periodo}&userId=${u._id}`));
      const respuestas = await Promise.all(peticiones); // todas las peticiones a la vez
      series = usuariosGrafica.map((u, i) => ({ nombre: u.name, datos: respuestas[i] }));
    } else {
      let ruta = `/history/stats?period=${periodo}`;
      if (elegido) {
        ruta += `&userId=${elegido}`;
      }
      series = [{ nombre: 'Horas cargadas', datos: await api(ruta) }];
    }

    // Todos los periodos que salen en alguna serie ordenados
    const periodos = [...new Set(series.flatMap((s) => s.datos.map((d) => d.period)))].sort();

    // Una barra por usuario y en los periodos que no tiene horas va un 0
    const datasets = series.map((s, i) => ({
      label: s.nombre,
      data: periodos.map((p) => {
        const fila = s.datos.find((d) => d.period === p);
        return fila ? fila.hours : 0;
      }),
      backgroundColor: COLORES[i % COLORES.length],
      borderRadius: 6,
      maxBarThickness: 70, // para que con pocos datos la barra no ocupe todo
    }));

    if (grafica) {
      grafica.destroy();
    }
    const variosUsuarios = series.length > 1;
    grafica = new Chart(document.getElementById('grafica'), {
      type: 'bar',
      data: { labels: periodos.map((p) => textoPeriodo(periodo, p)), datasets },
      options: {
        aspectRatio: 3, // más ancha que alta
        plugins: { legend: { display: variosUsuarios, position: 'bottom' } },
        scales: {
          x: { stacked: variosUsuarios }, // las barras de cada usuario una encima de otra
          y: { stacked: variosUsuarios, beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// Desplegable del admin para ver la gráfica de todos o de un usuario
function rellenarUsuariosGrafica(usuarios) {
  const select = document.getElementById('usuario-grafica');
  usuariosGrafica = usuarios;
  for (const u of usuarios) {
    select.innerHTML += `<option value="${u._id}">${u.name}</option>`;
  }
  select.hidden = false;
  cargarGrafica(); // ahora que ya están los usuarios se pinta separada por usuario
}

document.getElementById('periodo').addEventListener('change', cargarGrafica);
document.getElementById('usuario-grafica').addEventListener('change', cargarGrafica);
