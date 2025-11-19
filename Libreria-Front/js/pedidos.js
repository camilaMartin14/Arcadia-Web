import { API_BASE } from "./config.js";

const API_PEDIDOS = `${API_BASE}/api/pedido`;

const $ = (sel) => document.querySelector(sel);

let modoFormulario = "crear";
let pedidoSeleccionado = null;

// Variables para las instancias de los modales de Bootstrap
let modalPedidoBS = null;
let modalEstadoBS = null;

function applyTheme(theme) {
  document.body.setAttribute("data-bs-theme", theme);
  const icon = document.getElementById("theme-icon");
  const btnTema = document.getElementById("theme-toggle");

  if (icon) {
     if (theme === 'dark') {
        icon.className = "bi bi-moon-stars-fill";
     } else {
        icon.className = "bi bi-sun-fill";
     }
  }

  if (btnTema) {
    btnTema.classList.toggle('btn-secondary', theme === 'light');
    btnTema.classList.toggle('btn-outline-warning', theme === 'dark');
  }
  localStorage.setItem("tema", theme);
}

function toggleTheme() {
  const current = document.body.getAttribute("data-bs-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
}

function requireLogin() {
  const raw = localStorage.getItem("usuario");
  if (!raw) {
    return { nombre: "Invitado", rol: "" };
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("usuario");
    return { nombre: "Invitado", rol: "" };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inicializar los modales de Bootstrap
  const modalPedidoEl = document.getElementById('modalPedido');
  if (modalPedidoEl) {
    modalPedidoBS = new bootstrap.Modal(modalPedidoEl);
  }

  const modalEstadoEl = document.getElementById('modalEstado');
  if (modalEstadoEl) {
    modalEstadoBS = new bootstrap.Modal(modalEstadoEl);
  }

  // Tema y Usuario
  const temaGuardado = localStorage.getItem("tema");
  const temaInicial =
    temaGuardado ||
    (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark");

  applyTheme(temaInicial);
  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);

  const usuario = requireLogin();
  const userGreetingText = document.getElementById("user-greeting-text");

  if (userGreetingText) {
    const nombre = usuario.nombre ?? usuario.Nombre ?? usuario.usuario ?? usuario.Usuario ?? "Usuario";
    const apellido = usuario.apellido ?? usuario.Apellido ?? "";
    userGreetingText.textContent = `👤 Hola, ${nombre} ${apellido}`;
  }

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem('token');
    window.location.href = "login.html";
  });

  // Eventos de Botones Principales
  $("#btnBuscarPedidos")?.addEventListener("click", cargarPedidos);
  $("#btnLimpiarFiltros")?.addEventListener("click", limpiarFiltros);

  $("#btnNuevoPedido")?.addEventListener("click", () => abrirFormularioNuevo());

  // Eventos del Formulario (Modal Pedido)
  $("#formPedido")?.addEventListener("submit", onSubmitPedido);
  $("#btnAgregarDetalle")?.addEventListener("click", agregarFilaDetalle);

  // Eventos del Modal Estado
  $("#btnGuardarEstado")?.addEventListener("click", guardarCambioEstado);
  
  // Carga inicial
  cargarPedidos();
});

// --- FUNCIONES DE CARGA DE DATOS ---

async function cargarPedidos() {
  const fecha = $("#filtroFecha")?.value;
  const codCli = $("#filtroCodCliente")?.value;
  const params = new URLSearchParams();

  if (fecha) params.append("fecha", fecha);
  if (codCli) params.append("codigoCliente", codCli);

  const url = params.toString() ? `${API_PEDIDOS}?${params.toString()}` : API_PEDIDOS;

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Error al obtener pedidos");
    const pedidos = await resp.json();
    renderPedidos(pedidos);
  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al cargar los pedidos.");
  }
}

function renderPedidos(pedidos) {
  const tbody = document.getElementById("tbodyPedidos");
  const sinResultados = document.getElementById("sinResultados");
  tbody.innerHTML = "";

  if (!pedidos || pedidos.length === 0) {
    if (sinResultados) sinResultados.classList.remove("d-none");
    return;
  }

  if (sinResultados) sinResultados.classList.add("d-none");

  pedidos.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nroPedido}</td>
      <td>${new Date(p.fecha).toLocaleString()}</td>
      <td>${p.nombreCliente ?? p.codCliente}</td>
      <td>${p.nombreFormaEnvio ?? p.idFormaEnvio}</td>
      <td>${p.estadoActual ?? 'Sin estado'}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-info action-sm" title="Ver" onclick="verPedido(${p.nroPedido})">
            <i class="bi bi-eye"></i>
        </button>
        <button class="btn btn-sm btn-outline-warning action-sm" title="Editar" onclick="editarPedido(${p.nroPedido})">
            <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary action-sm" title="Cambiar estado" onclick="cambiarEstado(${p.nroPedido})">
            <i class="bi bi-arrow-repeat"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger action-sm" title="Eliminar" onclick="eliminarPedido(${p.nroPedido})">
            <i class="bi bi-trash"></i>
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function limpiarFiltros() {
  if ($("#filtroFecha")) $("#filtroFecha").value = "";
  if ($("#filtroCodCliente")) $("#filtroCodCliente").value = "";
  cargarPedidos();
}

// --- FUNCIONES GLOBALES PARA ACCIONES (Ver, Editar) ---

window.verPedido = async function (nroPedido) {
  try {
    const resp = await fetch(`${API_PEDIDOS}/${nroPedido}`);
    if (!resp.ok) throw new Error("No se pudo obtener el pedido");
    const pedido = await resp.json();
    abrirFormularioEdicion(pedido, true); // true = Solo Lectura
  } catch (err) {
    console.error(err);
    alert("Error al traer el pedido.");
  }
};

window.editarPedido = async function (nroPedido) {
  try {
    const resp = await fetch(`${API_PEDIDOS}/${nroPedido}`);
    if (!resp.ok) throw new Error("No se pudo obtener el pedido");
    const pedido = await resp.json();
    abrirFormularioEdicion(pedido, false); // false = Edición
  } catch (err) {
    console.error(err);
    alert("Error al traer el pedido.");
  }
};

// --- LÓGICA DEL MODAL DE PEDIDO (ABM) ---

function abrirFormularioNuevo() {
  modoFormulario = "crear";
  pedidoSeleccionado = null;
  
  limpiarFormularioPedido();
  toggleSoloLectura(false); // Habilitar campos

  const titulo = $("#tituloModalPedido");
  if (titulo) titulo.textContent = "Nuevo pedido";
  
  modalPedidoBS.show();
}

function abrirFormularioEdicion(pedido, soloLectura) {
  modoFormulario = soloLectura ? "ver" : "editar";
  pedidoSeleccionado = pedido.nroPedido;

  // 1. Setear Título
  const titulo = $("#tituloModalPedido");
  if (titulo) {
    titulo.textContent = soloLectura ? `Ver Pedido #${pedido.nroPedido}` : `Editar Pedido #${pedido.nroPedido}`;
  }

  // 2. Cargar Datos Cabecera
  $("#nroPedido").value = pedido.nroPedido;
  // Ajuste de formato fecha para input datetime-local
  $("#fecha").value = pedido.fecha ? new Date(pedido.fecha).toISOString().slice(0, 16) : "";
  // Ajuste de formato fecha para input date
  $("#fechaEntrega").value = pedido.fechaEntrega ? pedido.fechaEntrega.split('T')[0] : "";
  $("#codCliente").value = pedido.codCliente ?? "";
  $("#idFormaEnvio").value = pedido.idFormaEnvio ?? "";
  $("#instrucciones").value = pedido.instruccionesAdicionales ?? "";

  // 3. Cargar Detalles
  const tbodyDetalles = $("#tbodyDetalles");
  if (tbodyDetalles) {
    tbodyDetalles.innerHTML = "";
    (pedido.detalles || []).forEach((det) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="number" class="form-control form-control-sm det-codLibro" value="${det.codLibro}" ${soloLectura ? "disabled" : ""}></td>
        <td><input type="number" class="form-control form-control-sm det-cantidad" value="${det.cantidad}" ${soloLectura ? "disabled" : ""}></td>
        <td><input type="number" step="0.01" class="form-control form-control-sm det-precio" value="${det.precio}" ${soloLectura ? "disabled" : ""}></td>
        <td>${soloLectura ? "" : '<button type="button" class="btn btn-sm btn-outline-danger btnQuitarDetalle"><i class="bi bi-x"></i></button>'}</td>
      `;
      
      if (!soloLectura) {
        tr.querySelector(".btnQuitarDetalle").addEventListener("click", () => tr.remove());
      }
      tbodyDetalles.appendChild(tr);
    });
  }

  // 4. Configurar estado de campos (Lectura vs Edición)
  toggleSoloLectura(soloLectura);

  modalPedidoBS.show();
}

function toggleSoloLectura(bloquear) {
    // Bloquear/Desbloquear inputs del formulario
    const campos = document.querySelectorAll("#formPedido input, #formPedido select, #formPedido textarea");
    campos.forEach(el => el.disabled = bloquear);

    // Ocultar/Mostrar botón Guardar
    const btnGuardar = $("#btnGuardarPedido");
    if (btnGuardar) {
        if (bloquear) btnGuardar.classList.add("d-none");
        else btnGuardar.classList.remove("d-none");
    }

    // Ocultar/Mostrar botón Agregar Detalle
    const btnAgregar = $("#btnAgregarDetalle");
    if (btnAgregar) {
        if (bloquear) btnAgregar.classList.add("d-none");
        else btnAgregar.classList.remove("d-none");
    }
}

function limpiarFormularioPedido() {
  $("#formPedido")?.reset();
  $("#tbodyDetalles").innerHTML = "";
  $("#nroPedido").value = "";
}

function agregarFilaDetalle() {
  const tbody = $("#tbodyDetalles");
  if (!tbody) return;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="number" class="form-control form-control-sm det-codLibro" required></td>
    <td><input type="number" class="form-control form-control-sm det-cantidad" min="1" value="1" required></td>
    <td><input type="number" step="0.01" class="form-control form-control-sm det-precio" required></td>
    <td><button type="button" class="btn btn-sm btn-outline-danger btnQuitarDetalle"><i class="bi bi-x"></i></button></td>
  `;
  tr.querySelector(".btnQuitarDetalle").addEventListener("click", () => tr.remove());
  tbody.appendChild(tr);
}

async function onSubmitPedido(e) {
  e.preventDefault();
    console.log("-> Se ejecutó onSubmitPedido");


  // Si estamos en modo ver, no hacemos submit (aunque el botón está oculto)
  if (modoFormulario === "ver") return;

  const pedidoBody = armarBodyPedido();

  // Validación básica
  if (!pedidoBody.codCliente || !pedidoBody.fecha) {
      alert("Por favor complete los campos obligatorios.");
      return;
  }

  try {
    let resp;
    if (modoFormulario === "crear") {
      resp = await fetch(API_PEDIDOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoBody),
      });

      if (resp.status === 201 || resp.ok) {
        alert("Pedido creado correctamente.");
      } else {
        throw new Error("Error al crear pedido");
      }
    } else if (modoFormulario === "editar") {
      const nro = pedidoSeleccionado;
      resp = await fetch(`${API_PEDIDOS}/${nro}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoBody),
      });

      if (!resp.ok) {
        throw new Error("Error al actualizar pedido");
      }
      alert("Pedido actualizado correctamente.");
    }

    modalPedidoBS.hide(); // Cerrar modal
    cargarPedidos();      // Recargar lista
  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al guardar el pedido.");
  }
}

function armarBodyPedido() {
  const nroPedido = $("#nroPedido").value;
  const fecha = $("#fecha").value;
  const fechaEntrega = $("#fechaEntrega").value;
  const codCliente = $("#codCliente").value;
  const idFormaEnvio = $("#idFormaEnvio").value;
  const instrucciones = $("#instrucciones").value;

  const detalles = [];
  document.querySelectorAll("#tbodyDetalles tr").forEach((tr) => {
    const codLibro = tr.querySelector(".det-codLibro").value;
    const cantidad = tr.querySelector(".det-cantidad").value;
    const precio = tr.querySelector(".det-precio").value;

    if (codLibro && cantidad && precio) {
      detalles.push({
        codLibro: parseInt(codLibro),
        cantidad: parseInt(cantidad),
        precio: parseFloat(precio),
        nroPedido: nroPedido ? parseInt(nroPedido) : 0,
      });
    }
  });

  return {
    nroPedido: nroPedido ? parseInt(nroPedido) : 0,
    fecha: fecha,
    fechaEntrega: fechaEntrega,
    instruccionesAdicionales: instrucciones,
    codCliente: parseInt(codCliente),
    idFormaEnvio: parseInt(idFormaEnvio),
    detalles: detalles,
  };
}

// --- LÓGICA DE CAMBIO DE ESTADO ---

window.cambiarEstado = async function (nroPedido) {
  pedidoSeleccionado = nroPedido;
  $("#estadoNroPedido").textContent = nroPedido;
  
  // Resetear campos del modal
  $("#nuevoEstado").value = "";
  $("#observacionesEstado").value = "";

  modalEstadoBS.show();
};

async function guardarCambioEstado() {
  const nuevoEstadoId = $("#nuevoEstado").value;
  const obs = $("#observacionesEstado").value;

  if (!nuevoEstadoId) {
    alert("Debe seleccionar un nuevo estado.");
    return;
  }

  const body = {
    nuevoEstadoId: parseInt(nuevoEstadoId),
    observaciones: obs,
  };

  try {
    const resp = await fetch(`${API_PEDIDOS}/${pedidoSeleccionado}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      throw new Error("Error al actualizar el estado del pedido.");
    }

    alert("Estado actualizado correctamente.");
    modalEstadoBS.hide();
    cargarPedidos();
  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al cambiar el estado.");
  }
}

// --- LÓGICA DE ELIMINAR ---

window.eliminarPedido = async function (nroPedido) {
  const confirma = confirm(
    `¿Está seguro que desea eliminar el pedido N° ${nroPedido}?`
  );
  if (!confirma) return;

  try {
    const resp = await fetch(`${API_PEDIDOS}/${nroPedido}`, {
      method: "DELETE",
    });

    if (resp.status === 204 || resp.ok) {
      alert("Pedido eliminado correctamente.");
      cargarPedidos();
    } else {
      throw new Error("No se pudo eliminar el pedido.");
    }
  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al eliminar el pedido.");
  }
};