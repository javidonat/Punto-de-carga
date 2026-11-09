import { api, protegerPagina } from './api.js';
import { pintarMenu } from './menu.js';
import { mostrarMensaje } from './utilidades.js';

const usuario = protegerPagina('admin');

let puntosCargados = []; // los puntos que hay en la tabla para poder rellenar el formulario al editar
let editandoId = null; // id del punto que se está editando

if (usuario) {
  pintarMenu(usuario);
  cargarPuntos();
}

async function cargarPuntos() {
  try {
    puntosCargados = await api('/chargers');
    pintarPuntos(puntosCargados);
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
}

// Una fila de la tabla por punto de recarga
function pintarPuntos(puntos) {
  let html = '';
  for (const punto of puntos) {
    let potencia = '-';
    if (punto.powerKw !== null) {
      potencia = `${punto.powerKw} kW`;
    }
    const estado = punto.isActive ? 'En servicio' : 'Averiado';
    const claseEstado = punto.isActive ? 'ok' : 'mal';
    const textoBoton = punto.isActive ? 'Marcar averiado' : 'Marcar en servicio';

    html += `
      <tr>
        <td>${punto.name}</td>
        <td>${punto.type || '-'}</td>
        <td>${potencia}</td>
        <td><span class="estado ${claseEstado}">${estado}</span></td>
        <td class="acciones">
          <button class="pequeno" data-accion="editar" data-id="${punto._id}">Editar</button>
          <button class="pequeno" data-accion="estado" data-id="${punto._id}" data-activo="${punto.isActive}">${textoBoton}</button>
          <button class="pequeno peligro" data-accion="eliminar" data-id="${punto._id}">Eliminar</button>
        </td>
      </tr>`;
  }
  document.getElementById('puntos').innerHTML = html;
}

// Rellena el formulario con los datos del punto y ponerlo en modo editar
function empezarEdicion(punto) {
  editandoId = punto._id;
  let potencia = '';
  if (punto.powerKw !== null) {
    potencia = punto.powerKw;
  }
  document.getElementById('nombre').value = punto.name;
  document.getElementById('tipo').value = punto.type;
  document.getElementById('potencia').value = potencia;
  document.getElementById('titulo-formulario').textContent = `Editar ${punto.name}`;
  document.getElementById('enviar').textContent = 'Guardar cambios';
  document.getElementById('cancelar-edicion').hidden = false;
  document.getElementById('nombre').focus();
}

// Vacíar el formulario y dejarlo otra vez en modo añadir
function terminarEdicion() {
  editandoId = null;
  document.getElementById('formulario').reset();
  document.getElementById('titulo-formulario').textContent = 'Añadir punto de recarga';
  document.getElementById('enviar').textContent = 'Añadir';
  document.getElementById('cancelar-edicion').hidden = true;
}

document.getElementById('cancelar-edicion').addEventListener('click', terminarEdicion);

// Botones de las filas con un solo listener para toda la tabla
document.getElementById('puntos').addEventListener('click', async (evento) => {
  const boton = evento.target;
  const id = boton.dataset.id;
  if (!id) {
    return; // no se ha pulsado un botón
  }

  if (boton.dataset.accion === 'editar') {
    const punto = puntosCargados.find((p) => p._id === id);
    empezarEdicion(punto);
    return;
  }

  try {
    if (boton.dataset.accion === 'estado') {
      const activo = boton.dataset.activo === 'true';
      await api(`/chargers/${id}/active`, 'PATCH', { isActive: !activo });
      mostrarMensaje(activo ? 'Marcado como averiado' : 'De nuevo en servicio', false);
    }
    if (boton.dataset.accion === 'eliminar') {
      if (!confirm('¿Seguro que quieres eliminar este punto de recarga? Se quitarán sus turnos pendientes.')) {
        return;
      }
      await api(`/chargers/${id}/softdelete`, 'PATCH');
      mostrarMensaje('Punto de recarga eliminado', false);
    }
    cargarPuntos();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});

// Formulario para añadir uno nuevo
document.getElementById('formulario').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const potencia = document.getElementById('potencia').value;
  const datos = {
    name: document.getElementById('nombre').value,
    type: document.getElementById('tipo').value,
    powerKw: potencia === '' ? null : Number(potencia), // null es sin dato
  };

  try {
    if (editandoId) {
      await api(`/chargers/${editandoId}`, 'PATCH', datos);
      mostrarMensaje('Punto de recarga modificado', false);
    } else {
      await api('/chargers', 'POST', datos);
      mostrarMensaje('Punto de recarga añadido', false);
    }
    terminarEdicion();
    cargarPuntos();
  } catch (error) {
    mostrarMensaje(error.message, true);
  }
});