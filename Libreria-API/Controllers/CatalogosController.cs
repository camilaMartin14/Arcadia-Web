using System.Linq;
using Libreria_API.DTOs;
using Libreria_API.Models;
using Microsoft.AspNetCore.Mvc;

namespace Libreria_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CatalogosController : ControllerBase
    {
        private readonly LibreriaContext _context;

        public CatalogosController(LibreriaContext context)
        {
            _context = context;
        }

        [HttpGet("autores")]
        public IActionResult ObtenerAutores()
        {
            var data = _context.Autores
                .OrderBy(a => a.Apellido)
                .ThenBy(a => a.Nombre)
                .Select(a => new LookupItemDTO
                {
                    Id = a.IdAutor,
                    Nombre = $"{a.Nombre} {a.Apellido}"
                })
                .ToList();
            return Ok(data);
        }

        [HttpGet("categorias")]
        public IActionResult ObtenerCategorias()
        {
            var data = _context.Categorias
                .OrderBy(c => c.Categoria1)
                .Select(c => new LookupItemDTO
                {
                    Id = c.IdCategoria,
                    Nombre = c.Categoria1
                })
                .ToList();
            return Ok(data);
        }

        [HttpGet("generos")]
        public IActionResult ObtenerGeneros()
        {
            var data = _context.Generos
                .OrderBy(g => g.Genero1)
                .Select(g => new LookupItemDTO
                {
                    Id = g.IdGenero,
                    Nombre = g.Genero1
                })
                .ToList();
            return Ok(data);
        }

        [HttpGet("idiomas")]
        public IActionResult ObtenerIdiomas()
        {
            var data = _context.Idiomas
                .OrderBy(i => i.Idioma1)
                .Select(i => new LookupItemDTO
                {
                    Id = i.IdIdioma,
                    Nombre = i.Idioma1
                })
                .ToList();
            return Ok(data);
        }
    }
}
