"use strict";

const DEFAULT_API_BASE = "http://localhost:5157";
const FALLBACK_API_BASES = [
    "https://localhost:7154",
    "http://localhost:7154",
    "https://localhost:5157"
];

const currencyFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
});
const numberFormatter = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0
});
const percentFormatter = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
});

let paymentChartInstance = null;
let authorsChartInstance = null;
let dashboardLoading = false;
let ultimoResumenDashboard = null;
let ultimaActualizacion = null;

document.addEventListener("DOMContentLoaded", () => {
    inicializarBotonRefresco();
    inicializarBotonRecargaNavbar();
    
    cargarDashboard();
    
    const temaGuardado = localStorage.getItem('tema');
    if (temaGuardado === 'light') temaClaro();
    else temaOscuro();

    const btnTema = document.getElementById("theme-toggle"); // Nuevo ID
    if (btnTema) {
        btnTema.addEventListener("click", cambiarTema);
    }

    cargarUsuario();
    
    inicializarFiltros();
});

function inicializarFiltros() {
    const filtroRango = document.getElementById('filtroRango');
    const divFechaDesde = document.getElementById('divFechaDesde');
    const divFechaHasta = document.getElementById('divFechaHasta');
    const btnAplicarFiltro = document.getElementById('btnAplicarFiltro');

    if (filtroRango) {
        filtroRango.addEventListener('change', () => {
            if (filtroRango.value === 'custom') {
                divFechaDesde.classList.remove('d-none');
                divFechaHasta.classList.remove('d-none');
            } else {
                divFechaDesde.classList.add('d-none');
                divFechaHasta.classList.add('d-none');
            }
        });
    }

    if (btnAplicarFiltro) {
        btnAplicarFiltro.addEventListener('click', () => {
            cargarDashboard();
        });
    }
}

function obtenerParametrosFiltro() {
    const filtroRango = document.getElementById('filtroRango');
    if (!filtroRango) return 'meses=3';

    const valor = filtroRango.value;
    
    if (valor === 'custom') {
        const desde = document.getElementById('fechaDesde').value;
        const hasta = document.getElementById('fechaHasta').value;
        if (desde && hasta) {
            return `fechaDesde=${desde}&fechaHasta=${hasta}`;
        }
        // Si faltan fechas, fallback a 3 meses
        return 'meses=3'; 
    }
    
    if (valor === 'last_week') {
        const hoy = new Date();
        const hace7dias = new Date();
        hace7dias.setDate(hoy.getDate() - 7);
        // Formato YYYY-MM-DD
        const fDesde = hace7dias.toISOString().split('T')[0];
        const fHasta = hoy.toISOString().split('T')[0];
        return `fechaDesde=${fDesde}&fechaHasta=${fHasta}`;
    }

    if (valor === 'last_month') return 'meses=1';
    
    // Para valores numéricos (3, 6, 12)
    return `meses=${valor}`;
}

function actualizarTextosFiltro() {
    const filtroRango = document.getElementById('filtroRango');
    if (!filtroRango) return;
    
    let texto = filtroRango.options[filtroRango.selectedIndex].text;
    if (filtroRango.value === 'custom') {
        const desde = document.getElementById('fechaDesde').value;
        const hasta = document.getElementById('fechaHasta').value;
        if(desde && hasta) texto = `Del ${desde} al ${hasta}`;
    } else if (filtroRango.value === 'last_week') {
        texto = "Última semana";
    }

    document.querySelectorAll('.card-header .text-secondary.small').forEach(el => {
        // Evitar cambiar textos que no son del filtro (si hubiera otros)
        // En este caso asumimos que los headers de cards en dashboard son para el filtro
        if (el.textContent.includes('Últim') || el.textContent.includes('Del') || el.textContent.includes('Personalizado')) {
             el.textContent = texto;
        }
    });
}


function inicializarBotonRefresco() {
    const boton = document.getElementById("refreshDashboardBtn");
    if (!boton) return;

    boton.addEventListener("click", async (event) => {
        event.preventDefault();
        await descargarResumenDashboard();
    });
}

function inicializarBotonRecargaNavbar() {
    const boton = document.getElementById("navbarReloadBtn");
    if (!boton) return;

    boton.addEventListener("click", () => {
        boton.disabled = true;
        boton.setAttribute("aria-busy", "true");
        window.location.reload();
    });
}


function cargarUsuario() {
    const rawUser = localStorage.getItem("usuario");
    
    const userGreetingText = document.getElementById('user-greeting-text');
    const logoutBtn = document.getElementById("btn-logout");

    if (!rawUser) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const usuario = JSON.parse(rawUser);
        const nombre = usuario.nombre || usuario.Nombre || usuario.NombreUsuario || "Usuario";
        const apellido = usuario.apellido || usuario.Apellido || "";

        if (userGreetingText) {
            userGreetingText.textContent = `👤 Hola, ${nombre} ${apellido}`;
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('usuario');
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            });
        }

    } catch (error) {
        console.error("Error al leer el usuario del localStorage", error);
        localStorage.removeItem('usuario');
        window.location.href = 'login.html';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarUsuario();
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', cambiarTema);
    }
});

const actualizarIcono = (tema) => {
    const icono = document.getElementById('theme-icon');
    if (!icono) return;

    if (tema === 'dark') {
        icono.classList.remove('bi-sun-fill');
        icono.classList.add('bi-moon-stars-fill');
    } else {
        icono.classList.remove('bi-moon-stars-fill');
        icono.classList.add('bi-sun-fill');
    }
};

const temaClaro = () => {
    document.body.setAttribute('data-bs-theme', 'light');
    actualizarIcono('light');
    
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.classList.remove('btn-outline-warning');
        btn.classList.add('btn-secondary');
    }
};

const temaOscuro = () => {
    document.body.setAttribute('data-bs-theme', 'dark');
    actualizarIcono('dark');

    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-outline-warning');
    }
};

const cambiarTema = () => {
    const temaActual = document.body.getAttribute('data-bs-theme');
    const nuevoTema = temaActual === 'light' ? 'dark' : 'light';
    
    if (nuevoTema === 'light') temaClaro();
    else temaOscuro();

    localStorage.setItem('tema', nuevoTema);
    
    actualizarEstilosGraficos(); 
};

async function cargarDashboard() {
    if (dashboardLoading) {
        return;
    }

    dashboardLoading = true;
    actualizarTextosFiltro();
    toggleRefreshButtonState(true, "Cargando datos...");
    mostrarPlaceholdersIniciales();

    const endpoints = obtenerEndpoints();
    let datos = null;
    let ultimoError = null;

    try {
        for (const endpoint of endpoints) {
            try {
                const respuesta = await fetch(endpoint);
                if (!respuesta.ok) {
                    throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
                }
                datos = await respuesta.json();
                console.info(`[Dashboard] Datos cargados desde ${endpoint}`);
                break;
            } catch (error) {
                ultimoError = error;
                console.warn(`[Dashboard] Falló la carga desde ${endpoint}:`, error);
            }
        }

        if (!datos) {
            throw ultimoError ?? new Error("No se pudo contactar a la API del dashboard.");
        }

        ultimoResumenDashboard = datos;
        ultimaActualizacion = new Date();
        actualizarCabecera(ultimaActualizacion);
        renderizarAutores(datos.autores);
        renderizarEnvios(datos.envios);
        renderizarGraficoPagos(datos.pagos);
        renderizarResumenPagos(datos.pagos);
    } catch (error) {
        console.error("No se pudo cargar la información del dashboard:", error);
        renderizarErrorAutores("No se pudieron obtener los autores más pedidos.");
        renderizarErrorEnvios("No se pudieron obtener los tipos de envío.");
        renderizarErrorPagos("No se pudo obtener la facturación por forma de pago.");
        ultimoResumenDashboard = null;
        ultimaActualizacion = null;
    } finally {
        dashboardLoading = false;
        toggleRefreshButtonState(false);
    }
}

function obtenerEndpoints() {
    const endpoints = [];
    const configBase = window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl;
    const params = obtenerParametrosFiltro();

    if (configBase) {
        endpoints.push(`${configBase.replace(/\/$/, "")}/api/dashboard/resumen?${params}`);
    }

    endpoints.push(`${DEFAULT_API_BASE.replace(/\/$/, "")}/api/dashboard/resumen?${params}`);

    FALLBACK_API_BASES.forEach((base) => {
        const url = `${base.replace(/\/$/, "")}/api/dashboard/resumen?${params}`;
        if (!endpoints.includes(url)) {
            endpoints.push(url);
        }
    });

    return endpoints;
}

function mostrarPlaceholdersIniciales() {
    toggleEstadoGraficoAutores(true, "Cargando datos...");
    renderizarErrorEnvios("Cargando datos...");
    toggleEstadoGraficoPagos(true, "Cargando datos...");
    renderizarResumenPagosMensaje("Cargando datos...");
}

function actualizarCabecera(fecha = new Date()) {
    const elemento = document.getElementById("lastUpdated");
    if (!elemento) {
        return;
    }

    let baseDate = fecha instanceof Date ? fecha : new Date(fecha);
    if (Number.isNaN(baseDate.getTime())) {
        baseDate = new Date();
    }

    const formato = baseDate
        .toLocaleString("es-AR", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
        .replace(/\./g, "");
    elemento.textContent = `Última actualización: ${formato}`;
}

function renderizarAutores(autores) {
    if (!Array.isArray(autores) || autores.length === 0) {
        renderizarErrorAutores("Sin registros de autores en el período.");
        return;
    }

    const canvas = document.getElementById("authorsChart");
    if (!canvas) return;

    toggleEstadoGraficoAutores(false);

    if (authorsChartInstance) {
        authorsChartInstance.destroy();
        authorsChartInstance = null;
    }

    const esLight = document.body.getAttribute('data-bs-theme') === 'light';
    const colorTexto = esLight ? "#495057" : "rgba(224, 235, 255, 0.85)";
    const colorGrid = esLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.08)";

    const topAutores = autores.slice(0, 10);
    const labels = topAutores.map((autor, indice) => `${indice + 1}. ${autor.autor || "Sin autor"}`);
    const unidades = topAutores.map((autor) => Math.max(0, autor.unidades ?? 0));
    const porcentajes = topAutores.map((autor) => Math.max(0, autor.porcentaje ?? 0));

    const coloresBase = [
        "rgba(82, 147, 255, 0.85)", "rgba(82, 147, 255, 0.75)",
        "rgba(82, 147, 255, 0.65)", "rgba(82, 147, 255, 0.55)", "rgba(82, 147, 255, 0.45)"
    ];
    const colores = unidades.map((_, index) => coloresBase[index] || "rgba(82, 147, 255, 0.35)");

    authorsChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Unidades",
                data: unidades,
                borderRadius: 10,
                borderSkipped: false,
                backgroundColor: colores
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 700, easing: "easeOutQuart" },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: colorTexto,
                        font: { family: "Segoe UI", size: 12 }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: colorGrid,
                        drawBorder: false
                    },
                    ticks: {
                        color: colorTexto,
                        font: { family: "Segoe UI", size: 12 },
                        callback: (value) => numberFormatter.format(value)
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {

                    backgroundColor: "rgba(8, 18, 38, 0.9)",
                    borderColor: "rgba(82, 147, 255, 0.5)",
                    borderWidth: 1,
                    titleFont: { family: "Segoe UI", size: 13, weight: "600" },
                    bodyFont: { family: "Segoe UI", size: 12 },
                    callbacks: {
                        label: (context) => {
                            const valor = context.parsed.y ?? context.parsed ?? 0;
                            return ` ${numberFormatter.format(valor)} unidades (${formatPercent(porcentajes[context.dataIndex])})`;
                        }
                    }
                }
            }
        }
    });
}

function renderizarErrorAutores(mensaje) {
    if (authorsChartInstance) {
        authorsChartInstance.destroy();
        authorsChartInstance = null;
    }
    toggleEstadoGraficoAutores(true, mensaje);
}

function toggleEstadoGraficoAutores(mostrarPlaceholder, mensaje = "") {
    const canvas = document.getElementById("authorsChart");
    const placeholder = document.getElementById("authorsChartPlaceholder");
    if (!canvas || !placeholder) {
        return;
    }

    if (mostrarPlaceholder) {
        placeholder.textContent = mensaje || placeholder.textContent;
        placeholder.classList.remove("d-none");
        canvas.classList.add("d-none");
    } else {
        placeholder.classList.add("d-none");
        canvas.classList.remove("d-none");
    }
}

function renderizarEnvios(envios) {
    const contenedor = document.getElementById("shippingStats");
    if (!contenedor) {
        return;
    }

    if (!Array.isArray(envios) || envios.length === 0) {
        renderizarErrorEnvios("Sin registros de envíos en el período.");
        return;
    }

    contenedor.innerHTML = "";

    envios.forEach((envio) => {
        const bloque = document.createElement("div");
        bloque.className = "mb-1";

        const cabecera = document.createElement("div");
        cabecera.className = "d-flex justify-content-between align-items-center small";

        const descripcion = document.createElement("span");
        descripcion.className = "text-secondary";
        descripcion.textContent = envio.tipoEnvio || "Sin definir";

        const estadisticas = document.createElement("span");
        estadisticas.className = "text-secondary fw-semibold";
        estadisticas.textContent = `${formatPercent(envio.porcentaje)} · ${numberFormatter.format(envio.cantidad ?? 0)} envíos`;

        cabecera.append(descripcion, estadisticas);

        const progreso = document.createElement("div");
        progreso.className = "progress";
        progreso.setAttribute("aria-hidden", "true");

        const barra = document.createElement("div");
        barra.className = "progress-bar";
        const ancho = Math.max(0, Math.min(100, envio.porcentaje ?? 0));
        barra.style.width = `${ancho}%`;

        progreso.appendChild(barra);
        bloque.append(cabecera, progreso);
        contenedor.appendChild(bloque);
    });
}

function renderizarErrorEnvios(mensaje) {
    const contenedor = document.getElementById("shippingStats");
    if (!contenedor) {
        return;
    }
    contenedor.innerHTML = `<div class="text-secondary small">${mensaje}</div>`;
}

function renderizarGraficoPagos(pagos) {
    const canvas = document.getElementById("paymentChart");
    const placeholder = document.getElementById("paymentChartPlaceholder");
    if (!canvas || !placeholder) return;

    if (typeof Chart === "undefined") {
        toggleEstadoGraficoPagos(true, "No se pudo inicializar el gráfico.");
        return;
    }

    if (!Array.isArray(pagos) || pagos.length === 0 || pagos.every((p) => !p.monto)) {
        if (paymentChartInstance) {
            paymentChartInstance.destroy();
            paymentChartInstance = null;
        }
        toggleEstadoGraficoPagos(true, "Sin facturación registrada en el período.");
        return;
    }

    toggleEstadoGraficoPagos(false);

    const esLight = document.body.getAttribute('data-bs-theme') === 'light';
    const colorTexto = esLight ? "#495057" : "rgba(224, 235, 255, 0.85)";

    const labels = pagos.map((pago) => pago.formaPago || "Sin nombre");
    const data = pagos.map((pago) => pago.monto ?? 0);
    const palette = [
        "rgba(58, 180, 255, 0.95)", "rgba(64, 132, 255, 0.92)",
        "rgba(116, 67, 255, 0.88)", "rgba(33, 208, 198, 0.9)",
        "rgba(51, 242, 173, 0.85)", "rgba(255, 159, 67, 0.85)"
    ];
    const colors = labels.map((_, indice) => palette[indice % palette.length]);

    if (paymentChartInstance) paymentChartInstance.destroy();

    paymentChartInstance = new Chart(canvas, {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderColor: esLight ? "#ffffff" : "rgba(4, 12, 26, 0.85)",
                borderWidth: 1.5,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 12 },
            plugins: {
                legend: {
                    position: "bottom",
                    align: "center",
                    labels: {
                        color: colorTexto,
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 14,
                        font: { family: "Segoe UI", size: 13 }
                    }
                },
                tooltip: {
                    backgroundColor: "rgba(8, 18, 38, 0.88)",
                    borderColor: "rgba(41, 172, 255, 0.45)",
                    borderWidth: 1,
                    titleFont: { family: "Segoe UI", size: 13, weight: "600" },
                    bodyFont: { family: "Segoe UI", size: 12 },
                    callbacks: {
                        label: (context) => {
                            const valor = context.parsed;
                            const total = context.dataset.data.reduce((suma, actual) => suma + actual, 0);
                            const porcentaje = total > 0 ? Math.round((valor / total) * 100) : 0;
                            return ` ${formatCurrency(valor)} · ${porcentaje}%`;
                        }
                    }
                }
            }
        }
    });
}

function toggleEstadoGraficoPagos(mostrarPlaceholder, mensaje = "") {
    const canvas = document.getElementById("paymentChart");
    const placeholder = document.getElementById("paymentChartPlaceholder");
    if (!canvas || !placeholder) {
        return;
    }

    if (mostrarPlaceholder) {
        placeholder.textContent = mensaje;
        placeholder.classList.remove("d-none");
        canvas.classList.add("d-none");
    } else {
        placeholder.classList.add("d-none");
        canvas.classList.remove("d-none");
    }
}

function toggleRefreshButtonState(estaCargando, textoCarga = "Procesando...") {
    const boton = document.getElementById("refreshDashboardBtn");
    if (!boton) {
        return;
    }

    boton.disabled = estaCargando;
    boton.setAttribute("aria-busy", estaCargando ? "true" : "false");

    const icono = boton.querySelector("i");
    if (icono) {
        icono.classList.toggle("icon-spin", estaCargando);
    }

    const etiqueta = boton.querySelector(".refresh-label");
    if (etiqueta) {
        etiqueta.textContent = estaCargando ? textoCarga : "Descargar resumen del panel";
    }
}

async function descargarResumenDashboard() {
    if (dashboardLoading) {
        return;
    }

    if (!ultimoResumenDashboard) {
        alert("Todavía no hay datos del panel para descargar. Actualiza el dashboard primero.");
        return;
    }

    const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;
    if (typeof jsPDFConstructor !== "function") {
        console.error("La librería jsPDF no está disponible.");
        alert("No se pudo acceder a la librería para generar el PDF.");
        return;
    }

    toggleRefreshButtonState(true, "Generando PDF...");

    try {
        const doc = new jsPDFConstructor();
        const marginX = 14;
        const bottomMargin = 20;
        const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;
        const textoBase = ultimaActualizacion instanceof Date ? ultimaActualizacion : new Date();
        const fechaTexto = textoBase.toLocaleString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
        const nombreArchivo = `resumen-dashboard-${textoBase.toISOString().split("T")[0]}.pdf`;

        let cursorY = 24;
        const alturaMaxima = doc.internal.pageSize.getHeight() - bottomMargin;

        const resetFuenteCuerpo = () => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
        };

        const asegurarEspacio = (espacioNecesario = 0, reestablecerFuente = null) => {
            if (cursorY + espacioNecesario > alturaMaxima) {
                doc.addPage();
                cursorY = 20;
                if (typeof reestablecerFuente === "function") {
                    reestablecerFuente();
                }
            }
        };

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Resumen del panel", marginX, cursorY);
        cursorY += 8;

        resetFuenteCuerpo();
        doc.text(`Generado: ${fechaTexto}`, marginX, cursorY);
        cursorY += 6;

        if (ultimoResumenDashboard.fechaInicio && ultimoResumenDashboard.fechaFin) {
            const fInicio = new Date(ultimoResumenDashboard.fechaInicio).toLocaleDateString("es-AR");
            const fFin = new Date(ultimoResumenDashboard.fechaFin).toLocaleDateString("es-AR");
            doc.text(`Período: ${fInicio} - ${fFin}`, marginX, cursorY);
            cursorY += 10;
        } else {
            cursorY += 4;
        }

        const secciones = construirSeccionesResumen(ultimoResumenDashboard);

        secciones.forEach(({ titulo, lineas }) => {
            asegurarEspacio(12);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text(titulo, marginX, cursorY);
            cursorY += 7;

            resetFuenteCuerpo();

            lineas.forEach((linea) => {
                const partes = doc.splitTextToSize(linea, maxWidth);
                partes.forEach((parte) => {
                    asegurarEspacio(6, resetFuenteCuerpo);
                    doc.text(parte, marginX, cursorY);
                    cursorY += 6;
                });
            });

            cursorY += 4;
        });

        doc.save(nombreArchivo);
    } catch (error) {
        console.error("No se pudo generar el PDF del dashboard:", error);
        alert("Ocurrió un error al generar el PDF del resumen.");
    } finally {
        toggleRefreshButtonState(false);
    }
}

function construirSeccionesResumen(datos) {
    const autores = Array.isArray(datos?.autores) ? datos.autores : [];
    const envios = Array.isArray(datos?.envios) ? datos.envios : [];
    const pagos = Array.isArray(datos?.pagos) ? datos.pagos : [];

    const autoresLineas = autores.slice(0, 5).map((autor, index) => {
        const nombreAutor = autor.autor || autor.nombre || "Sin autor";
        const unidades = numberFormatter.format(Math.max(0, autor.unidades ?? autor.cantidad ?? 0));
        const porcentaje = autor.porcentaje ?? autor.participacion ?? 0;
        return `${index + 1}. ${nombreAutor} - ${unidades} unidades (${formatPercent(porcentaje)})`;
    });
    if (autoresLineas.length === 0) {
        autoresLineas.push("Sin datos registrados en este período.");
    }

    const enviosLineas = envios.map((envio) => {
        const tipo = envio.tipoEnvio || envio.descripcion || "Sin definir";
        const cantidad = numberFormatter.format(Math.max(0, envio.cantidad ?? 0));
        const porcentaje = envio.porcentaje ?? 0;
        return `${tipo}: ${cantidad} envíos (${formatPercent(porcentaje)})`;
    });
    if (enviosLineas.length === 0) {
        enviosLineas.push("Sin envíos registrados.");
    }

    const totalPagos = pagos.reduce((suma, pago) => suma + Math.max(0, pago.monto ?? 0), 0);
    const pagosLineas = pagos.map((pago) => {
        const medio = pago.formaPago || pago.descripcion || "Sin definir";
        const monto = formatCurrency(pago.monto ?? 0);
        const porcentajeBase = typeof pago.porcentaje === "number"
            ? pago.porcentaje
            : (totalPagos > 0 ? (Math.max(0, pago.monto ?? 0) / totalPagos) * 100 : 0);
        return `${medio}: ${monto} (${formatPercent(porcentajeBase)})`;
    });
    if (pagosLineas.length === 0) {
        pagosLineas.push("Sin facturación registrada en este período.");
    }

    return [
        { titulo: "Autores con mayor demanda", lineas: autoresLineas },
        { titulo: "Tipos de envío preferidos", lineas: enviosLineas },
        { titulo: "Formas de pago con más facturación", lineas: pagosLineas }
    ];
}

function renderizarResumenPagos(pagos) {
    const lista = document.getElementById("paymentSummary");
    if (!lista) return;

    if (!Array.isArray(pagos) || pagos.length === 0) {
        renderizarResumenPagosMensaje("Sin facturación registrada en el período.");
        return;
    }

    lista.innerHTML = "";

    pagos.forEach((pago) => {
        const item = document.createElement("li");
        item.className = "list-group-item bg-transparent d-flex align-items-center justify-content-between gap-3";

        const contenedorEtiqueta = document.createElement("div");
        contenedorEtiqueta.className = "d-flex flex-column";

        const nombre = document.createElement("span");
        nombre.className = "item-label";
        nombre.textContent = pago.formaPago || "Sin nombre";

        const porcentaje = document.createElement("small");
        porcentaje.textContent = `${formatPercent(pago.porcentaje)} del total`;

        const monto = document.createElement("span");
        monto.className = "text-body-emphasis fw-semibold text-end"; 
        monto.textContent = formatCurrency(pago.monto ?? 0);

        contenedorEtiqueta.append(nombre, porcentaje);
        item.append(contenedorEtiqueta, monto);
        lista.appendChild(item);
    });
}

function renderizarResumenPagosMensaje(mensaje) {
    const lista = document.getElementById("paymentSummary");
    if (!lista) {
        return;
    }
    lista.innerHTML = `
        <li class="list-group-item bg-transparent text-secondary small text-center py-3">
            ${mensaje}
        </li>`;
}

function renderizarErrorPagos(mensaje) {
    toggleEstadoGraficoPagos(true, mensaje);
    renderizarResumenPagosMensaje(mensaje);
}

function formatCurrency(value) {
    return currencyFormatter.format(Math.max(0, value ?? 0));
}

function formatPercent(value) {
    return `${percentFormatter.format(value ?? 0)}%`;
}

function actualizarEstilosGraficos() {
    const esLight = document.body.getAttribute('data-bs-theme') === 'light';

    const colorTexto = esLight ? "#495057" : "rgba(224, 235, 255, 0.85)";
    const colorBorde = esLight ? "#ffffff" : "rgba(4, 12, 26, 0.85)"; // El borde que mencionas
    const colorGrid = esLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.08)";

    if (paymentChartInstance) {
        if (paymentChartInstance.data.datasets[0]) {
            paymentChartInstance.data.datasets[0].borderColor = colorBorde;
        }
        if (paymentChartInstance.options.plugins.legend && paymentChartInstance.options.plugins.legend.labels) {
            paymentChartInstance.options.plugins.legend.labels.color = colorTexto;
        }
        paymentChartInstance.update();
    }
    if (authorsChartInstance) {
        if (authorsChartInstance.options.scales.x.ticks) authorsChartInstance.options.scales.x.ticks.color = colorTexto;
        if (authorsChartInstance.options.scales.y.ticks) authorsChartInstance.options.scales.y.ticks.color = colorTexto;
        if (authorsChartInstance.options.scales.y.grid) authorsChartInstance.options.scales.y.grid.color = colorGrid;
        authorsChartInstance.update();
    }
}