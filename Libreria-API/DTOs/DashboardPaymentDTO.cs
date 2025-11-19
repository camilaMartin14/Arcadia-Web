namespace Libreria_API.DTOs
{
    public class DashboardPaymentDTO
    {
        public string FormaPago { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public double Porcentaje { get; set; }
    }
}