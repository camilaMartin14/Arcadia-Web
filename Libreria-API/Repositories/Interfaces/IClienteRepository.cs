using Libreria_API.Models;

namespace Libreria_API.Repositories.Interfaces
{
        public interface IClienteRepository
        {
            Task<Cliente?> ObtenerPorUsuarioAsync(string usuario);
            Task<Cliente> AgregarClienteConUsuarioAsync(Cliente cliente, Usuario usuario);
            Task<bool> ExisteUsuarioAsync(string nombreUsuario);
            Task GuardarCambiosAsync();

            Task<IEnumerable<Cliente>> ObtenerClientesAsync(string busqueda = null);
    }
    }
