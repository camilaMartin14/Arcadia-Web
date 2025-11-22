using Libreria_API.DTOs;
using Libreria_API.Models;
using Libreria_API.Repositories.Interfaces;
using Libreria_API.Services.Interfaces;

namespace Libreria_API.Services.Implementations
{
    public class PedidoService: IPedidoService
    {
        private readonly IPedidoRepository _repo;
        public PedidoService(IPedidoRepository repo) => _repo = repo;

        public void Create(Pedido pedido)
        {
            var hoy = DateOnly.FromDateTime(DateTime.Today);

            if (pedido.FechaEntrega < hoy)
                throw new Exception("La fecha de entrega no puede ser anterior a hoy.");

            pedido.Fecha = DateTime.Now;
            pedido.Activo = true;

            _repo.Create(pedido);
        }
        public List<PedidoDTORead> GetAll(DateTime? fecha, int? codigoCliente)
            => _repo.GetAll(fecha, codigoCliente);

        public PedidoDTORead? GetPedidoById(int id)
            => _repo.GetPedidoById(id);

        public string ObtenerEstadoActualPedido(int nroPedido)
            => _repo.ObtenerEstadoActualPedido(nroPedido);

        public void UpdateStatus(int nroPedido, int nuevoEstadoId, string observaciones)
            => _repo.UpdateStatus(nroPedido, nuevoEstadoId, observaciones);

        public void Update(Pedido pedido)
            => _repo.Update(pedido);

        public void Delete(int nroPedido)
            => _repo.Delete(nroPedido);

        public async Task<bool> SoftDeletePedido(int id, bool estado)
        {
            var isUpdated = await _repo.SoftDeletePedido(id, false);
            return isUpdated;
        }
    }
}
