using Libreria_API.Models;
using Libreria_API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Libreria_API.DTOs
{
    public class UpdateEstadoDTO
    {
        public int NuevoEstadoId { get; set; }
        public string? Observaciones { get; set; }
    }
}