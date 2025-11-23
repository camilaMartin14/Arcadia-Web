using Libreria_API.DTOs;
using Libreria_API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic; // Asegúrate de que este using esté presente

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

        [HttpGet("resumen")]
        public ActionResult<DashboardSummaryDTO> ObtenerResumen([FromQuery] int meses = 3)
        {
            var resultado = _dashboardService.ObtenerResumen(meses);
            return Ok(resultado);
        }

        [HttpGet("autores")]
        public ActionResult<List<DashboardAuthorDTO>> ObtenerAutores([FromQuery] int meses = 3) // Adaptado 1/3
        {
            var resultado = _dashboardService.ObtenerAutoresMasVendidos(meses);
            return Ok(resultado);
        }

        [HttpGet("envios")]
        public ActionResult<List<DashboardShippingDTO>> ObtenerTiposEnvio([FromQuery] int meses = 3) // Adaptado 2/3
        {
            var resultado = _dashboardService.ObtenerTiposEnvio(meses);
            return Ok(resultado);
        }

        [HttpGet("pagos")]
        public ActionResult<List<DashboardPaymentDTO>> ObtenerFormasPago([FromQuery] int meses = 3) // Adaptado 3/3
        {
            var resultado = _dashboardService.ObtenerFormasPago(meses);
            return Ok(resultado);
        }
    }
}