import { cerrarSesion } from './api.js';

const ENLACES = [
  { icono: '🏠', texto: 'Inicio', href: 'inicio.html', rol: null },
  { icono: '🗓️', texto: 'Mi horario', href: 'horario.html', rol: 'user' },
  { icono: '🔌', texto: 'Mis turnos', href: 'turnos.html', rol: 'user' },
  { icono: '📊', texto: 'Histórico', href: 'historico.html', rol: null },
  { icono: '⚡', texto: 'Puntos de recarga', href: 'admin-puntos.html', rol: 'admin' },
  { icono: '👥', texto: 'Usuarios', href: 'admin-usuarios.html', rol: 'admin' },
  { icono: '📅', texto: 'Turnos semana', href: 'admin-turnos.html', rol: 'admin' },
  { icono: '⚠️', texto: 'Incidencias', href: 'admin-incidencias.html', rol: 'admin' },
];

export function pintarMenu(usuario) {
  const nav = document.getElementById('menu');

  for (const enlace of ENLACES) {
    if (enlace.rol && enlace.rol !== usuario.role) {
      continue;
    }
    const a = document.createElement('a');
    a.href = enlace.href;
    a.textContent = `${enlace.icono} ${enlace.texto}`;
    const paginaActual = location.pathname.split('/').pop();
    if (paginaActual === enlace.href) {
      a.classList.add('activo');
    }
    nav.appendChild(a);
  }

  const salir = document.createElement('a');
  salir.href = '#';
  salir.textContent = '🚪 Salir';
  salir.addEventListener('click', (evento) => {
    evento.preventDefault();
    cerrarSesion();
  });
  nav.appendChild(salir);
}