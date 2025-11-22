using System.Collections.Generic;
using System.Linq;
using Libreria_API.DTOs;
using Libreria_API.Models;
using Libreria_API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Libreria_API.Repositories.Implementations
{
    public class PedidoRepository : IPedidoRepository
    {
        private readonly LibreriaContext _context;
        public PedidoRepository(LibreriaContext context) => _context = context;

        public void Create(Pedido pedido)
        {
            _context.Pedidos.Add(pedido);
            _context.SaveChanges(); // Genera NroPedido

            foreach (var detalle in pedido.DetallePedidos)
            {
                detalle.NroPedido = pedido.NroPedido;
            }

            var primerTracking = new TrackingEnvio
            {
                NroPedido = pedido.NroPedido,
                IdEstadoEnvio = 1, // Pendiente
                FechaEstado = DateTime.Now,
                Observaciones = "Pedido creado"
            };

            _context.TrackingEnvios.Add(primerTracking);
            _context.SaveChanges();
        }

        public List<PedidoDTORead> GetAll(DateTime? fecha, int? codigoCliente)
        {
            var query = _context.Pedidos
                .Include(p => p.CodClienteNavigation)
                .Include(p => p.IdFormaEnvioNavigation)
                .Include(p => p.DetallePedidos)
                    .ThenInclude(d => d.CodLibroNavigation)
                .Include(p => p.TrackingEnvios)
                    .ThenInclude(t => t.IdEstadoEnvioNavigation)
                .AsQueryable();

            if (fecha.HasValue)
                query = query.Where(p => p.Fecha >= fecha.Value.Date && p.Fecha < fecha.Value.Date.AddDays(1));

            if (codigoCliente.HasValue)
                query = query.Where(p => p.CodCliente == codigoCliente.Value);

            return query
                .Select(p => new PedidoDTORead
                {
                    NroPedido = p.NroPedido,
                    Activo = p.Activo,
                    Fecha = p.Fecha,
                    FechaEntrega = p.FechaEntrega,
                    InstruccionesAdicionales = p.InstruccionesAdicionales,
                    CodCliente = p.CodCliente,
                    NombreCliente = p.CodClienteNavigation.Nombre,
                    ApellidoCliente = p.CodClienteNavigation.Apellido,
                    IdFormaEnvio = p.IdFormaEnvio,
                    NombreFormaEnvio = p.IdFormaEnvioNavigation.FormaEnvio,
                    EstadoActual = p.TrackingEnvios
                        .OrderByDescending(t => t.FechaEstado)
                        .Select(t => t.IdEstadoEnvioNavigation.EstadoActual)
                        .FirstOrDefault() ?? "Sin estado",
                    Detalles = p.DetallePedidos.Select(d => new DetalleDTO
                    {
                        Cantidad = d.Cantidad,
                        CodLibro = d.CodLibro,
                        Precio = d.Precio,
                        NroPedido = d.NroPedido
                    }).ToList()
                })
                .ToList();
        }

        public PedidoDTORead? GetPedidoById(int id)
        {
            return _context.Pedidos
                .Include(p => p.CodClienteNavigation)
                .Include(p => p.IdFormaEnvioNavigation)
                .Include(p => p.DetallePedidos)
                    .ThenInclude(d => d.CodLibroNavigation)
                .Include(p => p.TrackingEnvios)
                    .ThenInclude(t => t.IdEstadoEnvioNavigation)
                .Where(p => p.NroPedido == id)
                .Select(p => new PedidoDTORead
                {
                    NroPedido = p.NroPedido,
                    Fecha = p.Fecha,
                    FechaEntrega = p.FechaEntrega,
                    Activo = p.Activo,
                    InstruccionesAdicionales = p.InstruccionesAdicionales,
                    CodCliente = p.CodCliente,
                    NombreCliente = p.CodClienteNavigation.Nombre,
                    ApellidoCliente = p.CodClienteNavigation.Apellido,
                    IdFormaEnvio = p.IdFormaEnvio,
                    NombreFormaEnvio = p.IdFormaEnvioNavigation.FormaEnvio,
                    EstadoActual = p.TrackingEnvios
                        .OrderByDescending(t => t.FechaEstado)
                        .Select(t => t.IdEstadoEnvioNavigation.EstadoActual)
                        .FirstOrDefault() ?? "Sin estado",
                    Detalles = p.DetallePedidos.Select(d => new DetalleDTO
                    {
                        CodLibro = d.CodLibro,
                        Cantidad = d.Cantidad,
                        Precio = d.Precio,
                        NroPedido = d.NroPedido
                    }).ToList()
                })
                .FirstOrDefault();
        }

        public void UpdateStatus(int nroPedido, int nuevoEstadoId, string observaciones)
        {
            var pedido = _context.Pedidos
                .Include(p => p.TrackingEnvios)
                .FirstOrDefault(p => p.NroPedido == nroPedido);

            if (pedido == null)
                throw new KeyNotFoundException("Pedido no encontrado");

            var tracking = new TrackingEnvio
            {
                NroPedido = nroPedido,
                IdEstadoEnvio = nuevoEstadoId,
                FechaEstado = DateTime.Now,
                Observaciones = observaciones
            };

            _context.TrackingEnvios.Add(tracking);
            _context.SaveChanges();
        }

        public string ObtenerEstadoActualPedido(int nroPedido)
        {
            var estado = _context.TrackingEnvios
                .Where(t => t.NroPedido == nroPedido)
                .OrderByDescending(t => t.FechaEstado)
                .Select(t => t.IdEstadoEnvioNavigation.EstadoActual)
                .FirstOrDefault();

            return estado ?? "Sin estado";
        }

        public void Update(Pedido pedido)
        {
            var existente = _context.Pedidos.FirstOrDefault(p => p.NroPedido == pedido.NroPedido);
            if (existente == null)
                throw new KeyNotFoundException("Pedido no encontrado");

            existente.FechaEntrega = pedido.FechaEntrega;
            existente.InstruccionesAdicionales = pedido.InstruccionesAdicionales;
            existente.CodCliente = pedido.CodCliente;
            existente.IdFormaEnvio = pedido.IdFormaEnvio;
            _context.SaveChanges();
        }

        public void Delete(int nroPedido)
        {
            var pedido = _context.Pedidos
                .Include(p => p.DetallePedidos)
                .Include(p => p.TrackingEnvios)
                .FirstOrDefault(p => p.NroPedido == nroPedido);

            if (pedido == null)
                throw new KeyNotFoundException("Pedido no encontrado");

            if (pedido.DetallePedidos.Any())
                _context.DetallePedidos.RemoveRange(pedido.DetallePedidos);

            if (pedido.TrackingEnvios.Any())
                _context.TrackingEnvios.RemoveRange(pedido.TrackingEnvios);

            _context.Pedidos.Remove(pedido);
            _context.SaveChanges();
        }

        public async Task<bool> SoftDeletePedido(int id, bool estado)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null)
            {
                return false;
            }
            pedido.Activo = estado;
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
