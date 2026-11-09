import { api, protegerPagina } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje, formatearFecha } from './utilidades.js';

const usuario = protegerPagina('admin');

let usuariosCargados = []; // los de la tabla para rellenar el formulario al editar
let editandoId = null; // id del usuario que se está editando

if (usuario) {
  pintarMenu(usuario);
  cargarUsuarios();
}

async function cargarUsuarios() {
  try {
    usuariosCargados = await api('/users');
    pintarUsuarios(usuariosCargados);
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// Activo, de baja o ausente hasta el 22/11 absence viene del backend: su ausencia de hoy o null
function textoEstado(u) {
  if (!u.isActive) {
    return 'De baja';
  }
  if (u.absence && u.absence.to) {
    return `Ausente hasta el ${formatearFecha(u.absence.to)}`;
  }
  if (u.absence) {
    return 'Ausente (sin fecha de vuelta)';
  }
  return 'Activo';
}

// Los botones de una fila, en la fila del propio admin no hay botones.
function botonesUsuario(u) {
  if (u._id === usuario._id) {
    return '(tú)';
  }
  const textoBotonEstado = u.isActive ? 'Dar de baja' : 'Dar de alta';
  const textoRol = u.role === 'admin' ? 'Quitar admin' : 'Hacer admin';
  return `
    <button class="pequeno" data-accion="editar" data-id="${u._id}">Editar</button>
    <button class="pequeno" data-accion="estado" data-id="${u._id}" data-activo="${u.isActive}">${textoBotonEstado}</button>
    <button class="pequeno" data-accion="rol" data-id="${u._id}" data-rol="${u.role}">${textoRol}</button>
    <button class="pequeno peligro" data-accion="eliminar" data-id="${u._id}">Eliminar</button>`;
}

// Una fila de la tabla por usuario
function pintarUsuarios(usuarios) {
  let html = '';
  for (const u of usuarios) {
    const rol = u.role === 'admin' ? 'Admin' : 'Usuario';
    const claseEstado = u.isActive && !u.absence ? 'ok' : 'mal';

    html += `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${rol}</td>
        <td><span class="estado ${claseEstado}">${textoEstado(u)}</span></td>
        <td>${u.totalHours} h</td>
        <td>${u.penaltyHours} h</td>
        <td class="acciones">${botonesUsuario(u)}</td>
      </tr>`;
  }
  document.getElementById('usuarios').innerHTML = html;
}

// Rellena el formulario con los datos del usuario y lo enseña
function empezarEdicion(u) {
  editandoId = u._id;
  document.getElementById('nombre').value = u.name;
  document.getElementById('email').value = u.email;
  document.getElementById('password').value = '';
  document.getElementById('titulo-formulario').textContent = `Editar ${u.name}`;
  document.getElementById('formulario').hidden = false;
  document.getElementById('nombre').focus();
}

// Vacía el formulario y lo vuelve a esconder
function terminarEdicion() {
  editandoId = null;
  document.getElementById('formulario').reset();
  document.getElementById('formulario').hidden = true;
}

document.getElementById('cancelar-edicion').addEventListener('click', terminarEdicion);

document.getElementById('formulario').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const datos = {
    name: document.getElementById('nombre').value,
    email: document.getElementById('email').value,
  };
  // La contraseña solo se manda si se ha escrito una nueva
  const password = document.getElementById('password').value;
  if (password !== '') {
    datos.password = password;
  }

  try {
    await api(`/users/${editandoId}`, 'PATCH', datos);
    mostrarMensaje('Usuario modificado', false);
    terminarEdicion();
    cargarUsuarios();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});

// Un solo listener para todos los botones de la tabla
document.getElementById('usuarios').addEventListener('click', async (evento) => {
  const boton = evento.target;
  const id = boton.dataset.id;
  if (!id) {
    return; // no se ha pulsado un botón
  }

  if (boton.dataset.accion === 'editar') {
    const u = usuariosCargados.find((x) => x._id === id);
    empezarEdicion(u);
    return;
  }

  try {
    if (boton.dataset.accion === 'estado') {
      const activo = boton.dataset.activo === 'true';
      await api(`/users/${id}/active`, 'PATCH', { isActive: !activo });
      mostrarMensaje(activo ? 'Usuario dado de baja' : 'Usuario dado de alta', false);
    }
    if (boton.dataset.accion === 'rol') {
      const nuevoRol = boton.dataset.rol === 'admin' ? 'user' : 'admin';
      await api(`/users/${id}/role`, 'PATCH', { role: nuevoRol });
      mostrarMensaje('Rol cambiado', false);
    }
    if (boton.dataset.accion === 'eliminar') {
      if (!confirm('¿Seguro que quieres eliminar este usuario? Sus horas pasadas se quedan en el histórico.')) {
        return;
      }
      await api(`/users/${id}/softdelete`, 'PATCH');
      mostrarMensaje('Usuario eliminado', false);
    }
    cargarUsuarios();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});