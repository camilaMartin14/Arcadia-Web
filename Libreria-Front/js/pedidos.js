import { API_BASE } from "./config.js";

const API_PEDIDOS = `${API_BASE}/api/pedido`;
const API_LIBROS = `${API_BASE}/api/libro/filtrar`;
const API_CLIENTES = `${API_BASE}/api/cliente`;

const $ = (sel) => document.querySelector(sel);

let modoFormulario = "crear";
let pedidoSeleccionado = null;

let modalPedidoBS = null;
let modalEstadoBS = null;
let botonesAccionesOcultos = [];
let catalogoLibros = [];
let mapaTituloALibro = new Map();
let catalogoClientes = [];
let mapaNombreCliente = new Map();
let pedPage = 1;
let pedPageSize = 10;
let pedLast = [];

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
  const modalPedidoEl = document.getElementById('modalPedido');
  if (modalPedidoEl) {
    modalPedidoBS = new bootstrap.Modal(modalPedidoEl);
    modalPedidoEl.addEventListener('hidden.bs.modal', () => {
      botonesAccionesOcultos.forEach(btn => btn.classList.remove('d-none'));
      botonesAccionesOcultos = [];
    });
  }

  const modalEstadoEl = document.getElementById('modalEstado');
  if (modalEstadoEl) {
    modalEstadoBS = new bootstrap.Modal(modalEstadoEl);
  }

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

  $("#btnBuscarPedidos")?.addEventListener("click", cargarPedidos);
  $("#btnLimpiarFiltros")?.addEventListener("click", limpiarFiltros);

  $("#filtroActivos")?.addEventListener("change", cargarPedidos);
  document.getElementById('pedidosPageSize')?.addEventListener('change', () => { pedPage = 1; renderPedidos(filtrarPedidos(pedLast)); });
  document.getElementById('pedPrev')?.addEventListener('click', () => { if (pedPage > 1) { pedPage--; renderPedidos(pedLast); } });
  document.getElementById('pedNext')?.addEventListener('click', () => { const totalPages = Math.max(1, Math.ceil(pedLast.length / pedPageSize)); if (pedPage < totalPages) { pedPage++; renderPedidos(pedLast); } });

  $("#btnNuevoPedido")?.addEventListener("click", () => abrirFormularioNuevo());

  $("#formPedido")?.addEventListener("submit", onSubmitPedido);
  $("#btnAgregarDetalle")?.addEventListener("click", agregarFilaDetalle);

  $("#btnGuardarEstado")?.addEventListener("click", guardarCambioEstado);
 
  const fDesde = document.getElementById('filtroFechaDesde');
  const fHasta = document.getElementById('filtroFechaHasta');
  const hoyStr = new Date().toISOString().slice(0,10);
  if (fDesde) fDesde.max = hoyStr;
  if (fHasta && fDesde) fHasta.min = fDesde.value || '';
  fDesde?.addEventListener('change', () => {
    if (fHasta) {
      fHasta.min = fDesde.value || '';
      if (fHasta.value && fDesde.value && fHasta.value < fDesde.value) {
        fHasta.value = fDesde.value;
      }
    }
    if (fDesde.value && fDesde.value > hoyStr) {
      alert('La fecha desde no puede ser posterior a hoy.');
      fDesde.value = hoyStr;
    }
  });
  fHasta?.addEventListener('change', () => {
    const d = fDesde?.value || '';
    const h = fHasta.value || '';
    if (d && h && h < d) {
      alert('La fecha hasta no puede ser menor a la fecha desde.');
      fHasta.value = d;
    }
  });
  
  Promise.all([cargarCatalogoLibros(), cargarCatalogoClientes(), cargarEstadosPedido()])
    .then(() => cargarPedidos());
});

async function cargarEstadosPedido() {
    try {
        const resp = await fetch(`${API_PEDIDOS}/estados`);
        if (!resp.ok) throw new Error("No se pudieron cargar los estados");
        const estados = await resp.json();
        
        const select = document.getElementById("nuevoEstado");
        if (!select) return;

        // Mantener la opción por defecto
        select.innerHTML = '<option value="">Seleccionar…</option>';

        estados.forEach(est => {
            const opt = document.createElement("option");
            opt.value = est.id;
            opt.textContent = est.nombre;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Error cargando estados:", err);
    }
}

async function cargarPedidos() {
  const desde = document.getElementById('filtroFechaDesde')?.value || '';
  const hasta = document.getElementById('filtroFechaHasta')?.value || '';
  const hoyStr = new Date().toISOString().slice(0,10);

  if (desde && desde > hoyStr) {
    alert('La fecha desde no puede ser posterior a hoy.');
    return;
  }

  if (desde && hasta && hasta < desde) {
    alert('La fecha hasta no puede ser menor a la fecha desde.');
    return;
  }

  try {
    const resp = await fetch(API_PEDIDOS);
    if (!resp.ok) throw new Error("Error al obtener pedidos");
    const pedidos = await resp.json();
    const filtrados = filtrarPedidos(pedidos);
    pedPage = 1;
    renderPedidos(filtrados);
  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al cargar los pedidos.");
  }
}

function filtrarPedidos(pedidos) {
  const desde = document.getElementById('filtroFechaDesde')?.value || '';
  const hasta = document.getElementById('filtroFechaHasta')?.value || '';
  const nro = document.getElementById('filtroNro')?.value || '';
  const forma = document.getElementById('filtroFormaEnvio')?.value || '';
  const estado = (document.getElementById('filtroEstado')?.value || '').toLowerCase();
  const clienteTxt = (document.getElementById('filtroCliente')?.value || '').toLowerCase();

  let lista = Array.isArray(pedidos) ? pedidos.slice() : [];
  lista = lista.filter(p => {
    const f = new Date(p.fecha || p.Fecha);
    const fstr = f.toISOString().slice(0,10);
    if (desde && fstr < desde) return false;
    if (hasta && fstr > hasta) return false;
    if (nro && String(p.nroPedido ?? p.NroPedido) !== String(nro)) return false;
    if (forma && String(p.idFormaEnvio ?? p.IdFormaEnvio) !== String(forma)) return false;
    const est = String(p.estadoActual ?? p.EstadoActual ?? '').toLowerCase();
    if (estado && !est.includes(estado)) return false;
    const nom = [p.nombreCliente ?? p.NombreCliente, p.apellidoCliente ?? p.ApellidoCliente].filter(Boolean).join(' ').toLowerCase();
    const dni = String(p.nroDocCliente ?? p.NroDocCliente ?? '').toLowerCase();
    const usu = String(p.usuarioCliente ?? p.UsuarioCliente ?? '').toLowerCase();
    if (clienteTxt && !(nom.includes(clienteTxt) || dni.includes(clienteTxt) || usu.includes(clienteTxt))) return false;
    return true;
  });
  return lista;
}

function renderPedidos(pedidos) {
    const mostrarSoloActivos = $("#filtroActivos")?.checked;

    if (mostrarSoloActivos) {
        pedidos = pedidos.filter(p => (p.activo === true) || (p.activo === 1) || (String(p.activo).toLowerCase() === 'true'));
    }

    const tbody = document.getElementById("tbodyPedidos");
    const sinResultados = document.getElementById("sinResultados");
    tbody.innerHTML = "";

    pedidos = (Array.isArray(pedidos) ? pedidos.slice() : [])
        .sort((a, b) => {
            const na = Number(a.nroPedido ?? a.NroPedido ?? 0);
            const nb = Number(b.nroPedido ?? b.NroPedido ?? 0);
            return nb - na; // Descendente: más recientes primero
        });

    pedLast = pedidos;
    const psSel = document.getElementById('pedidosPageSize');
    if (psSel) pedPageSize = Number(psSel.value || 10);
    const start = (pedPage - 1) * pedPageSize;
    const pageItems = pedidos.slice(start, start + pedPageSize);

    pageItems.forEach(p => {
        const tr = document.createElement("tr");
        const activoFlag = (p.activo === true) || (p.activo === 1) || (String(p.activo).toLowerCase() === 'true');
        const activo = activoFlag ? 'Sí' : 'No';
        const nombreCompleto = [p.nombreCliente, p.apellidoCliente].filter(Boolean).join(' ');
        
        const estadoRaw = String(p.estadoActual ?? p.EstadoActual ?? '');
        const estadoActual = estadoRaw.trim().toLowerCase();
        
        // Solo deshabilitar si es explícitamente 'recibido'
        const estadoDisabled = estadoActual === 'recibido' ? 'disabled' : '';
        const estadoTitle = estadoDisabled ? ' title="Pedidos recibidos no pueden cambiar de estado"' : ' title="Cambiar estado"';
        
        tr.innerHTML = `
            <td>${p.nroPedido}</td>
            <td>${new Date(p.fecha).toLocaleString()}</td>
            <td class="d-none">${nombreCompleto || p.codCliente}</td> 
            <td>${p.nombreFormaEnvio ?? p.idFormaEnvio}</td>
            <td>${p.estadoActual ?? 'Sin estado'}</td>
            <td class="text-center">${activo}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-info action-sm" onclick="verPedido(${p.nroPedido})" title="Ver detalles">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning action-sm" onclick="editarPedido(${p.nroPedido})" title="Editar pedido">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary action-sm" ${estadoDisabled}${estadoTitle} onclick="cambiarEstado(${p.nroPedido})">
                    <i class="bi bi-arrow-repeat"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger action-sm" onclick="eliminarPedido(${p.nroPedido})" title="Dar de baja">
                    <i class="bi bi-trash"></i>
                </button>
            </td>`;
        tbody.appendChild(tr);
    });

    const info = document.getElementById('pedPageInfo');
    if (info) {
      const totalPages = Math.max(1, Math.ceil(pedidos.length / pedPageSize));
      info.textContent = `Página ${pedPage} de ${totalPages}`;
    }
}


function limpiarFiltros() {
  if ($("#filtroFecha")) $("#filtroFecha").value = "";
  if ($("#filtroCodCliente")) $("#filtroCodCliente").value = "";
  const fDesde = $("#filtroFechaDesde"); if (fDesde) fDesde.value = "";
  const fHasta = $("#filtroFechaHasta"); if (fHasta) fHasta.value = "";
  const fNro = $("#filtroNro"); if (fNro) fNro.value = "";
  const fForma = $("#filtroFormaEnvio"); if (fForma) fForma.value = "";
  const fEstado = $("#filtroEstado"); if (fEstado) fEstado.value = "";
  const fCliente = $("#filtroCliente"); if (fCliente) fCliente.value = "";
  cargarPedidos();
}

window.eliminarPedido = async function (nroPedido) {
    if (!confirm(`¿Estás seguro de que deseas dar de baja el Pedido #${nroPedido}? Esta acción es una baja lógica.`)) {
        return;
    }

    try {
        const resp = await fetch(`${API_PEDIDOS}/${nroPedido}`, {
            method: 'DELETE',
        });

        if (resp.ok) {
            alert(`Pedido #${nroPedido} dado de baja (lógica) correctamente.`);
            cargarPedidos();
        } else if (resp.status === 404) {
            alert(`Error: Pedido #${nroPedido} no encontrado.`);
        } else {
            const errorText = await resp.text();
            throw new Error(`Error ${resp.status}: ${errorText || 'Error desconocido del servidor'}`);
        }
    } catch (err) {
        console.error('Error en la baja lógica del pedido:', err);
        alert(`Ocurrió un error al dar de baja el pedido: ${err.message}`);
    }
};

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

function abrirFormularioNuevo() {
  modoFormulario = "crear";
  pedidoSeleccionado = null;
  
  limpiarFormularioPedido();
  toggleSoloLectura(false); // Habilitar campos
  const thAcc = document.getElementById('thAccionesDetalle');
  if (thAcc) thAcc.classList.remove('d-none');

  const titulo = $("#tituloModalPedido");
  if (titulo) titulo.textContent = "Nuevo pedido";
  const fechaInput = document.getElementById("fecha");
  if (fechaInput) {
    fechaInput.value = new Date().toISOString().slice(0, 16);
    fechaInput.disabled = true;
  }
  const hoy = new Date().toISOString().slice(0, 10);
  const fechaEnt = document.getElementById('fechaEntrega');
  if (fechaEnt) {
    fechaEnt.min = hoy;
    fechaEnt.value = hoy;
  }

  const grupoSel = document.getElementById('grupoSelectorCliente');
  const grupoCodDisp = document.getElementById('grupoCodigoClienteDisplay');
  const grupoNom = document.getElementById('grupoNombreCliente');
  const grupoApe = document.getElementById('grupoApellidoCliente');
  if (grupoSel) grupoSel.classList.remove('d-none');
  if (grupoCodDisp) grupoCodDisp.classList.remove('d-none');
  if (grupoNom) grupoNom.classList.add('d-none');
  if (grupoApe) grupoApe.classList.add('d-none');
  
  modalPedidoBS.show();
}

function abrirFormularioEdicion(pedido, soloLectura) {
  modoFormulario = soloLectura ? "ver" : "editar";
  pedidoSeleccionado = pedido.nroPedido;

  const titulo = $("#tituloModalPedido");
  if (titulo) {
    titulo.textContent = soloLectura ? `Ver Pedido #${pedido.nroPedido}` : `Editar Pedido #${pedido.nroPedido}`;
  }

  $("#nroPedido").value = pedido.nroPedido;
  $("#fecha").value = pedido.fecha ? new Date(pedido.fecha).toISOString().slice(0, 16) : "";
  document.getElementById("fecha").disabled = true;
  $("#fechaEntrega").value = pedido.fechaEntrega ? pedido.fechaEntrega.split('T')[0] : "";
  const hoy = new Date().toISOString().slice(0, 10);
  const fechaEnt = document.getElementById('fechaEntrega');
  if (fechaEnt) fechaEnt.min = hoy;
  const inputCliente = document.getElementById("codCliente");
  if (soloLectura) {
    const grupoCod = document.getElementById('grupoCodigoClienteDisplay');
    const grupoNom = document.getElementById('grupoNombreCliente');
    const grupoApe = document.getElementById('grupoApellidoCliente');
    const grupoSel = document.getElementById('grupoSelectorCliente');
    if (grupoSel) grupoSel.classList.add('d-none');
    if (grupoCod) grupoCod.classList.add('d-none');
    if (grupoNom) grupoNom.classList.remove('d-none');
    if (grupoApe) grupoApe.classList.remove('d-none');
    const nombre = pedido.nombreCliente ?? pedido.NombreCliente ?? "";
    const apellido = pedido.apellidoCliente ?? pedido.ApellidoCliente ?? "";
    const nomInput = document.getElementById('nombreCliente');
    const apeInput = document.getElementById('apellidoCliente');
    if (nomInput) nomInput.value = nombre;
    if (apeInput) apeInput.value = apellido;
  } else {
    const grupoSel = document.getElementById('grupoSelectorCliente');
    const grupoCod = document.getElementById('grupoCodigoClienteDisplay');
    const grupoNom = document.getElementById('grupoNombreCliente');
    const grupoApe = document.getElementById('grupoApellidoCliente');
    if (grupoSel) grupoSel.classList.remove('d-none');
    if (grupoCod) grupoCod.classList.remove('d-none');
    if (grupoNom) grupoNom.classList.add('d-none');
    if (grupoApe) grupoApe.classList.add('d-none');
    $("#codCliente").value = pedido.codCliente ?? "";
    $("#codClienteDisplay").value = pedido.codCliente ?? "";
    const nombreComp = `${pedido.apellidoCliente ?? pedido.ApellidoCliente ?? ''} ${pedido.nombreCliente ?? pedido.NombreCliente ?? ''}`.trim();
    $("#clienteNombre").value = nombreComp;
  }
  $("#idFormaEnvio").value = pedido.idFormaEnvio ?? "";
  $("#instrucciones").value = pedido.instruccionesAdicionales ?? "";

  const tbodyDetalles = $("#tbodyDetalles");
  if (tbodyDetalles) {
    tbodyDetalles.innerHTML = "";
    (pedido.detalles || []).forEach((det) => {
      const tr = document.createElement("tr");
      const libroSel = catalogoLibros.find(l => String(l.cod) === String(det.codLibro));
      const tituloSel = libroSel ? libroSel.titulo : '';
      if (soloLectura) {
        tr.innerHTML = `
          <td>
            <input type="text" class="form-control form-control-sm det-titulo" value="${tituloSel}" disabled>
            <input type="hidden" class="det-codLibro" value="${det.codLibro}">
          </td>
          <td><input type="number" class="form-control form-control-sm det-cantidad" value="${det.cantidad}" disabled></td>
          <td><input type="number" step="0.01" class="form-control form-control-sm det-precio" value="${det.precio}" disabled></td>`;
      } else {
        tr.innerHTML = `
          <td>
            <input type="text" class="form-control form-control-sm det-titulo" list="datalistLibros" value="${tituloSel}" placeholder="Buscar título..." required>
            <input type="hidden" class="det-codLibro" value="${det.codLibro}">
          </td>
          <td><input type="number" class="form-control form-control-sm det-cantidad" min="1" value="${det.cantidad}" required></td>
          <td><input type="number" step="0.01" class="form-control form-control-sm det-precio" value="${det.precio}" disabled></td>
          <td><button type="button" class="btn btn-sm btn-outline-danger btnQuitarDetalle"><i class=\"bi bi-x\"></i></button></td>`;
        const inpTitulo = tr.querySelector('.det-titulo');
        const inpCod = tr.querySelector('.det-codLibro');
        const inpPrecio = tr.querySelector('.det-precio');
        const inpCant = tr.querySelector('.det-cantidad');
        const aplicarLibro = () => {
          const val = (inpTitulo.value || '').toLowerCase();
          const libro = mapaTituloALibro.get(val);
          if (!libro) {
            inpCod.value = '';
            inpPrecio.value = '';
            inpCant.max = '';
            return;
          }
          inpCod.value = String(libro.cod);
          inpPrecio.value = String(libro.precio);
          inpCant.max = String(Math.max(0, libro.stock));
        };
        inpTitulo.addEventListener('change', aplicarLibro);
        inpTitulo.addEventListener('input', aplicarLibro);
        inpCant.addEventListener('input', () => {
          if (inpCant.max) {
            const max = Number(inpCant.max);
            if (Number(inpCant.value) > max) {
              inpCant.value = String(max);
              alert('La cantidad no puede superar el stock disponible.');
            }
          }
        });
        tr.querySelector(".btnQuitarDetalle").addEventListener("click", () => tr.remove());
      }
      
      tbodyDetalles.appendChild(tr);
    });
    limpiarFilasVaciasDetalles();
  }

  toggleSoloLectura(soloLectura);
  const thAcc = document.getElementById('thAccionesDetalle');
  if (thAcc) thAcc.classList.toggle('d-none', soloLectura);

  if (soloLectura) {
    const btnEditar = document.querySelector(`button[onclick="editarPedido(${pedido.nroPedido})"]`);
    const btnEstado = document.querySelector(`button[onclick="cambiarEstado(${pedido.nroPedido})"]`);
    const btnEliminar = document.querySelector(`button[onclick="eliminarPedido(${pedido.nroPedido})"]`);
    [btnEditar, btnEstado, btnEliminar].forEach(btn => {
      if (btn && !btn.classList.contains('d-none')) {
        btn.classList.add('d-none');
        botonesAccionesOcultos.push(btn);
      }
    });
  }

  modalPedidoBS.show();
}

function toggleSoloLectura(bloquear) {
    const campos = document.querySelectorAll("#formPedido input, #formPedido select, #formPedido textarea");
    campos.forEach(el => el.disabled = bloquear);

    const codDisp = document.getElementById('codClienteDisplay');
    if (codDisp) {
      codDisp.disabled = true;
    }

    const btnGuardar = $("#btnGuardarPedido");
    if (btnGuardar) {
        if (bloquear) btnGuardar.classList.add("d-none");
        else btnGuardar.classList.remove("d-none");
    }

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
  const nomInput = document.getElementById('nombreCliente');
  const apeInput = document.getElementById('apellidoCliente');
  if (nomInput) nomInput.value = "";
  if (apeInput) apeInput.value = "";
  const nombreSel = document.getElementById('clienteNombre');
  const codDisp = document.getElementById('codClienteDisplay');
  const codHidden = document.getElementById('codCliente');
  if (nombreSel) nombreSel.value = "";
  if (codDisp) codDisp.value = "";
  if (codHidden) codHidden.value = "";
}

function agregarFilaDetalle() {
  const tbody = $("#tbodyDetalles");
  if (!tbody) return;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <input type="text" class="form-control form-control-sm det-titulo" list="datalistLibros" placeholder="Buscar título..." required>
      <input type="hidden" class="det-codLibro">
    </td>
    <td><input type="number" class="form-control form-control-sm det-cantidad" min="1" value="1" required></td>
    <td><input type="number" step="0.01" class="form-control form-control-sm det-precio" disabled></td>
    <td><button type="button" class="btn btn-sm btn-outline-danger btnQuitarDetalle"><i class="bi bi-x"></i></button></td>
  `;
  const inpTitulo = tr.querySelector('.det-titulo');
  const inpCod = tr.querySelector('.det-codLibro');
  const inpPrecio = tr.querySelector('.det-precio');
  const inpCant = tr.querySelector('.det-cantidad');
  const aplicarLibro = () => {
    const val = (inpTitulo.value || '').toLowerCase();
    const libro = mapaTituloALibro.get(val);
    if (!libro) {
      inpCod.value = '';
      inpPrecio.value = '';
      inpCant.max = '';
      return;
    }
    inpCod.value = String(libro.cod);
    inpPrecio.value = String(libro.precio);
    inpCant.max = String(Math.max(0, libro.stock));
  };
  inpTitulo.addEventListener('change', aplicarLibro);
  inpTitulo.addEventListener('input', aplicarLibro);
  inpCant.addEventListener('input', () => {
    if (inpCant.max) {
      const max = Number(inpCant.max);
      if (Number(inpCant.value) > max) {
        inpCant.value = String(max);
        alert('La cantidad no puede superar el stock disponible.');
      }
    }
  });
  tr.querySelector(".btnQuitarDetalle").addEventListener("click", () => tr.remove());
  tbody.appendChild(tr);
}

async function onSubmitPedido(e) {
  e.preventDefault();
    console.log("-> Se ejecutó onSubmitPedido");
  if (modoFormulario === "ver") return;

  const hoyStr = new Date().toISOString().slice(0,10);
  const fechaEntregaVal = $("#fechaEntrega").value;
  if (fechaEntregaVal && fechaEntregaVal < hoyStr) {
    alert("La fecha de entrega no puede ser anterior a hoy.");
    return;
  }
  let pedidoBody;
  try {
    pedidoBody = armarBodyPedido();
  } catch (err) {
    alert(err.message);
    return;
  }

  if (!pedidoBody.codCliente || !pedidoBody.fechaEntrega) {
      alert("Por favor complete los campos obligatorios.");
      return;
  }
  if (!pedidoBody.detalles || pedidoBody.detalles.length === 0) {
      alert("Agregue al menos un libro al pedido.");
      return;
  }
  for (const det of pedidoBody.detalles) {
      if (!det.codLibro || !det.cantidad) {
          alert("Los campos de libro no pueden estar en blanco.");
          return;
      }
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
      if (!confirm("¿Seguro que quiere modificar el pedido?")) return;
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
  const fechaEntrega = $("#fechaEntrega").value;
  const codCliente = $("#codCliente").value;
  const idFormaEnvio = $("#idFormaEnvio").value;
  const instrucciones = $("#instrucciones").value;

  const detalles = [];
  document.querySelectorAll("#tbodyDetalles tr").forEach((tr) => {
    const codLibro = tr.querySelector(".det-codLibro").value;
    const cantidad = tr.querySelector(".det-cantidad").value;
    const titulo = tr.querySelector('.det-titulo')?.value || '';
    if (!titulo || !codLibro || !cantidad) {
      return;
    }
    const libro = catalogoLibros.find(l => String(l.cod) === String(codLibro));
    const precio = libro ? Number(libro.precio) : 0;
    if (libro && Number(cantidad) > Number(libro.stock)) {
      throw new Error(`La cantidad de "${libro.titulo}" supera el stock disponible.`);
    }
    detalles.push({
      codLibro: parseInt(codLibro),
      cantidad: parseInt(cantidad),
      precio: parseFloat(precio),
      nroPedido: nroPedido ? parseInt(nroPedido) : 0,
    });
  });

  const body = {
    nroPedido: nroPedido ? parseInt(nroPedido) : 0,
    fechaEntrega: fechaEntrega,
    instruccionesAdicionales: instrucciones,
    codCliente: parseInt(codCliente),
    idFormaEnvio: parseInt(idFormaEnvio),
    detalles: detalles,
  };

  return body;
}

window.cambiarEstado = async function (nroPedido) {
  if (!pedLast || pedLast.length === 0) {
    console.warn("cambiarEstado: No hay pedidos en memoria local (pedLast vacío).");
    return;
  }

  const pedido = pedLast.find(p => String(p.nroPedido ?? p.NroPedido) === String(nroPedido));
  
  if (!pedido) {
    console.error(`cambiarEstado: No se encontró el pedido #${nroPedido} en memoria.`);
    alert("No se pudo localizar el pedido. Intente recargar la página.");
    return;
  }

  const estadoRaw = String(pedido.estadoActual ?? pedido.EstadoActual ?? '');
  const estadoActual = estadoRaw.trim().toLowerCase();

  console.log(`Abriendo cambio de estado para Pedido #${nroPedido}. Estado actual: '${estadoRaw}' (normalizado: '${estadoActual}')`);

  if (estadoActual === 'recibido') {
    alert('Los pedidos recibidos no se pueden cambiar de estado.');
    return;
  }

  pedidoSeleccionado = nroPedido;
  const spanNro = document.getElementById("estadoNroPedido");
  if (spanNro) spanNro.textContent = nroPedido;
  
  const selectEstado = document.getElementById("nuevoEstado");
  if (selectEstado) selectEstado.value = "";

  if (modalEstadoBS) {
    modalEstadoBS.show();
  } else {
    console.error("cambiarEstado: modalEstadoBS no está inicializado.");
    const modalEl = document.getElementById('modalEstado');
    if (modalEl) {
        modalEstadoBS = new bootstrap.Modal(modalEl);
        modalEstadoBS.show();
    } else {
        alert("Error interno: No se encuentra el modal de estado.");
    }
  }
};

async function guardarCambioEstado() {
  const nuevoEstadoId = $("#nuevoEstado").value;

  if (!nuevoEstadoId) {
    alert("Debe seleccionar un nuevo estado.");
    return;
  }

  if (!confirm('¿Seguro desea actualizar el estado?')) {
    return;
  }

  const body = {
    nuevoEstadoId: parseInt(nuevoEstadoId),
    observaciones: ""
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

async function eliminarPedido(nroPedido) {
    if (!confirm(`¿Estás seguro de que deseas dar de baja el Pedido #${nroPedido}? Esta acción es una baja lógica.`)) {
        return;
    }

    try {
        const resp = await fetch(`${API_PEDIDOS}/${nroPedido}`, {
            method: 'DELETE',
        });

        if (resp.ok) {
            alert(`Pedido #${nroPedido} dado de baja (lógica) correctamente.`);
            cargarPedidos();
        } else if (resp.status === 404) {
            alert(`Error: Pedido #${nroPedido} no encontrado.`);
        } else {
            const errorText = await resp.text();
            throw new Error(`Error ${resp.status}: ${errorText || 'Error desconocido del servidor'}`);
        }
    } catch (err) {
        console.error('Error en la baja lógica del pedido:', err);
        alert(`Ocurrió un error al dar de baja el pedido: ${err.message}`);
    }
}

function limpiarFilasVaciasDetalles() {
  const tbody = document.getElementById("tbodyDetalles");
  if (!tbody) return;
  Array.from(tbody.querySelectorAll("tr")).forEach((tr) => {
    const cod = tr.querySelector(".det-codLibro")?.value;
    const cant = tr.querySelector(".det-cantidad")?.value;
    const precio = tr.querySelector(".det-precio")?.value;
    const vacio = (!cod || cod === "0") && (!cant || cant === "0") && (!precio || precio === "0");
    if (vacio) tr.remove();
  });
}
async function cargarCatalogoLibros() {
  try {
    const resp = await fetch(`${API_LIBROS}?activo=true`);
    if (!resp.ok) throw new Error('No se pudo cargar catálogo de libros');
    const data = await resp.json();
    catalogoLibros = Array.isArray(data) ? data.map(l => ({
      cod: Number(l.codigo ?? l.Codigo ?? l.codLibro ?? l.CodLibro ?? 0),
      titulo: String(l.titulo ?? l.Titulo ?? ''),
      precio: Number(l.precio ?? l.Precio ?? 0),
      stock: Number(l.stock ?? l.Stock ?? 0)
    })) : [];
    mapaTituloALibro = new Map();
    const dl = document.getElementById('datalistLibros');
    if (dl) {
      dl.innerHTML = '';
      catalogoLibros.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.titulo;
        dl.appendChild(opt);
        const key = item.titulo.toLowerCase();
        if (!mapaTituloALibro.has(key)) {
          mapaTituloALibro.set(key, item);
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
}
async function cargarCatalogoClientes() {
  try {
    const resp = await fetch(`${API_CLIENTES}`);
    if (!resp.ok) throw new Error('No se pudo cargar catálogo de clientes');
    const data = await resp.json();
    catalogoClientes = Array.isArray(data) ? data.map(c => ({
      cod: Number(c.codigo ?? c.Codigo ?? 0),
      nombre: String(c.nombre ?? c.Nombre ?? '')
    })) : [];
    mapaNombreCliente = new Map();
    const dl = document.getElementById('datalistClientes');
    if (dl) {
      dl.innerHTML = '';
      catalogoClientes.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.nombre;
        dl.appendChild(opt);
        const key = item.nombre.toLowerCase();
        if (!mapaNombreCliente.has(key)) mapaNombreCliente.set(key, item);
      });
    }
    const inp = document.getElementById('clienteNombre');
    const codDisp = document.getElementById('codClienteDisplay');
    const codHidden = document.getElementById('codCliente');
    const aplicar = () => {
      const val = (inp?.value || '').toLowerCase();
      const cli = mapaNombreCliente.get(val);
      if (codDisp) codDisp.value = cli ? String(cli.cod) : '';
      if (codHidden) codHidden.value = cli ? String(cli.cod) : '';
    };
    inp?.addEventListener('input', aplicar);
    inp?.addEventListener('change', aplicar);
  } catch (e) {
    console.error(e);
  }
}