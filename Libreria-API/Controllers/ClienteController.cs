using Libreria_API.DTOs;
using Libreria_API.Models;
using Libreria_API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Libreria_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClienteController : ControllerBase
    {
        private readonly IClienteService _service;

        public ClienteController(IClienteService service)
        {
            _service = service;
        }

        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar([FromBody] RegistroDTO dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.NombreUsuario) || string.IsNullOrWhiteSpace(dto.Contrasena))
                    return BadRequest("El usuario y la contraseña son obligatorios.");

                if (string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Apellido))
                    return BadRequest("El nombre y apellido son obligatorios.");


                var usuario = new Usuario
                {
                    NombreUsuario = dto.NombreUsuario,
                    ContrasenaHash = dto.Contrasena,
                    Rol = "Cliente",
                    FechaAlta = DateTime.Now
                };

                var cliente = new Cliente
                {
                    Nombre = dto.Nombre,
                    Apellido = dto.Apellido,
                    NroDoc = dto.NroDoc,
                    IdTipoDoc = dto.IdTipoDoc,
                    IdSexo = dto.IdSexo,
                    IdNacionalidad = dto.IdNacionalidad,
                    FechaRegistro = DateTime.Now,
                    FechaNacimiento = dto.FechaNacimiento,
                    IdBarrio = dto.IdBarrio,
                    Calle = dto.Calle,
                    Nro = dto.Nro,
                    Piso = dto.Piso,
                    Dpto = dto.Dpto,
                    Cp = dto.Cp,
                    Email = dto.Email
                };

                await _service.RegistrarAsync(cliente, usuario);

                return CreatedAtAction(nameof(Login), new { usuario = dto.NombreUsuario },
                    new { mensaje = "Cliente registrado con éxito. Use el endpoint /api/cliente/login para iniciar sesión." });

            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }

            //TESTEADO OK, GENERA TOKEN
            //    {
            //    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxMSIsInVuaXF1ZV9uYW1lIjoiY2FtaTEyMyIsInJvbGUiOiJDbGllbnRlIiwibmJmIjoxNzYzNDc3MjMwLCJleHAiOjE3NjQwODIwMzAsImlhdCI6MTc2MzQ3NzIzMCwiaXNzIjoiVHVBcGlJc3N1ZXIiLCJhdWQiOiJUdUFwaUF1ZGllbmNlIn0.FZ5Im_LKWP5bjgY4-HhDl_dKBEpz5Umx_jB3avbrS_Y",
            //      "mensaje": "Login exitoso",
            //      "idCliente": 13,
            //      "nombre": "Camila",
            //      "apellido": "Martin",
            //      "rol": "Cliente"
            //}
        }
        

        [HttpGet]
        public async Task<IActionResult> GetClientes([FromQuery] string busqueda = null)
        {
            try
            {
                var clientes = await _service.ObtenerClientesAsync(busqueda);
                return Ok(clientes);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Usuario) || string.IsNullOrWhiteSpace(dto.Contraseña))
                return BadRequest("Usuario y contraseña requeridos.");

            var cliente = await _service.LoginAsync(dto.Usuario, dto.Contraseña);

            if (cliente == null)
                return Unauthorized("Usuario o contraseña incorrectos.");

            var roles = new List<string> { cliente.IdUsuarioNavigation.Rol };
            string userId = cliente.IdUsuario.ToString();
            string userName = cliente.IdUsuarioNavigation.NombreUsuario;

            var token = _service.GenerateJwtToken(userId, userName, roles);

            return Ok(new
            {
                Token = token,
                mensaje = "Login exitoso",
                idCliente = cliente.CodCliente,
                nombre = cliente.Nombre,
                apellido = cliente.Apellido,
                rol = cliente.IdUsuarioNavigation.Rol // Incluir el rol puede ser útil para el frontend
            });

        }
    }
}
