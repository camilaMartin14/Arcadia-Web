using System;
using System.Linq;
using System.Collections.Generic; // Necesario para List<T> en las firmas de mtodos
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

        public DashboardSummaryDTO ObtenerResumen(DateTime fechaInicio, DateTime fechaFin)
        {
            return GetOrCreateSummary(fechaInicio, fechaFin);
        }

        public List<DashboardAuthorDTO> ObtenerAutoresMasVendidos(DateTime fechaInicio, DateTime fechaFin)
        {
            return GetOrCreateSummary(fechaInicio, fechaFin).Autores;
        }

        public List<DashboardPaymentDTO> ObtenerFormasPago(DateTime fechaInicio, DateTime fechaFin)
        {
            return GetOrCreateSummary(fechaInicio, fechaFin).Pagos;
        }

        public List<DashboardShippingDTO> ObtenerTiposEnvio(DateTime fechaInicio, DateTime fechaFin)
        {
            return GetOrCreateSummary(fechaInicio, fechaFin).Envios;
        }

        private DashboardSummaryDTO GetOrCreateSummary(DateTime fechaInicio, DateTime fechaFin)
        {
            // Normalizar fechas (ignorando horas/minutos si se desea, o usar precisión completa)
            // Aquí comparamos hasta segundos o ticks, pero para cacheo de dashboard, fecha es suficiente.
            if (_cachedSummary != null 
                && _cachedSummary.FechaInicio.Date == fechaInicio.Date 
                && _cachedSummary.FechaFin.Date == fechaFin.Date 
                && (DateTime.Now - _cacheTimestamp).TotalMinutes < 5)
            {
                return _cachedSummary;
            }

            // Calcular meses aproximados para el DTO
            var diffMeses = ((fechaFin.Year - fechaInicio.Year) * 12) + fechaFin.Month - fechaInicio.Month;
            if (diffMeses <= 0) diffMeses = 1;

            var resumen = ConstruirResumen(fechaInicio, fechaFin, diffMeses);

            _cachedSummary = resumen;
            _cacheTimestamp = DateTime.Now;
            return resumen;
        }

        private DashboardSummaryDTO ConstruirResumen(DateTime fechaInicio, DateTime fechaFin, int mesesConsiderados)
        {
            var estadoCompletado = "ENTREGADO";
            var estadoPendiente = "EN PROCESO";

            // Importante: Asegurar que fechaFin cubra hasta el final del día si viene sin hora
            // Si fechaFin es "2023-10-25 00:00:00", no incluirá pedidos de ese día a las 10am.
            // Ajustamos fechaFin para que sea el final del día si es necesario, o asumimos que el controller lo envía bien.
            // Para seguridad:
            if (fechaFin.Hour == 0 && fechaFin.Minute == 0 && fechaFin.Second == 0)
            {
                fechaFin = fechaFin.AddDays(1).AddTicks(-1);
            }

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

            var pedidosConCalculos = pedidosRecientes.Select(p => new
            {
                Pedido = p,
                TotalPedido = p.DetallePedidos.Sum(dp => dp.Cantidad * dp.Precio),
                EstadoActual = p.TrackingEnvios
                               .OrderByDescending(t => t.FechaEstado)
                               .FirstOrDefault()?.IdEstadoEnvioNavigation.EstadoActual
            }).ToList();

            var totalFacturacion = pedidosConCalculos
                .Where(x => x.EstadoActual == estadoCompletado)
                .Sum(x => x.TotalPedido);

            var totalPedidos = pedidosRecientes.Count;

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

            return new DashboardSummaryDTO
            {
                FechaInicio = fechaInicio,
                FechaFin = fechaFin,
                MesesConsiderados = mesesConsiderados,

                TotalPedidos = totalPedidos,
                TotalFacturacion = totalFacturacion,
                ClientesActivos = pedidosRecientes.Select(p => p.CodCliente).Distinct().Count(),
                EnviosPendientes = pedidosConCalculos.Count(x => x.EstadoActual == estadoPendiente),

                TotalUnidadesAutores = totalUnidadesAutores,
                TotalEnvios = totalEnvios, 
                Autores = autoresTop,
                Envios = enviosAgrupados,
                Pagos = pagosAgrupados
            };
        }
    }
}
