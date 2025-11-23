using System;
using System.Collections.Generic;

namespace Libreria_API.DTOs
{
    public class LibroCreateUpdateDTO
    {
        public string Titulo { get; set; } = null!;
        public int IdEditorial { get; set; }
        public int IdIdioma { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public List<int> IdsAutores { get; set; } = new();
        public List<int> IdsCategorias { get; set; } = new();
        public List<int> IdsGeneros { get; set; } = new();

        public List<string> Autores { get; set; } = new();
        public List<string> Categorias { get; set; } = new();
        public List<string> Generos { get; set; } = new();

        public string? Idioma { get; set; }
        public string? Editorial { get; set; }

        public string? Isbn { get; set; }
        public string? Descripcion { get; set; }
        public DateOnly? FechaLanzamiento { get; set; }
    }
}
