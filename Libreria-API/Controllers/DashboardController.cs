using Libreria_API.DTOs;
using Libreria_API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

namespace Libreria_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        private (DateTime Inicio, DateTime Fin) ResolveDates(int? meses, DateTime? fechaDesde, DateTime? fechaHasta)
        {
            if (fechaDesde.HasValue && fechaHasta.HasValue)
            {
                return (fechaDesde.Value, fechaHasta.Value);
            }

            int mesesNormalizados = (meses.HasValue && meses.Value > 0) ? meses.Value : 3;
            var fin = DateTime.Now;
            var inicio = fin.AddMonths(-mesesNormalizados);
            return (inicio, fin);
        }

        [HttpGet("resumen")]
        public ActionResult<DashboardSummaryDTO> ObtenerResumen(
            [FromQuery] int? meses,
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta)
        {
            var (inicio, fin) = ResolveDates(meses, fechaDesde, fechaHasta);
            var resultado = _dashboardService.ObtenerResumen(inicio, fin);
            return Ok(resultado);
        }

        [HttpGet("autores")]
        public ActionResult<List<DashboardAuthorDTO>> ObtenerAutores(
            [FromQuery] int? meses,
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta)
        {
            var (inicio, fin) = ResolveDates(meses, fechaDesde, fechaHasta);
            var resultado = _dashboardService.ObtenerAutoresMasVendidos(inicio, fin);
            return Ok(resultado);
        }

        [HttpGet("envios")]
        public ActionResult<List<DashboardShippingDTO>> ObtenerTiposEnvio(
            [FromQuery] int? meses,
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta)
        {
            var (inicio, fin) = ResolveDates(meses, fechaDesde, fechaHasta);
            var resultado = _dashboardService.ObtenerTiposEnvio(inicio, fin);
            return Ok(resultado);
        }

        [HttpGet("pagos")]
        public ActionResult<List<DashboardPaymentDTO>> ObtenerFormasPago(
            [FromQuery] int? meses,
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta)
        {
            var (inicio, fin) = ResolveDates(meses, fechaDesde, fechaHasta);
            var resultado = _dashboardService.ObtenerFormasPago(inicio, fin);
            return Ok(resultado);
        }
    }
}
