import { cerrarSesion } from './api.js';

const ENLACES = [
  { icono: 'home', texto: 'Inicio', href: 'inicio.html', rol: null },
  { icono: 'calendar_month', texto: 'Mi horario', href: 'horario.html', rol: 'user' },
  { icono: 'ev_station', texto: 'Mis turnos', href: 'turnos.html', rol: 'user' },
  { icono: 'bar_chart', texto: 'Histórico', href: 'historico.html', rol: null },
  { icono: 'bolt', texto: 'Puntos de recarga', href: 'admin-puntos.html', rol: 'admin' },
  { icono: 'group', texto: 'Usuarios', href: 'admin-usuarios.html', rol: 'admin' },
  { icono: 'event', texto: 'Turnos semana', href: 'admin-turnos.html', rol: 'admin' },
  { icono: 'warning', texto: 'Incidencias', href: 'admin-incidencias.html', rol: 'admin' },
  { icono: 'person', texto: 'Mi cuenta', href: 'cuenta.html', rol: null },
];

export function pintarMenu(usuario) {
  const nav = document.getElementById('menu');

  for (const enlace of ENLACES) {
    if (enlace.rol && enlace.rol !== usuario.role) {
      continue;
    }
    const a = document.createElement('a');
    a.href = enlace.href;
    // El icono es un span con el nombre del icono de Material Symbols
    a.innerHTML = `<span class="material-symbols-outlined">${enlace.icono}</span> ${enlace.texto}`;
    const paginaActual = location.pathname.split('/').pop();
    if (paginaActual === enlace.href) {
      a.classList.add('activo');
    }
    nav.appendChild(a);
  }

  const salir = document.createElement('a');
  salir.href = '#';
  salir.innerHTML = '<span class="material-symbols-outlined">logout</span> Salir';
  salir.addEventListener('click', (evento) => {
    evento.preventDefault();
    cerrarSesion();
  });
  nav.appendChild(salir);
}