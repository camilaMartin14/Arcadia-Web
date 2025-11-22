using System.Collections.Generic;
using Libreria_API.DTOs;

namespace Libreria_API.Services.Interfaces
{
    public interface ILibroService
    {
        IEnumerable<LibroDTO> GetLibrosByFilters(
            string? titulo,
            string? autor,
            string? categoria,
            string? idioma,
            string? genero
        );

        LibroDTO? GetLibroByCodigo(int codigo);
        LibroDTO CreateLibro(LibroCreateUpdateDTO dto);
        LibroDTO? UpdateLibro(int codigo, LibroCreateUpdateDTO dto);
        Task<bool> SoftDeleteLibro(int id, bool estado);
    }
}
