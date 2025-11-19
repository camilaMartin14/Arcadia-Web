using System;
using System.Linq;
using System.Collections.Generic; // Necesario para List<T> en las firmas de m�todos
using Libreria_API.DTOs;
using Libreria_API.Models;
using Libreria_API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Libreria_API.Services.Implementations
{

    public class DashboardService : IDashboardService
    {
        private readonly LibreriaContext _context;

        public DashboardService(LibreriaContext context)
        {
            _context = context;
        }

        private DashboardSummaryDTO? _cachedSummary;
        private DateTime _cacheTimestamp = DateTime.MinValue;


        // =========================================================================
        // M�TODOS P�BLICOS (Implementaci�n de IDashboardService)
        // =========================================================================

        // Implementaci�n del m�todo principal que calcula o devuelve el resumen cacheado
        public DashboardSummaryDTO ObtenerResumen(int meses)
        {
            return GetOrCreateSummary(meses);
        }

        /// <summary>
        /// **CORREGIDO:** Recibe 'meses' y usa la l�gica central.
        /// </summary>
        public List<DashboardAuthorDTO> ObtenerAutoresMasVendidos(int meses)
        {
            // Usamos el resumen centralizado con el filtro de meses
            return GetOrCreateSummary(meses).Autores;
        }

        /// <summary>
        /// **CORREGIDO:** Recibe 'meses' y usa la l�gica central.
        /// </summary>
        public List<DashboardPaymentDTO> ObtenerFormasPago(int meses)
        {
            // Usamos el resumen centralizado con el filtro de meses
            return GetOrCreateSummary(meses).Pagos;
        }

        /// <summary>
        /// **CORREGIDO:** Recibe 'meses' y usa la l�gica central.
        /// </summary>
        public List<DashboardShippingDTO> ObtenerTiposEnvio(int meses)
        {
            // Usamos el resumen centralizado con el filtro de meses
            return GetOrCreateSummary(meses).Envios;
        }

        // =========================================================================
        // L�GICA INTERNA (Cache y Construcci�n)
        // =========================================================================

        private DashboardSummaryDTO GetOrCreateSummary(int meses)
        {
            // L�gica de cach�: Si ya tenemos el resumen para los mismos meses y no ha pasado mucho tiempo, lo devolvemos.
            if (_cachedSummary != null && _cachedSummary.MesesConsiderados == meses && (DateTime.Now - _cacheTimestamp).TotalMinutes < 5)
            {
                return _cachedSummary;
            }

            var mesesNormalizados = meses <= 0 ? 3 : meses;
            var fechaFin = DateTime.Now;
            var fechaInicio = fechaFin.AddMonths(-mesesNormalizados);

            // Llamamos al m�todo que construye todo el DTO DashboardSummaryDTO
            var resumen = ConstruirResumen(fechaInicio, fechaFin, mesesNormalizados);

            _cachedSummary = resumen;
            _cacheTimestamp = DateTime.Now;
            return resumen;
        }


        // Este m�todo consolida toda la l�gica de obtenci�n de datos para evitar consultas repetidas
        private DashboardSummaryDTO ConstruirResumen(DateTime fechaInicio, DateTime fechaFin, int mesesConsiderados)
        {
            // 1. Obtener los datos necesarios en una sola consulta EF (o las m�nimas posibles)

            // Asumo que tienes estados finales como "ENTREGADO", "COMPLETADO"
            var estadoCompletado = "ENTREGADO";
            var estadoPendiente = "EN PROCESO";

            var pedidosRecientes = _context.Pedidos
                .Include(p => p.DetallePedidos)
                    .ThenInclude(dp => dp.CodLibroNavigation)
                        .ThenInclude(l => l.AutoresLibros)
                            .ThenInclude(al => al.IdAutorNavigation)
                .Include(p => p.TrackingEnvios)
                    .ThenInclude(t => t.IdEstadoEnvioNavigation)
                .Include(p => p.IdFormaEnvioNavigation)
                .Include(p => p.CodClienteNavigation)
                .Where(p => p.Fecha >= fechaInicio && p.Fecha <= fechaFin)
                .ToList();

            // 2. Calcular datos del Pedido (Estado y Total)
            var pedidosConCalculos = pedidosRecientes.Select(p => new
            {
                Pedido = p,
                TotalPedido = p.DetallePedidos.Sum(dp => dp.Cantidad * dp.Precio),
                EstadoActual = p.TrackingEnvios
                               .OrderByDescending(t => t.FechaEstado)
                               .FirstOrDefault()?.IdEstadoEnvioNavigation.EstadoActual
            }).ToList();


            // === C�LCULO DE KPIs PRINCIPALES ===

            var totalFacturacion = pedidosConCalculos
                .Where(x => x.EstadoActual == estadoCompletado)
                .Sum(x => x.TotalPedido);

            var totalPedidos = pedidosRecientes.Count;

            // === C�LCULO DE GR�FICOS / TABLAS ===

            // L�gica de Autores Top
            var autoresResultados = pedidosRecientes
                .SelectMany(p => p.DetallePedidos)
                .SelectMany(dp => dp.CodLibroNavigation.AutoresLibros.Select(al => new { Autor = al.IdAutorNavigation, dp.Cantidad }))
                .GroupBy(x => new { x.Autor.Nombre, x.Autor.Apellido })
                .Where(g => g.Key.Nombre != null || g.Key.Apellido != null)
                .Select(g => new DashboardAuthorDTO
                {
                    Autor = ((g.Key.Nombre ?? string.Empty) + " " + (g.Key.Apellido ?? string.Empty)).Trim(),
                    Unidades = g.Sum(x => x.Cantidad)
                })
                .OrderByDescending(a => a.Unidades)
                .ToList();

            var totalUnidadesAutores = autoresResultados.Sum(a => a.Unidades);
            var autoresTop = autoresResultados.Take(5).ToList();
            foreach (var a in autoresTop)
            {
                a.Porcentaje = totalUnidadesAutores == 0 ? 0 : Math.Round((double)a.Unidades / totalUnidadesAutores * 100, 2);
            }

            // L�gica de Env�os
            var enviosAgrupados = pedidosRecientes
                .GroupBy(p => p.IdFormaEnvioNavigation.FormaEnvio)
                .Where(g => g.Key != null)
                .Select(g => new DashboardShippingDTO
                {
                    TipoEnvio = g.Key,
                    Cantidad = g.Count()
                })
                .OrderByDescending(e => e.Cantidad)
                .ToList();

            var totalEnvios = enviosAgrupados.Sum(e => e.Cantidad);
            foreach (var envio in enviosAgrupados)
            {
                envio.Porcentaje = totalEnvios == 0 ? 0 : Math.Round((double)envio.Cantidad / totalEnvios * 100, 2);
            }

            // L�gica de Pagos (Requiere consulta separada, ya que Factura/Pago no est�n directamente en Pedido)
            // Filtramos FacturasFormaspago por fecha de la Factura, que es la que corresponde a nuestro rango.
            var pagosAgrupados = _context.FacturasFormaspagos
                .AsNoTracking()
                .Where(fp => fp.NroFacturaNavigation.Fecha >= fechaInicio && fp.NroFacturaNavigation.Fecha <= fechaFin)
                .GroupBy(fp => new { fp.IdFormaPago, fp.IdFormaPagoNavigation.FormaPago })
                .Select(g => new DashboardPaymentDTO
                {
                    FormaPago = g.Key.FormaPago,
                    Monto = g.Sum(x => x.MontoParcial)
                })
                .OrderByDescending(p => p.Monto)
                .ToList();

            var totalMontoPagos = pagosAgrupados.Sum(p => p.Monto);
            foreach (var pago in pagosAgrupados)
            {
                pago.Porcentaje = totalMontoPagos == 0 ? 0 : Math.Round((double)(pago.Monto / totalMontoPagos * 100m), 2);
            }

            // 3. Crear el DTO final
            return new DashboardSummaryDTO
            {
                FechaInicio = fechaInicio,
                FechaFin = fechaFin,
                MesesConsiderados = mesesConsiderados,

                // KPIs
                TotalPedidos = totalPedidos,
                TotalFacturacion = totalFacturacion,
                ClientesActivos = pedidosRecientes.Select(p => p.CodCliente).Distinct().Count(),
                EnviosPendientes = pedidosConCalculos.Count(x => x.EstadoActual == estadoPendiente),

                // Gr�ficos
                TotalUnidadesAutores = totalUnidadesAutores, // Puedes mantener este total si es un KPI
                TotalEnvios = totalEnvios, // Puedes mantener este total si es un KPI
                Autores = autoresTop,
                Envios = enviosAgrupados,
                Pagos = pagosAgrupados
            };
        }
    }
}