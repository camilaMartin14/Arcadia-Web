using Libreria_API.DTOs;
using Libreria_API.Models;

namespace Libreria_API.Repositories.Interfaces
{
    public interface IPedidoRepository
    {
        void Create(Pedido pedido);
        void UpdateStatus(int nroPedido, int nuevoEstadoId, string observaciones);
        List<PedidoDTORead> GetAll(DateTime? fecha, int? codigoCliente);
        PedidoDTORead? GetPedidoById(int id);
        string ObtenerEstadoActualPedido(int nroPedido);
        void Update(Pedido pedido);
        void Delete(int nroPedido);
        Task<bool> SoftDeletePedido(int id, bool estado);
    }
}
