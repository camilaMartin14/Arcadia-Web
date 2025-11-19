using Libreria_API.DTOs;
using Libreria_API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Libreria_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LibroController : ControllerBase
    {
        private readonly ILibroService _service;

        public LibroController(ILibroService service)
        {
            _service = service;
        }

        [HttpGet("filtrar")]
        public IActionResult BuscarLibros(
            [FromQuery] string? titulo,
            [FromQuery] string? autor,
            [FromQuery] string? categoria,
            [FromQuery] string? idioma,
            [FromQuery] string? genero)
        {
            var libros = _service.GetLibrosByFilters(titulo, autor, categoria, idioma, genero);
            return Ok(libros);
        }

        [HttpGet("{codigo:int}")]
        public IActionResult GetDetalle(int codigo)
        {
            var libro = _service.GetLibroByCodigo(codigo);
            if (libro == null)
                return NotFound($"No se encontró el libro con código {codigo}.");

            return Ok(libro);
        }

        [HttpPost]
        public IActionResult CrearLibro([FromBody] LibroCreateUpdateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var creado = _service.CreateLibro(dto);

            return CreatedAtAction(nameof(GetDetalle),
                new { codigo = creado.Codigo },
                creado);
        }

        [HttpPut("{codigo:int}")]
        public IActionResult ActualizarLibro(int codigo, [FromBody] LibroCreateUpdateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var actualizado = _service.UpdateLibro(codigo, dto);

            if (actualizado == null)
                return NotFound($"No se encontró el libro con código {codigo}.");

            return Ok(actualizado);
        }

        [HttpDelete("{codigo:int}")]
        public IActionResult EliminarLibro(int codigo)
        {
            var ok = _service.DeleteLibro(codigo);

            if (!ok)
                return NotFound($"No se encontró el libro con código {codigo}.");

            return NoContent(); // 204 sin cuerpo
        }
    }
}
