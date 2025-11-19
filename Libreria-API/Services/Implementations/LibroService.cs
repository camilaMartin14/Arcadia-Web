using System;
using System.Collections.Generic;
using System.Linq;
using Libreria_API.DTOs;
using Libreria_API.Models;
using Libreria_API.Repositories.Interfaces;
using Libreria_API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Libreria_API.Services.Implementations
{
    public class LibroService : ILibroService
    {
        private readonly ILibroRepository _repo;
        private readonly LibreriaContext _context;
        private int? _ultimoAutorLibroId;
        private int? _ultimoLibroCategoriaId;
        private int? _ultimoLibroGeneroId;

        public LibroService(ILibroRepository repo, LibreriaContext context)
        {
            _repo = repo;
            _context = context;
        }


        public IEnumerable<LibroDTO> GetLibrosByFilters(
            string? titulo,
            string? autor,
            string? categoria,
            string? idioma,
            string? genero)
        {
            var query = _repo.QueryLibros();

            if (!string.IsNullOrWhiteSpace(titulo))
            {
                var t = titulo.Trim();
                query = query.Where(l => l.Titulo.Contains(t));
            }

            if (!string.IsNullOrWhiteSpace(autor))
            {
                var a = autor.Trim();
                query = query.Where(l =>
                    l.AutoresLibros.Any(al =>
                        (al.IdAutorNavigation.Nombre + " " + al.IdAutorNavigation.Apellido)
                            .Contains(a)
                    )
                );
            }

            if (!string.IsNullOrWhiteSpace(categoria))
            {
                var c = categoria.Trim();
                query = query.Where(l =>
                    l.LibrosCategoria.Any(lc =>
                        lc.IdCategoriaNavigation.Categoria1.Contains(c)
                    )
                );
            }

            if (!string.IsNullOrWhiteSpace(idioma))
            {
                var i = idioma.Trim();
                query = query.Where(l =>
                    l.IdIdiomaNavigation.Idioma1.Contains(i)
                );
            }

            if (!string.IsNullOrWhiteSpace(genero))
            {
                var g = genero.Trim();
                query = query.Where(l =>
                    l.LibrosGeneros.Any(lg =>
                        lg.IdGeneroNavigation.Genero1.Contains(g)
                    )
                );
            }

            var libros = query.ToList();

            return libros.Select(MapToDto);
        }

        public LibroDTO? GetLibroByCodigo(int codigo)
        {
            var libro = _repo
                .QueryLibros()
                .FirstOrDefault(l => l.CodLibro == codigo);

            if (libro == null)
                return null;

            return MapToDto(libro);
        }

        public LibroDTO CreateLibro(LibroCreateUpdateDTO dto)
        {
            var editorialId = ResolveEditorialId(dto);
            var idiomaId = ResolveIdiomaId(dto);
            var autoresIds = ResolveAutorIds(dto);
            var categoriasIds = ResolveCategoriaIds(dto);
            var generosIds = ResolveGeneroIds(dto);

            var libro = new Libro
            {
                Titulo = dto.Titulo,
                IdEditorial = editorialId,
                IdIdioma = idiomaId,
                Precio = dto.Precio,
                Stock = dto.Stock,
                Isbn = BuildIsbn(dto.Isbn),
                Descripcion = BuildDescripcion(dto.Descripcion),
                FechaLanzamiento = BuildFecha(dto.FechaLanzamiento),
                AutoresLibros = new List<AutoresLibro>(),
                LibrosCategoria = new List<LibrosCategoria>(),
                LibrosGeneros = new List<LibrosGenero>()
            };

            foreach (var idAutor in autoresIds)
            {
                libro.AutoresLibros.Add(new AutoresLibro
                {
                    IdAutor = idAutor
                    ,
                    IdAutorLibro = ObtenerSiguienteIdAutoresLibro(),
                    IdLibroNavigation = libro
                });
            }

            foreach (var idCat in categoriasIds)
            {
                libro.LibrosCategoria.Add(new LibrosCategoria
                {
                    IdCategoria = idCat,
                    IdLibroCategoria = ObtenerSiguienteIdLibroCategoria(),
                    IdLibroNavigation = libro
                });
            }

            foreach (var idGen in generosIds)
            {
                libro.LibrosGeneros.Add(new LibrosGenero
                {
                    IdGenero = idGen,
                    IdLibroGenero = ObtenerSiguienteIdLibroGenero(),
                    IdLibroNavigation = libro
                });
            }

            _repo.Add(libro);
            _repo.SaveChanges();

            var creado = _repo.GetByCodigo(libro.CodLibro)!;
            return MapToDto(creado);
        }

        public LibroDTO? UpdateLibro(int codigo, LibroCreateUpdateDTO dto)
        {
            var libro = _context.Libros.FirstOrDefault(l => l.CodLibro == codigo);
            if (libro == null)
                return null;

            var editorialId = ResolveEditorialId(dto);
            var idiomaId = ResolveIdiomaId(dto);
            var autoresIds = ResolveAutorIds(dto);
            var categoriasIds = ResolveCategoriaIds(dto);
            var generosIds = ResolveGeneroIds(dto);

            libro.Titulo = dto.Titulo;
            libro.IdEditorial = editorialId;
            libro.IdIdioma = idiomaId;
            libro.Precio = dto.Precio;
            libro.Stock = dto.Stock;

            if (!string.IsNullOrWhiteSpace(dto.Isbn))
                libro.Isbn = dto.Isbn.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Descripcion))
                libro.Descripcion = dto.Descripcion.Trim();

            if (dto.FechaLanzamiento.HasValue)
                libro.FechaLanzamiento = dto.FechaLanzamiento.Value;

            ReemplazarAutores(libro.CodLibro, autoresIds);
            ReemplazarCategorias(libro.CodLibro, categoriasIds);
            ReemplazarGeneros(libro.CodLibro, generosIds);

            _repo.SaveChanges();

            var actualizado = _repo.GetByCodigo(libro.CodLibro)!;
            return MapToDto(actualizado);
        }

        public bool DeleteLibro(int codigo)
        {
            var libro = _context.Libros.FirstOrDefault(l => l.CodLibro == codigo);
            if (libro == null)
                return false;
            _context.DetalleFacturas.Where(df => df.CodLibro == libro.CodLibro).ExecuteDelete();
            _context.DetallePedidos.Where(dp => dp.CodLibro == libro.CodLibro).ExecuteDelete();
            _context.AutoresLibros.Where(al => al.IdLibro == libro.CodLibro).ExecuteDelete();
            _context.LibrosCategorias.Where(lc => lc.IdLibro == libro.CodLibro).ExecuteDelete();
            _context.LibrosGeneros.Where(lg => lg.IdLibro == libro.CodLibro).ExecuteDelete();

            _repo.Delete(libro);
            _repo.SaveChanges();
            return true;
        }

        private static LibroDTO MapToDto(Libro l)
        {
            return new LibroDTO
            {
                Codigo = l.CodLibro.ToString(),
                Titulo = l.Titulo,
                Editorial = l.IdEditorialNavigation?.Editorial ?? "",
                Idioma = l.IdIdiomaNavigation?.Idioma1 ?? "",
                Autores = l.AutoresLibros
                    .Select(al => $"{al.IdAutorNavigation.Nombre} {al.IdAutorNavigation.Apellido}")
                    .ToList(),
                Categorias = l.LibrosCategoria
                    .Select(lc => lc.IdCategoriaNavigation.Categoria1)
                    .ToList(),
                Generos = l.LibrosGeneros
                    .Select(lg => lg.IdGeneroNavigation.Genero1)
                    .ToList(),
                Precio = l.Precio,
                Stock = l.Stock,
                AutoresIds = l.AutoresLibros.Select(al => al.IdAutor).ToList(),
                CategoriasIds = l.LibrosCategoria.Select(lc => lc.IdCategoria).ToList(),
                GenerosIds = l.LibrosGeneros.Select(lg => lg.IdGenero).ToList(),
                IdIdioma = l.IdIdioma
            };
        }

        private int ResolveEditorialId(LibroCreateUpdateDTO dto)
        {
            if (dto.IdEditorial > 0)
                return dto.IdEditorial;

            if (!string.IsNullOrWhiteSpace(dto.Editorial))
            {
                var target = Normalize(dto.Editorial);
                var existenteEditoriales = _context.Editoriales.ToList();
                var editorial = existenteEditoriales
                    .FirstOrDefault(e => Normalize(e.Editorial) == target);
                if (editorial != null)
                    return editorial.IdEditorial;

                var nuevo = new Editoriale
                {
                    Editorial = dto.Editorial.Trim()
                };
                _context.Editoriales.Add(nuevo);
                _context.SaveChanges();
                return nuevo.IdEditorial;
            }

            var existente = _context.Editoriales.FirstOrDefault();
            if (existente != null)
                return existente.IdEditorial;

            var creado = new Editoriale
            {
                Editorial = "Editorial pendiente"
            };
            _context.Editoriales.Add(creado);
            _context.SaveChanges();
            return creado.IdEditorial;
        }

        private int ResolveIdiomaId(LibroCreateUpdateDTO dto)
        {
            if (dto.IdIdioma > 0)
                return dto.IdIdioma;

            if (!string.IsNullOrWhiteSpace(dto.Idioma))
            {
                var target = Normalize(dto.Idioma);
                var idiomas = _context.Idiomas.ToList();
                var idioma = idiomas.FirstOrDefault(i => Normalize(i.Idioma1) == target);
                if (idioma != null)
                    return idioma.IdIdioma;

                var nuevo = new Idioma
                {
                    Idioma1 = dto.Idioma.Trim()
                };
                _context.Idiomas.Add(nuevo);
                _context.SaveChanges();
                return nuevo.IdIdioma;
            }

            var existente = _context.Idiomas.FirstOrDefault();
            if (existente != null)
                return existente.IdIdioma;

            var creado = new Idioma
            {
                Idioma1 = "Idioma pendiente"
            };
            _context.Idiomas.Add(creado);
            _context.SaveChanges();
            return creado.IdIdioma;
        }

        private List<int> ResolveAutorIds(LibroCreateUpdateDTO dto)
        {
            var resultado = new List<int>();

            if (dto.IdsAutores != null && dto.IdsAutores.Any())
            {
                resultado.AddRange(dto.IdsAutores.Where(id => id > 0));
            }

            if (dto.Autores == null || dto.Autores.Count == 0)
                return resultado.Distinct().ToList();

            var entradas = dto.Autores
                .Where(nombre => !string.IsNullOrWhiteSpace(nombre))
                .Select(nombre => nombre!.Trim())
                .ToList();

            if (!entradas.Any())
                return resultado.Distinct().ToList();

            var catalogo = new Dictionary<string, int>();
            var autoresCatalogo = _context.Autores
                .Select(a => new { a.IdAutor, a.Nombre, a.Apellido })
                .AsEnumerable();

            foreach (var autor in autoresCatalogo)
            {
                var clave = Normalize($"{autor.Nombre} {autor.Apellido}");
                if (!catalogo.ContainsKey(clave))
                {
                    catalogo[clave] = autor.IdAutor;
                }
            }

            foreach (var nombreCompleto in entradas)
            {
                var clave = Normalize(nombreCompleto);
                if (catalogo.TryGetValue(clave, out var idExistente))
                {
                    resultado.Add(idExistente);
                    continue;
                }

                var nuevoId = CrearAutorDesdeNombre(nombreCompleto);
                catalogo[clave] = nuevoId;
                resultado.Add(nuevoId);
            }

            return resultado.Distinct().ToList();
        }

        private List<int> ResolveCategoriaIds(LibroCreateUpdateDTO dto)
        {
            if (dto.IdsCategorias != null && dto.IdsCategorias.Any())
                return dto.IdsCategorias.Distinct().ToList();

            if (dto.Categorias == null || dto.Categorias.Count == 0)
                return new List<int>();

            var nombres = dto.Categorias
                .Select(Normalize)
                .Where(n => !string.IsNullOrEmpty(n))
                .Distinct()
                .ToList();

            if (!nombres.Any())
                return new List<int>();

            var catalogo = new Dictionary<string, int>();
            var categoriasCatalogo = _context.Categorias
                .Select(c => new { c.IdCategoria, c.Categoria1 })
                .AsEnumerable();

            foreach (var categoria in categoriasCatalogo)
            {
                var clave = Normalize(categoria.Categoria1);
                if (!catalogo.ContainsKey(clave))
                {
                    catalogo[clave] = categoria.IdCategoria;
                }
            }

            return nombres
                .Select(n => catalogo.TryGetValue(n, out var id) ? id : (int?)null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();
        }

        private List<int> ResolveGeneroIds(LibroCreateUpdateDTO dto)
        {
            if (dto.IdsGeneros != null && dto.IdsGeneros.Any())
                return dto.IdsGeneros.Distinct().ToList();

            if (dto.Generos == null || dto.Generos.Count == 0)
                return new List<int>();

            var nombres = dto.Generos
                .Select(Normalize)
                .Where(n => !string.IsNullOrEmpty(n))
                .Distinct()
                .ToList();

            if (!nombres.Any())
                return new List<int>();

            var catalogo = new Dictionary<string, int>();
            var generosCatalogo = _context.Generos
                .Select(g => new { g.IdGenero, g.Genero1 })
                .AsEnumerable();

            foreach (var genero in generosCatalogo)
            {
                var clave = Normalize(genero.Genero1);
                if (!catalogo.ContainsKey(clave))
                {
                    catalogo[clave] = genero.IdGenero;
                }
            }

            return nombres
                .Select(n => catalogo.TryGetValue(n, out var id) ? id : (int?)null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();
        }

        private static string Normalize(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? string.Empty
                : value.Trim().ToLowerInvariant();
        }

        private static string BuildDescripcion(string? raw)
        {
            return string.IsNullOrWhiteSpace(raw) ? "Sin descripción" : raw.Trim();
        }

        private static string BuildIsbn(string? raw)
        {
            if (!string.IsNullOrWhiteSpace(raw))
                return raw.Trim();

            return $"ISBN-{DateTime.UtcNow:yyyyMMddHHmmssfff}";
        }

        private static DateOnly BuildFecha(DateOnly? fecha)
        {
            return fecha ?? DateOnly.FromDateTime(DateTime.Today);
        }

        private int CrearAutorDesdeNombre(string nombreCompleto)
        {
            var limpio = nombreCompleto?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(limpio))
                limpio = "Autor pendiente";

            var partes = limpio.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var nombre = partes.Length > 0 ? partes[0] : "Autor";
            var apellido = partes.Length > 1 ? string.Join(" ", partes.Skip(1)) : "Pendiente";

            var autor = new Autore
            {
                Nombre = nombre,
                Apellido = apellido,
                Biografia = "Autor generado automáticamente.",
                IdNacionalidad = ObtenerIdNacionalidadDefault(),
                IdSexo = ObtenerIdSexoDefault()
            };

            _context.Autores.Add(autor);
            _context.SaveChanges();
            return autor.IdAutor;
        }

        private int ObtenerIdNacionalidadDefault()
        {
            var existente = _context.Nacionalidades.FirstOrDefault();
            if (existente != null)
                return existente.IdNacionalidad;

            var nuevo = new Nacionalidade
            {
                Nacionalidad = "Pendiente"
            };
            _context.Nacionalidades.Add(nuevo);
            _context.SaveChanges();
            return nuevo.IdNacionalidad;
        }

        private int ObtenerIdSexoDefault()
        {
            var existente = _context.Sexos.FirstOrDefault();
            if (existente != null)
                return existente.IdSexo;

            var nuevo = new Sexo
            {
                Sexo1 = "No especificado"
            };
            _context.Sexos.Add(nuevo);
            _context.SaveChanges();
            return nuevo.IdSexo;
        }

        private void ReemplazarAutores(int codLibro, List<int> nuevosIds)
        {
            _context.AutoresLibros
                .Where(al => al.IdLibro == codLibro)
                .ExecuteDelete();

            foreach (var idAutor in nuevosIds)
            {
                _context.AutoresLibros.Add(new AutoresLibro
                {
                    IdAutor = idAutor,
                    IdAutorLibro = ObtenerSiguienteIdAutoresLibro(),
                    IdLibro = codLibro
                });
            }
        }

        private void ReemplazarCategorias(int codLibro, List<int> nuevasCategorias)
        {
            _context.LibrosCategorias
                .Where(lc => lc.IdLibro == codLibro)
                .ExecuteDelete();

            foreach (var idCat in nuevasCategorias)
            {
                _context.LibrosCategorias.Add(new LibrosCategoria
                {
                    IdCategoria = idCat,
                    IdLibroCategoria = ObtenerSiguienteIdLibroCategoria(),
                    IdLibro = codLibro
                });
            }
        }

        private void ReemplazarGeneros(int codLibro, List<int> nuevosGeneros)
        {
            _context.LibrosGeneros
                .Where(lg => lg.IdLibro == codLibro)
                .ExecuteDelete();

            foreach (var idGen in nuevosGeneros)
            {
                _context.LibrosGeneros.Add(new LibrosGenero
                {
                    IdGenero = idGen,
                    IdLibroGenero = ObtenerSiguienteIdLibroGenero(),
                    IdLibro = codLibro
                });
            }
        }

        private int ObtenerSiguienteIdAutoresLibro()
        {
            if (!_ultimoAutorLibroId.HasValue)
            {
                var max = _context.AutoresLibros
                    .Select(al => (int?)al.IdAutorLibro)
                    .Max() ?? 0;
                _ultimoAutorLibroId = max + 1;
            }
            else
            {
                _ultimoAutorLibroId++;
            }

            return _ultimoAutorLibroId.Value;
        }

        private int ObtenerSiguienteIdLibroCategoria()
        {
            if (!_ultimoLibroCategoriaId.HasValue)
            {
                var max = _context.LibrosCategorias
                    .Select(lc => (int?)lc.IdLibroCategoria)
                    .Max() ?? 0;
                _ultimoLibroCategoriaId = max + 1;
            }
            else
            {
                _ultimoLibroCategoriaId++;
            }

            return _ultimoLibroCategoriaId.Value;
        }

        private int ObtenerSiguienteIdLibroGenero()
        {
            if (!_ultimoLibroGeneroId.HasValue)
            {
                var max = _context.LibrosGeneros
                    .Select(lg => (int?)lg.IdLibroGenero)
                    .Max() ?? 0;
                _ultimoLibroGeneroId = max + 1;
            }
            else
            {
                _ultimoLibroGeneroId++;
            }

            return _ultimoLibroGeneroId.Value;
        }

    }
}
