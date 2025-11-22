import { API_BASE } from "./config.js";



const $ = (sel) => document.querySelector(sel);
const fmtCurrency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

let vista = "tabla";
let ultimoListado = [];
const catalogos = {
  autores: [],
  categorias: [],
  generos: [],
  idiomas: [],
  editoriales: []
};
const selecciones = {
  autores: [],
  categorias: [],
  generos: [],
  idiomas: [],
  editoriales: []
};
const setCargando = (on) => $('#estadoBusqueda').classList.toggle('d-none', !on);
const show = (id, v) => $(id).classList.toggle('d-none', !v);

function applyTheme(theme) {
  document.body.setAttribute('data-bs-theme', theme);

  // Usamos los nuevos IDs del Navbar unificado
  const icon = document.getElementById('theme-icon');
  const btnTema = document.getElementById('theme-toggle');

  if (icon) {
    if (theme === 'dark') {
        icon.className = 'bi bi-moon-stars-fill'; 
    } else {
        icon.className = 'bi bi-sun-fill';
    }
  }

  if (btnTema) {
    btnTema.classList.toggle('btn-secondary', theme === 'light');
    btnTema.classList.toggle('btn-outline-warning', theme === 'dark');
  }

  localStorage.setItem('tema', theme);
}

function toggleTheme() {
  const current = document.body.getAttribute('data-bs-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

function buildParams() {
  const p = new URLSearchParams();
  const titulo = $('#fTitulo').value.trim();
  const autor = $('#fAutor').value.trim();
  const categoria = $('#fCategoria').value.trim();
  const idioma = $('#fIdioma').value.trim();
  const genero = $('#fGenero').value.trim();
  
  const mostrarTodos = $('#filtroActivos').checked; 

  if (titulo)    p.append('titulo', titulo);
  if (autor)     p.append('autor', autor);
  if (categoria) p.append('categoria', categoria);
  if (idioma)    p.append('idioma', idioma);
  if (genero)    p.append('genero', genero);

  if (!mostrarTodos) {
    p.append('activo', 'true');
  }

  return p.toString();
}

function esActivo(l) {
  const v = l.activo ?? l.Activo ?? l.estado ?? l.Estado ?? l.vigente ?? l.Vigente;
  if (v !== undefined) return v === true || v === 1 || v === 'true' || v === '1' || v === 'Activo';
  const b = l.baja_logica ?? l.BajaLogica ?? l.baja ?? l.Baja;
  if (b !== undefined) return !(b === true || b === 1 || b === 'true' || b === '1');
  return true;
}



async function buscarLibros(e) {
  if (e) e.preventDefault();
  setCargando(true);

  try {
    const params = buildParams();
const url = `${API_BASE}/api/libro/filtrar?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

const data = await res.json();
    ultimoListado = Array.isArray(data) ? data : [];

    const mostrarTodos = $('#filtroActivos')?.checked ?? false;
    if (!mostrarTodos) {
      ultimoListado = ultimoListado.filter(esActivo);
    }

    ultimoListado.sort((a, b) => {
        const idA = a.cod_libro ?? a.CodLibro ?? a.codigo ?? a.Codigo ?? 0;
        const idB = b.cod_libro ?? b.CodLibro ?? b.codigo ?? b.Codigo ?? 0;
        
        return idB - idA;
    });

    render();

  } catch (err) {
    console.error('Error buscando libros', err);
    ultimoListado = [];
    render();
  } finally {
    setCargando(false);
  }
}


function render() {
  const hay = ultimoListado.length > 0;
  show('#sinResultados', !hay);
  if (vista === 'tabla') {
    show('#contenedorTabla', true);
    renderTabla(ultimoListado);
  } else {
    show('#contenedorTabla', false);
  }
}

async function cargarCatalogos() {
  try {
    const titulo = document.getElementById("filtroTitulo")?.value || "";
    const mostrarTodos = document.getElementById("filtroActivos")?.checked ?? false; 
    
    const activoParam = mostrarTodos ? "" : "&activo=true"; 

    const url = `${API_BASE}/api/libro/filtrar?titulo=${encodeURIComponent(titulo)}${activoParam}`;

    const endpoints = ["autores", "categorias", "generos", "idiomas", "editoriales"];
    const solicitudes = endpoints.map(ep => fetch(`${API_BASE}/api/catalogos/${ep}`));
    
    const respuestas = await Promise.all(solicitudes);
    const datos = await Promise.all(respuestas.map(res => res.ok ? res.json() : []));

    catalogos.autores = datos[0] ?? [];
    catalogos.categorias = datos[1] ?? [];
    catalogos.generos = datos[2] ?? [];
    catalogos.idiomas = datos[3] ?? [];
    catalogos.editoriales = datos[4] ?? [];

    console.log("Catálogos cargados:", catalogos);

    const response = await fetch(url); // Aunque esta línea no afecta la carga de catálogos, la mantengo si tiene algún propósito lateral.
  } catch (err) {
    console.error("Error al cargar catálogos:", err);
  }
}



function renderCatalogoSelects() {
  renderDropdown('autores', catalogos.autores);
  renderDropdown('categorias', catalogos.categorias);
  renderDropdown('generos', catalogos.generos);
  popularSelect('#mIdioma', catalogos.idiomas, { tipo: 'idiomas', placeholder: 'Seleccioná un idioma', incluyeVacio: true });
popularSelect('#mEditorial', catalogos.editoriales, { tipo: 'editoriales', placeholder: 'Seleccioná una editorial', incluyeVacio: true });

}






function popularSelect(selector, items, { tipo, placeholder = 'Seleccioná una opción', incluyeVacio = false } = {}) {
  const select = $(selector);
  if (!select) return;

  const fragment = document.createDocumentFragment();

  if (!select.multiple && incluyeVacio) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    fragment.appendChild(opt);
  }

  items.forEach(item => {
    const { id, nombre } = extractIdAndName(tipo, item);
    if (!idValido(id)) return;

    const option = document.createElement('option');
    option.value = id;
    option.textContent = nombre;
    fragment.appendChild(option);
  });

  select.innerHTML = '';   // limpiar antes
  select.appendChild(fragment);
}





function setSelectValues(selector, values) {
  const select = $(selector);
  if (!select) return;
  const normalizedValues = Array.isArray(values)
    ? values.map((v) => String(v))
    : (values ? [String(values)] : []);
  const valueSet = new Set(normalizedValues);

  Array.from(select.options).forEach((opt) => {
    opt.selected = valueSet.has(opt.value);
  });

  if (!select.multiple && normalizedValues.length === 0 && select.options.length > 0) {
    select.selectedIndex = 0;
  }
}

function obtenerValoresSelect(selector) {
  const select = $(selector);
  if (!select) return [];
  return Array.from(select.selectedOptions)
    .map((opt) => Number(opt.value))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function obtenerIdsDesdeLibro(libro, clave) {
  if (!libro) return [];
  if (libro[clave] !== undefined) return libro[clave];
  const alt = clave.charAt(0).toUpperCase() + clave.slice(1);
  return libro[alt] ?? [];
}

function setSeleccionDesdeLibro(tipo, ids) {
    const todos = catalogos[tipo] || [];
    // Normaliza los IDs del libro a String para una comparación consistente
    const normalizados = (ids || []).map((id) => String(id)).filter((id) => id && id.length > 0);
    const normalizadosSet = new Set(normalizados);

    let seleccionados = todos
        // 1. Mapear cada ítem del catálogo usando la función de ayuda
        .map((item) => extractIdAndName(tipo, item)) 
        // 2. Filtrar solo aquellos cuyos IDs coinciden con los del libro
        .filter((item) => item.id && normalizadosSet.has(item.id)) 
        .map((item) => ({ id: item.id, nombre: item.nombre }));
        
    selecciones[tipo] = seleccionados;
    actualizarResumen(tipo);
}
function toggleDropdownLectura(tipo, soloLectura) {
  const boton = document.getElementById(`dropdown${capitalizar(tipo)}`);
  if (boton) boton.disabled = soloLectura;
  const checkboxes = document.querySelectorAll(`#lista${capitalizar(tipo)} input[type="checkbox"]`);
  checkboxes.forEach((chk) => { chk.disabled = soloLectura; });
}

function renderDropdown(tipo, items, config = {}) {
    const lista = $(`#lista${capitalizar(tipo)}`);
    if (!lista) return;
    lista.innerHTML = '';

    items.forEach((item) => {
        // 🔑 CAMBIO CLAVE: Usa la función de ayuda para obtener los valores
        const { id, nombre } = extractIdAndName(tipo, item);
        
        if (!id || id === 'null' || id === 'undefined') return; // Si no hay ID válido, no se renderiza

        const li = document.createElement('li');
        li.innerHTML = `
          <label class="dropdown-item d-flex align-items-center gap-2">
            <input type="checkbox" class="form-check-input me-2" value="${id}" ${config.multiple === false ? 'name="single-select"' : ''}>
            <span>${nombre}</span>
          </label>`;
        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', () => {
            // Asegúrate de que el id sea String
            toggleSeleccion(tipo, id, nombre, checkbox.checked, config.multiple === false);
            if (config.multiple === false && checkbox.checked) {
                // Si es selección única (como idiomas, aunque ahora se usa popularSelect), desmarca los otros
                lista.querySelectorAll('input[type="checkbox"]').forEach((chk) => {
                    if (chk !== checkbox) {
                        chk.checked = false;
                    }
                });
            }
        });
        lista.appendChild(li);
    });

    actualizarResumen(tipo);
}

// CÓDIGO A PEGAR/REEMPLAZAR:
function toggleSeleccion(tipo, id, nombre, checked, esUnico = false) {
    // Convierte el ID a String para consistencia con el valor del checkbox (que es String)
    const strId = String(id); 

    if (esUnico) {
        selecciones[tipo] = checked ? [{ id: strId, nombre }] : [];
    } else {
        const arreglo = selecciones[tipo];
        if (!Array.isArray(arreglo)) return;

        // Compara usando el ID como String
        const existe = arreglo.find((item) => String(item.id) === strId);
        if (checked && !existe) {
            arreglo.push({ id: strId, nombre });
        } else if (!checked && existe) {
            selecciones[tipo] = arreglo.filter((item) => String(item.id) !== strId);
        }
    }
    actualizarResumen(tipo);
}

function actualizarResumen(tipo) {
  const resumen = $(`#resumen${capitalizar(tipo)}`);
  const boton = document.getElementById(`dropdown${capitalizar(tipo)}`);
  const textoSpan = boton?.querySelector('.dropdown-text');
  if (!resumen) return;
  const datos = selecciones[tipo];
  const placeholder = obtenerPlaceholder(tipo);
  const texto = Array.isArray(datos) && datos.length > 0
    ? datos.map((x) => x.nombre).join(', ')
    : placeholder;

  resumen.textContent = texto;
  if (textoSpan) {
    textoSpan.textContent = texto;
    textoSpan.classList.toggle('text-muted', !Array.isArray(datos) || datos.length === 0);
  } else if (boton) {
    boton.textContent = texto;
    boton.classList.toggle('text-muted', !Array.isArray(datos) || datos.length === 0);
  }

  const lista = $(`#lista${capitalizar(tipo)}`);
  if (lista) {
    const ids = new Set((selecciones[tipo] || []).map((item) => String(item.id)));
    lista.querySelectorAll('input[type="checkbox"]').forEach((chk) => {
      chk.checked = ids.has(chk.value);
    });
  }
}

function obtenerPlaceholder(tipo) {
  switch (tipo) {
    case 'autores': return 'Seleccioná autor/es';
    case 'categorias': return 'Seleccioná categoría/s';
    case 'generos': return 'Seleccioná género/s';
    case 'idiomas': return 'Seleccioná un idioma';
    default: return 'Seleccioná una opción';
  }
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function renderTabla(list) {
    const tbody = $('#tblLibros tbody');
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-4">No se encontraron libros.</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(l => {
        const titulo = l.titulo ?? l.Titulo ?? '';
        const idioma = l.idioma ?? l.Idioma ?? '';
        const precio = l.precio ?? l.Precio ?? 0;
        const stock  = l.stock ?? l.Stock ?? 0;
        const autores = (l.autores ?? l.Autores ?? []).join?.(', ') || (l.autor ?? '');
        const cod = l.cod_libro ?? l.CodLibro ?? l.codigo ?? l.Codigo ?? '';
        const activo = esActivo(l) ? 'Sí' : 'No';

        return `
            <tr data-id="${cod}">
                <td>${titulo}</td>
                <td>${autores}</td>
                <td>${idioma}</td>
                <td class="text-end">${fmtCurrency.format(precio)}</td>
                <td class="text-center">${stock}</td>
                <td class="text-center">${activo}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-info" title="Ver" data-action="ver" data-id="${cod}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" title="Editar" data-action="editar" data-id="${cod}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Dar de baja" data-action="eliminar" data-id="${cod}">
                        <i class="bi bi-trash"></i> 
                    </button>
                </td>
            </tr>`;
    }).join('');
}

let bsModal;
function abrirModal(modo, libro = null) {
  const title = modo === 'alta' ? 'Nuevo libro'
              : (modo === 'edicion' ? 'Editar libro'
              : 'Detalle de libro');

  $('#modalTitulo').textContent = title;

  $('#btnEliminar').classList.toggle('d-none', modo !== 'edicion');

  const soloLectura = (modo === 'detalle');
  ['#mTitulo','#mPrecio','#mStock','#mIdioma', '#mEditorial'] 
    .forEach(sel => { const campo = $(sel); if (campo) campo.disabled = soloLectura; });
  ['autores','categorias','generos'].forEach(tipo => toggleDropdownLectura(tipo, soloLectura));

  $('#btnGuardar').classList.toggle('d-none', soloLectura);

  $('#mId').value = libro?.cod_libro ?? libro?.CodLibro ?? libro?.codigo ?? libro?.Codigo ?? '';
  $('#mTitulo').value    = libro?.titulo ?? libro?.Titulo ?? '';
  $('#mPrecio').value    = libro?.precio ?? libro?.Precio ?? 0;
  $('#mStock').value     = libro?.stock ?? libro?.Stock ?? 0;

const mIsbn = $('#mISBN');
if (mIsbn) mIsbn.value = libro?.isbn ?? libro?.Isbn ?? '';

const mDescripcion = $('#mDescripcion');
if (mDescripcion) mDescripcion.value = libro?.descripcion ?? libro?.Descripcion ?? '';

const mFecha = $('#mFechaLanzamiento');
if (mFecha) mFecha.value = libro?.fecha_lanzamiento ?? libro?.FechaLanzamiento ?? '';

  setSeleccionDesdeLibro('autores', obtenerIdsDesdeLibro(libro, 'autoresIds'));
  setSeleccionDesdeLibro('categorias', obtenerIdsDesdeLibro(libro, 'categoriasIds'));
  setSeleccionDesdeLibro('generos', obtenerIdsDesdeLibro(libro, 'generosIds'));
  const idiomaSeleccionado = libro?.idIdioma ?? libro?.IdIdioma ?? '';
  setSelectValues('#mIdioma', idiomaSeleccionado ? [idiomaSeleccionado] : []);
const editorialSeleccionada = libro?.idEditorial ?? libro?.IdEditorial ?? '';
  setSelectValues('#mEditorial', editorialSeleccionada ? [editorialSeleccionada] : []);
  bsModal ??= new bootstrap.Modal($('#modalLibro'));
  bsModal.show();

  $('#formABM').onsubmit = (e) => {
    e.preventDefault();
    if (modo === 'alta') return guardarAlta();
    if (modo === 'edicion') return guardarEdicion($('#mId').value);
  };

  $('#btnEliminar').onclick = () => eliminarLibro($('#mId').value);
}


async function guardarAlta() {
  const payload = tomarPayload();
  const res = await fetch(`${API_BASE}/api/libro`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  
  if (!res.ok) return alert('No se pudo crear el libro');

  const libroNuevo = await res.json(); 

  bsModal.hide(); 
  
  ultimoListado.unshift(libroNuevo);

  render(); 
}

async function guardarEdicion(id) {
  const payload = tomarPayload();
  const res = await fetch(`${API_BASE}/api/libro/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) return alert('No se pudo actualizar el libro');
  bsModal.hide(); await buscarLibros();
}


function tomarPayload() {
  const idiomaSeleccionado = obtenerValoresSelect('#mIdioma')[0] ?? 0;
  const editorialSeleccionada = obtenerValoresSelect('#mEditorial')[0] ?? 0;

  const getVal = (sel) => {
    const el = $(sel);
    return el ? el.value.trim() : "";
  };

  const getNum = (sel) => {
    const el = $(sel);
    return el ? Number(el.value) : 0;
  };

  return {
    titulo: getVal('#mTitulo'),
    idsAutores: selecciones.autores.map((item) => item.id),
    autores: [],
    
    idIdioma: idiomaSeleccionado,
    idioma: null,
    
    idEditorial: editorialSeleccionada,
    editorial: null,
    
    idsGeneros: selecciones.generos.map((item) => item.id),
    generos: [],
    
    idsCategorias: selecciones.categorias.map((item) => item.id),
    categorias: [],
    
    precio: getNum('#mPrecio'),
    stock: getNum('#mStock'),

    isbn: getVal('#mISBN'),
    descripcion: getVal('#mDescripcion'),
    fechaLanzamiento: getVal('#mFechaLanzamiento'),
  };
}


$('#btnBuscar').addEventListener('click', buscarLibros);
$('#btnLimpiar').addEventListener('click', () => {
  ['#fTitulo','#fAutor','#fCategoria','#fIdioma','#fGenero']
    .forEach(s => $(s).value = '');
  buscarLibros();
});
$('#btnABMAlta').addEventListener('click', () => abrirModal('alta'));

$('#vistaTabla').addEventListener('change', () => { vista='tabla'; render(); });

$('#btnTema')?.addEventListener('click', toggleTheme);

document.addEventListener('DOMContentLoaded', async () => {
  const temaGuardado = localStorage.getItem('tema');
  const temaInicial = temaGuardado
    || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(temaInicial);

  try {
    const raw = localStorage.getItem('usuario');
    if (raw) {
      const u = JSON.parse(raw);
      const nombre = u.nombre || u.Nombre || u.nombreUsuario || u.NombreUsuario || u.Usuario || 'Usuario';
      const apellido = u.apellido || u.Apellido || '';
      
      const userGreetingText = document.getElementById('user-greeting-text');
      if (userGreetingText) {
          userGreetingText.textContent = `👤 Hola, ${nombre} ${apellido}`;
      }
    }
  } catch (e) {
    console.warn('No se pudo leer el usuario de localStorage', e);
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('usuario');
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    });
  }

  document.querySelector('#formLibros')
      .addEventListener('submit', buscarLibros);

  document.querySelector('#filtroActivos')
      .addEventListener('change', buscarLibros);
});


function extractIdAndName(tipo, item) {
    let id;
    let nombre;

    switch (tipo) {
        case 'autores':
            id = item.id_autor ?? item.IdAutor ?? item.id ?? item.Id;
            nombre = item.nombre ?? item.Nombre ?? '';
            break;
        case 'categorias':
            id = item.id_categoria ?? item.IdCategoria ?? item.id ?? item.Id;
            nombre = item.categoria ?? item.Categoria ?? item.nombre ?? item.Nombre ?? '';
            break;
        case 'generos':
            id = item.id_genero ?? item.IdGenero ?? item.id ?? item.Id;
            nombre = item.genero ?? item.Genero ?? item.nombre ?? item.Nombre ?? '';
            break;
        case 'idiomas':
            id = item.id_idioma ?? item.IdIdioma ?? item.id ?? item.Id;
            nombre = item.idioma ?? item.Idioma ?? item.nombre ?? item.Nombre ?? '';
            break;

        case 'editoriales':
            id = item.id_editorial ?? item.IdEditorial ?? item.id ?? item.Id;
            nombre = item.editorial ?? item.Editorial ?? item.nombre ?? item.Nombre ?? '';
            break;

        default:
            id = item.id ?? item.Id;
            nombre = item.nombre ?? item.Nombre ?? '';
    }
    return { id: String(id), nombre: nombre };
} 

function idValido(id) {
    if (id === null || id === undefined) return false;
    const s = String(id).trim();
    return s !== "" && s !== "null" && s !== "undefined";
}

async function eliminarLibro(id) {
    if (!confirm(`¿Estás seguro de que deseas dar de baja el libro con código ${id}?`)) {
        return;
    }

    if (bsModal) {
        bsModal.hide();
    }
    setCargando(true);

    try {
        const res = await fetch(`${API_BASE}/api/libro/${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            alert(`Libro ${id} dado de baja (lógica) correctamente.`);
            await buscarLibros();
        } else {
            const errorText = await res.text();
            alert(`Error al dar de baja el libro ${id}. Status: ${res.status}. Mensaje: ${errorText || 'Error desconocido'}`);
        }
    } catch (err) {
        console.error('Error en la baja lógica:', err);
        alert('Error de red o interno al intentar dar de baja el libro.');
    } finally {
        setCargando(false);
    }
}

document.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action][data-id]');
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;

    if (action === 'ver' || action === 'editar') {
        const libro = ultimoListado.find(l => {
            const cod = l.cod_libro ?? l.CodLibro ?? l.codigo ?? l.Codigo;
            return String(cod) === String(id);
        });
        if (libro) {
            abrirModal(action === 'ver' ? 'detalle' : 'edicion', libro);
        } else {
            alert(`No se encontró el libro con código ${id}`);
        }
    } else if (action === 'eliminar') {
        await eliminarLibro(id);
    }
});
