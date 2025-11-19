namespace Libreria_API.DTOs
{
    public class RegistroDTO
    {
        //Datos de acceso
        public string NombreUsuario { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;

        //Datos personales
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public int NroDoc { get; set; }
        public int IdTipoDoc { get; set; }
        public int IdSexo { get; set; }
        public int IdNacionalidad { get; set; }
        public DateOnly? FechaNacimiento { get; set; }

        //Datos de domicilio
        public int IdBarrio { get; set; }
        public string Calle { get; set; } = string.Empty;
        public int Nro { get; set; }
        public string Piso { get; set; } = string.Empty;
        public string Dpto { get; set; } = string.Empty;
        public string Cp { get; set; } = string.Empty;

        // contacto
        public string Email { get; set; } = string.Empty;

        //tipo de usuario
        public string Rol { get; set; } = "Cliente";
    }
}
