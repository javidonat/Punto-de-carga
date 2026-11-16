import { api, protegerPagina, guardarSesion } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje } from './utilidades.js';

const usuario = protegerPagina();

if (usuario) {
  pintarMenu(usuario);
  document.getElementById('nombre').textContent = usuario.name;
  document.getElementById('email').textContent = usuario.email;
}

// Cambiar la contraseña y el servidor devuelve un token nuevo porque el viejo ya no vale
document.getElementById('form-password').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const actual = document.getElementById('actual').value;
  const nueva = document.getElementById('nueva').value;

  if (nueva !== document.getElementById('nueva2').value) {
    mostrarMensaje('Las contraseñas nuevas no coinciden', true);
    return;
  }

  try {
    const datos = await api('/auth/password', 'PATCH', { currentPassword: actual, newPassword: nueva });
    guardarSesion(datos.token, datos.user);
    evento.target.reset();
    mostrarMensaje('Contraseña cambiada correctamente', false);
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});
