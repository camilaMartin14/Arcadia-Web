using System.Linq;
using Libreria_API.Models;
using Libreria_API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Libreria_API.Repositories.Implementations
{
    public class LibroRepository : ILibroRepository
    {
        private readonly LibreriaContext _context;

        public LibroRepository(LibreriaContext context)
        {
            _context = context;
        }

        public IQueryable<Libro> QueryLibros()
        {
            return _context.Libros
                .Include(l => l.IdEditorialNavigation)
                .Include(l => l.IdIdiomaNavigation)
                .Include(l => l.AutoresLibros).ThenInclude(al => al.IdAutorNavigation)
                .Include(l => l.LibrosCategoria).ThenInclude(lc => lc.IdCategoriaNavigation)
                .Include(l => l.LibrosGeneros).ThenInclude(lg => lg.IdGeneroNavigation);
        }

        // NUEVO
        public Libro? GetByCodigo(int codigo)
        {
            return QueryLibros().FirstOrDefault(l => l.CodLibro == codigo);
        }

        public void Add(Libro libro)
        {
            _context.Libros.Add(libro);
        }

        public void Update(Libro libro)
        {
            _context.Libros.Update(libro);
        }

        public void Delete(Libro libro)
        {
            _context.Libros.Remove(libro);
        }

        public void SaveChanges()
        {
            _context.SaveChanges();
        }
    }
}
