// Guarda y recupera la sesión con localStorage
export function guardarSesion(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

export function obtenerUsuario() {
  return JSON.parse(localStorage.getItem('usuario'));
}

export function borrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

// Hace la petición a la API y devuelve los datos y si hay error lo lanza para el try catch
export async function api(ruta, metodo = 'GET', datos = null) {
  const opciones = {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
  };

  const token = localStorage.getItem('token');
  if (token) {
    opciones.headers.Authorization = 'Bearer ' + token;
  }
  if (datos) {
    opciones.body = JSON.stringify(datos);
  }

  const respuesta = await fetch('/api' + ruta, opciones);
  const json = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(json.message || 'Algo ha ido mal');
  }
  // El backend contesta ok message y data pero solo devolvemos data que es lo que usan las pantallas
  return json.data;
}

// Para las páginas con sesión si no hay usuario vuelve al login y rol dice si es solo para admin o user
export function protegerPagina(rol = null) {
  const usuario = obtenerUsuario();
  if (!usuario) {
    window.location.href = 'index.html';
    return null;
  }
  if (rol && usuario.role !== rol) {
    window.location.href = 'inicio.html';
    return null;
  }
  return usuario;
}

export async function cerrarSesion() {
  try {
    await api('/auth/logout', 'POST');
  } catch (e) {
    // Si el token ya no valía da igual porque borramos la sesión igualmente
  }
  borrarSesion();
  window.location.href = 'index.html';
}
