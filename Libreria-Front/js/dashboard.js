"use strict";

const API_BASE = "http://localhost:5157"; 

const $ = selector => document.querySelector(selector);
let chartPagos;

const currencyFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const currency = (value) => currencyFormatter.format(value); 
const number = (value) => numberFormatter.format(value);

async function safeFetchJson(url, options, mockData, debugName) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            console.warn(`[${debugName}] API Falló con estado ${response.status}. Retornando NULL.`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`[${debugName}] Error de red/parseo. Retornando NULL.`, error);
        return null;
    }
}

function showLoading(id) {
    const el = $(`#loading${id}`);
    if (el) el.classList.remove('d-none');
}
function hideLoading(id) {
    const el = $(`#loading${id}`);
    if (el) el.classList.add('d-none');
}

document.addEventListener("DOMContentLoaded", () => {
    Promise.all([
        cargarAutores(),
        cargarEnvios(), 
        cargarPagos()
    ]).catch(err => console.error("Error en la carga inicial del dashboard:", err));

    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            localStorage.removeItem("usuario");
            window.location.href = "login.html";
        });
    }

    const temaGuardado = localStorage.getItem("tema");
    if (temaGuardado === "light") temaClaro();
    else temaOscuro();
});

async function cargarAutores(meses = 3) {
    showLoading('Autores');
    try {
        const data = await safeFetchJson(`${API_BASE}/api/dashboard/autores?`, null, MOCK_NUEVOS_DATOS.autores, 'Autores');
        renderAutores(data);
    } catch (error) {
        console.error("Error cargando autores:", error);
    } finally {
        hideLoading('Autores'); 
    }
}

function renderAutores(data) {
    const tbody = $('#authorsTableBody');
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary small py-4">No hay datos de autores.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td class="fw-semibold">${item.autor}</td>
            <td class="text-end">${number(item.unidades)}</td>
            <td class="text-end">${(item.participacion * 100).toFixed(1)}%</td>
        </tr>
    `).join('');
}

async function cargarEnvios(meses = 3) {
    showLoading('Envios');
    try {
        const data = await safeFetchJson(`${API_BASE}/api/dashboard/envios`, null, MOCK_NUEVOS_DATOS.envios, 'Envios');
        renderEnvios(data);
    } catch (error) {
        console.error("Error cargando envíos:", error);
    } finally {
        hideLoading('Envios');
    }
}

function renderEnvios(data) {
    const container = $('#shippingStats');
    if (!data || data.length === 0) {
        container.innerHTML = `<div class="text-secondary small text-center">No hay datos de envíos.</div>`;
        return;
    }

    const totalPedidos = data.reduce((sum, item) => sum + item.cantidad, 0); 

    container.innerHTML = data.map(item => {
        const count = item.cantidad;
        const percentage = totalPedidos > 0 ? (count / totalPedidos) * 100 : 0;
        const width = Math.min(percentage, 100).toFixed(0);
        return `
            <div>
                <div class="d-flex justify-content-between small mb-1">
                    <span>${item.tipoEnvio}</span>
                    <span class="fw-semibold">${number(count)} (${percentage.toFixed(1)}%)</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-info" role="progressbar" style="width: ${width}%" aria-valuenow="${percentage.toFixed(1)}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        `;
    }).join('');
}

async function cargarPagos(meses = 3) {
    showLoading('Pagos');
    try {
        const endpoint = `${API_BASE}/api/dashboard/pagos`; 
        const data = await safeFetchJson(endpoint, null, MOCK_NUEVOS_DATOS.pagos, 'Pagos');
        renderChartPagos(data);
    } catch (error) {
        console.error("Error cargando pagos:", error);
    } finally {
        hideLoading('Pagos');
    }
}

function renderChartPagos(data) {
    const chartCanvas = $('#paymentChart');
    const placeholder = $('#paymentChartPlaceholder');
    const summaryList = $('#paymentSummary');

    if (!data || data.length === 0) {
        chartCanvas.classList.add('d-none');
        placeholder.classList.remove('d-none');
        placeholder.textContent = 'No hay datos de pagos.';
        summaryList.innerHTML = '';
        if (chartPagos) { chartPagos.destroy(); chartPagos = null; }
        return;
    }

    chartCanvas.classList.remove('d-none');
    placeholder.classList.add('d-none');

    const etiquetas = data.map(x => x.formaPago);
    const valores = data.map(x => x.monto);
    const colores = data.map(x => x.color);
    const totalFacturacion = valores.reduce((sum, val) => sum + val, 0);
    const theme = document.body.getAttribute('data-bs-theme') || 'dark';

    const options = {
        responsive: true, maintainAspectRatio: false,
        plugins: { 
            legend: { 
                position: 'right', 
                labels: { color: theme === 'dark' ? '#adb5bd' : '#495057' } 
            },
            tooltip: {
                callbacks: {
                    label: context => {
                        const value = context.parsed;
                        const percent = (value / totalFacturacion * 100).toFixed(1);
                        return ` ${context.label}: ${currency(value)} (${percent}%)`;
                    }
                }
            }
        }
    };

    if(!chartPagos){
        const ctx = chartCanvas.getContext('2d');
        chartPagos = new Chart(ctx, {
            type: 'doughnut', 
            data: { labels: etiquetas, datasets: [{ label: 'Facturación', data: valores, backgroundColor: colores, hoverOffset: 4 }] },
            options: options
        });
    } else {
        chartPagos.data.labels = etiquetas;
        chartPagos.data.datasets[0].data = valores;
        chartPagos.data.datasets[0].backgroundColor = colores;
        chartPagos.options.plugins.legend.labels.color = theme === 'dark' ? '#adb5bd' : '#495057';
        chartPagos.update();
    }
    
    summaryList.innerHTML = data.map(item => {
        const fact = item.monto;
        const name = item.formaPago;
        const percentage = totalFacturacion > 0 ? (fact / totalFacturacion * 100).toFixed(1) : 0;
        return `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span style="color: ${item.color};">●</span> ${name}
                <span class="badge text-info">${currency(fact)} (${percentage}%)</span>
            </li>
        `;
    }).join('');
}

const temaClaro = () => {
    document.body.setAttribute("data-bs-theme", "light");
    const icono = document.querySelector("#iconoTema");
    if (icono) icono.setAttribute("class", "bi bi-moon-fill");
};

const temaOscuro = () => {
    document.body.setAttribute("data-bs-theme", "dark");
    const icono = document.querySelector("#iconoTema");
    if (icono) icono.setAttribute("class", "bi bi-sun-fill");
};

const cambiarTema = () => {
    const temaActual = document.body.getAttribute("data-bs-theme");
    const nuevoTema = temaActual === "dark" ? "light" : "dark";
    localStorage.setItem("tema", nuevoTema);
    nuevoTema === "light" ? temaClaro() : temaOscuro();
};