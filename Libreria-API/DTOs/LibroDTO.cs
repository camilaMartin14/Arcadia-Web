using System.Collections.Generic;

namespace Libreria_API.DTOs
{
    public class LibroDTO
    {
        public bool Activo { get; set; }
        public string Codigo { get; set; }
        public string Titulo { get; set; }
        public string Editorial { get; set; }
        public int IdEditorial { get; set; }
        public string Idioma { get; set; }
        public List<string> Autores { get; set; }
        public List<string> Categorias { get; set; }
        public List<string> Generos { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public string Descripcion { get; set; }
        public string Isbn { get; set; }
        public DateOnly FechaLanzamiento { get; set; }

        public List<int> AutoresIds { get; set; } = new();
        public List<int> CategoriasIds { get; set; } = new();
        public List<int> GenerosIds { get; set; } = new();
        public int IdIdioma { get; set; }
    }
}
