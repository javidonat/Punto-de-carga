import { api, guardarSesion } from './api.js';

const formulario = document.getElementById('form-registro');
const textoError = document.getElementById('error');

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  textoError.textContent = '';

  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const password2 = document.getElementById('password2').value;

  if (password !== password2) {
    textoError.textContent = 'Las contraseñas no coinciden';
    return;
  }

  try {
    const respuesta = await api('/auth/register', 'POST', { name: nombre, email, password });
    guardarSesion(respuesta.token, respuesta.user);
    window.location.href = 'inicio.html';
  } catch (error) {
    textoError.textContent = error.message;
  }
});
