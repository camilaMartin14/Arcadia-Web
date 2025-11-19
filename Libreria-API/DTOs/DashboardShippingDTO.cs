namespace Libreria_API.DTOs
{
    public class DashboardShippingDTO
    {
        public string TipoEnvio { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public double Porcentaje { get; set; }
    }
}