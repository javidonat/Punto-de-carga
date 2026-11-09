import { api, guardarSesion, obtenerUsuario } from './api.js';
if (obtenerUsuario()) {
  window.location.href = 'inicio.html';
}

const formulario = document.getElementById('form-login');
const textoError = document.getElementById('error');

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault(); // evita que el formulario recargue la página
  textoError.textContent = '';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const respuesta = await api('/auth/login', 'POST', { email, password });
    guardarSesion(respuesta.token, respuesta.user);
    window.location.href = 'inicio.html';
  } catch (error) {
    textoError.textContent = error.message;
  }
});
