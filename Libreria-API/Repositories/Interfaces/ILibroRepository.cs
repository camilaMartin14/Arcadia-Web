using System.Linq;
using Libreria_API.Models;

namespace Libreria_API.Repositories.Interfaces
{
    public interface ILibroRepository
    {
        IQueryable<Libro> QueryLibros();

        // NUEVOS:
        Libro? GetByCodigo(int codigo);
        void Add(Libro libro);
        void Update(Libro libro);
        void Delete(Libro libro);
        void SaveChanges();

        Task<bool> SoftDeleteLibro(int id, bool estado);
    }
}
