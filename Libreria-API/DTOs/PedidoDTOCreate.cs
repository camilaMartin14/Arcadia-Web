using System;
using System.Collections.Generic;
using Libreria_API.Models;

namespace Libreria_API.DTOs
{
    public class PedidoDTOCreate
    {
        public DateTime Fecha { get; set; } = DateTime.Now;
        public DateOnly FechaEntrega { get; set; }
        public string? InstruccionesAdicionales { get; set; }
        public int CodCliente { get; set; }
        public int IdFormaEnvio { get; set; }
        public List<DetalleDTO> Detalles { get; set; } = new();

        public Pedido ConvertToModel()
        {
            var pedido = new Pedido
            {
                Fecha = Fecha,
                FechaEntrega = FechaEntrega,
                InstruccionesAdicionales = InstruccionesAdicionales ?? string.Empty,
                CodCliente = CodCliente,
                IdFormaEnvio = IdFormaEnvio,
                TrackingEnvios = new List<TrackingEnvio>()
            };

            foreach (var detalleDto in Detalles)
            {
                pedido.DetallePedidos.Add(new DetallePedido
                {
                    CodLibro = detalleDto.CodLibro,
                    Cantidad = detalleDto.Cantidad,
                    Precio = detalleDto.Precio
                });
            }

            return pedido;
        }
    }
}
