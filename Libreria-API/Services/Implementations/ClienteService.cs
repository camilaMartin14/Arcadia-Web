using Libreria_API.DTOs;
using Libreria_API.Models;
using Libreria_API.Repositories.Interfaces;
using Libreria_API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic; 
using System.Linq; 

namespace Libreria_API.Services.Implementations
{
    public class ClienteService : IClienteService
    {
        private readonly IConfiguration _configuration;
        private readonly IClienteRepository _repo;
        private readonly PasswordHasher<Cliente> _hasher;

        public ClienteService(IClienteRepository repo, IConfiguration configuration)
        {
            _repo = repo;
            _hasher = new PasswordHasher<Cliente>();
            _configuration = configuration;
        }

        public async Task<Cliente?> LoginAsync(string usuario, string contraseña)
        {
            var cliente = await _repo.ObtenerPorUsuarioAsync(usuario);

            if (cliente == null) return null;

            var resultado = _hasher.VerifyHashedPassword(
                cliente,
                cliente.IdUsuarioNavigation.ContrasenaHash, // hash guardado en la BD
                contraseña //  ingresada por el usuario
            );

            return resultado == PasswordVerificationResult.Success ? cliente : null;
        }

        public async Task<IEnumerable<object>> ObtenerClientesAsync(string busqueda = null)
        {
            var clientes = await _repo.ObtenerClientesAsync(busqueda);

            return clientes.Select(c => new
            {
                codigo = c.CodCliente,
                nombre = $"{c.Apellido} {c.Nombre}",
                compras = c.Pedidos.Count,
                contacto = c.Email
            });
        }

        public async Task RegistrarAsync(Cliente c, Usuario u)
        {
            if (await _repo.ExisteUsuarioAsync(u.NombreUsuario))
                throw new Exception("El nombre de usuario ya existe.");


            var usuario = new Usuario
            {
                NombreUsuario = u.NombreUsuario,
                ContrasenaHash = _hasher.HashPassword(null, u.ContrasenaHash),
                Rol = "Cliente",
                FechaAlta = DateTime.Now
            };

            var cliente = new Cliente
            {
                Nombre = c.Nombre,
                Apellido = c.Apellido,
                NroDoc = c.NroDoc,
                IdTipoDoc = c.IdTipoDoc,
                IdSexo = c.IdSexo,
                IdNacionalidad = c.IdNacionalidad,
                FechaRegistro = DateTime.Now,
                FechaNacimiento = c.FechaNacimiento,
                IdBarrio = c.IdBarrio,
                Calle = c.Calle,
                Nro = c.Nro,
                Piso = c.Piso,
                Dpto = c.Dpto,
                Cp = c.Cp,
                Email = c.Email
            };

            await _repo.AgregarClienteConUsuarioAsync(cliente, usuario);
        }
        public string GenerateJwtToken(string userId, string userName, IList<string> roles)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, userId),
        new Claim(ClaimTypes.Name, userName)
    };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(7), // El token expira en 7 días
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = creds
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}


