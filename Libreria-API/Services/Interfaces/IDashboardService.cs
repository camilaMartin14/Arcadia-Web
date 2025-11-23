using Libreria_API.DTOs;
using System.Collections.Generic;

namespace Libreria_API.Services.Interfaces
{
    public interface IDashboardService
    {
        DashboardSummaryDTO ObtenerResumen(int meses);
        List<DashboardAuthorDTO> ObtenerAutoresMasVendidos(int meses);
        List<DashboardShippingDTO> ObtenerTiposEnvio(int meses);
        List<DashboardPaymentDTO> ObtenerFormasPago(int meses);
    }
}