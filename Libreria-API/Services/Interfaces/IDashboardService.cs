using Libreria_API.DTOs;
using System.Collections.Generic;

namespace Libreria_API.Services.Interfaces
{
    public interface IDashboardService
    {
        DashboardSummaryDTO ObtenerResumen(DateTime fechaInicio, DateTime fechaFin);
        List<DashboardAuthorDTO> ObtenerAutoresMasVendidos(DateTime fechaInicio, DateTime fechaFin);
        List<DashboardShippingDTO> ObtenerTiposEnvio(DateTime fechaInicio, DateTime fechaFin);
        List<DashboardPaymentDTO> ObtenerFormasPago(DateTime fechaInicio, DateTime fechaFin);
    }
}