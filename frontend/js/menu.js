import { cerrarSesion } from './api.js';

const ENLACES = [
  { texto: 'Inicio', href: 'inicio.html', rol: null },
  { texto: 'Mi horario', href: 'horario.html', rol: 'user' },
  { texto: 'Mis turnos', href: 'turnos.html', rol: 'user' },
  { texto: 'Histórico', href: 'historico.html', rol: null },
  { texto: 'Puntos de recarga', href: 'admin-puntos.html', rol: 'admin' },
  { texto: 'Usuarios', href: 'admin-usuarios.html', rol: 'admin' },
  { texto: 'Turnos semana', href: 'admin-turnos.html', rol: 'admin' },
];

export function pintarMenu(usuario) {
  const nav = document.getElementById('menu');

  for (const enlace of ENLACES) {
    if (enlace.rol && enlace.rol !== usuario.role) {
      continue;
    }
    const a = document.createElement('a');
    a.href = enlace.href;
    a.textContent = enlace.texto;
    // Marcamos la página en la que estamos
    const paginaActual = location.pathname.split('/').pop();
    if (paginaActual === enlace.href) {
      a.classList.add('activo');
    }
    nav.appendChild(a);
  }

  const salir = document.createElement('a');
  salir.href = '#';
  salir.textContent = 'Salir';
  salir.addEventListener('click', (evento) => {
    evento.preventDefault();
    cerrarSesion();
  });
  nav.appendChild(salir);
}