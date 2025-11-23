using System;
using System.Collections.Generic;

namespace Libreria_API.DTOs
{
    public class DashboardSummaryDTO
    {
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public int MesesConsiderados { get; set; }
        public int TotalPedidos { get; set; }
        public int TotalUnidadesAutores { get; set; }
        public int TotalEnvios { get; set; }
        public decimal TotalFacturacion { get; set; }
        public int ClientesActivos { get; set; }
        public int EnviosPendientes { get; set; }
        

        public List<DashboardAuthorDTO> Autores { get; set; } = new();
        public List<DashboardShippingDTO> Envios { get; set; } = new();
        public List<DashboardPaymentDTO> Pagos { get; set; } = new();
    }
}