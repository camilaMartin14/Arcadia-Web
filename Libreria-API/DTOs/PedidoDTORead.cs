using System.Collections.Generic;


namespace Libreria_API.DTOs
{
    public class PedidoDTORead
    {
        public bool Activo { get; set; }
        public int NroPedido { get; set; }
        public DateTime Fecha { get; set; }
        public DateOnly FechaEntrega { get; set; }
        public string? InstruccionesAdicionales { get; set; }
        public int CodCliente { get; set; }
        public string? NombreCliente { get; set; }
        public string? ApellidoCliente { get; set; }
        public int IdFormaEnvio { get; set; }
        public string? NombreFormaEnvio { get; set; }
        public string? EstadoActual { get; set; }
        public List<DetalleDTO> Detalles { get; set; } = new();

    }
}
