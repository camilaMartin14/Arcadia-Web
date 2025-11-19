using System.Collections.Generic;
using Libreria_API.DTOs;
using Libreria_API.Models;
using Libreria_API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Libreria_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PedidoController : ControllerBase
    {
        private readonly IPedidoService _service;
        public PedidoController(IPedidoService service) => _service = service;

        [HttpGet]
        public ActionResult<List<PedidoDTORead>> GetAll([FromQuery] DateTime? fecha, [FromQuery] int? codigoCliente)
        {
            return Ok(_service.GetAll(fecha, codigoCliente));
        }

        [HttpGet("{nroPedido}")]
        public ActionResult<PedidoDTORead> GetById(int nroPedido)
        {
            var pedido = _service.GetPedidoById(nroPedido);
            if (pedido == null)
                return NotFound($"No se encontro el pedido con numero {nroPedido}.");

            return Ok(pedido);
        }

        [HttpPost]
        public ActionResult<PedidoDTORead> Create([FromBody] PedidoDTOCreate pedido)
        {
            if (pedido == null)
                return BadRequest("Los datos del pedido son obligatorios.");

            var pedidoModel = pedido.ConvertToModel();

            // Guardar pedido
            _service.Create(pedidoModel);

            // Recargar pedido con relaciones
            var pedidoRecargado = _service.GetPedidoById(pedidoModel.NroPedido);
            if (pedidoRecargado == null)
                return BadRequest("No se pudo recuperar el pedido despues de crearlo.");

            return StatusCode(201, pedidoRecargado);
        }

        [HttpPut("{nroPedido}")]
        public IActionResult Update(int nroPedido, [FromBody] Pedido pedido)
        {
            if (pedido == null || nroPedido != pedido.NroPedido)
                return BadRequest("El numero de pedido no coincide con la ruta.");

            try
            {
                _service.Update(pedido);
                var pedidoActualizado = _service.GetPedidoById(nroPedido);
                return Ok(pedidoActualizado);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{nroPedido}")]
        public IActionResult Delete(int nroPedido)
        {
            try
            {
                _service.Delete(nroPedido);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpGet("{nroPedido}/estado")]
        public ActionResult<string> GetEstadoActual(int nroPedido)
        {
            var estado = _service.ObtenerEstadoActualPedido(nroPedido);
            return Ok(estado);
        }

        [HttpPut("{nroPedido}/estado")]
        public IActionResult UpdateStatus(int nroPedido, [FromBody] UpdateEstadoDTO dto)
        {
            try
            {
                _service.UpdateStatus(nroPedido, dto.NuevoEstadoId, dto.Observaciones);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}


