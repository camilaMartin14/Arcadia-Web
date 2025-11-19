using Libreria_API.DTOs;
using System.Collections.Generic;

namespace Libreria_API.Services.Interfaces
{
    public interface IDashboardService
    {
        /// <summary>
        /// Obtiene un resumen general (KPIs) de ventas y pedidos de los últimos N meses.
        /// </summary>
        /// <param name="meses">Número de meses a considerar.</param>
        DashboardSummaryDTO ObtenerResumen(int meses);

        // Se mantiene el diseño original de la interfaz para que el Controller funcione,
        // pero se añade el parámetro 'meses' para permitir filtros de tiempo coherentes.

        /// <summary>
        /// Obtiene la lista de autores más vendidos según las unidades en los últimos N meses.
        /// </summary>
        List<DashboardAuthorDTO> ObtenerAutoresMasVendidos(int meses);

        /// <summary>
        /// Obtiene la distribución de tipos de envío utilizados en los pedidos de los últimos N meses.
        /// </summary>
        List<DashboardShippingDTO> ObtenerTiposEnvio(int meses);

        /// <summary>
        /// Obtiene la facturación por forma de pago utilizada en los últimos N meses.
        /// </summary>
        List<DashboardPaymentDTO> ObtenerFormasPago(int meses);
    }
}