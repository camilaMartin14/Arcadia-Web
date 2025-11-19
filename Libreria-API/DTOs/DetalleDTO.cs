using Libreria_API.Models;

namespace Libreria_API.DTOs
{
    public class DetalleDTO
    {
        public int Cantidad { get; set; }
        public decimal Precio { get; set; }
        public int CodLibro { get; set; }
        public int NroPedido { get; set; }
    }
}
