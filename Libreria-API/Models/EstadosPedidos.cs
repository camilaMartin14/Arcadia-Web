namespace Libreria_API.Models
{
    public class EstadoPedido
    {
        public int IdEstadoPedido { get; set; }

        public string Nombre { get; set; } = null!;

        public virtual ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
    }
}
