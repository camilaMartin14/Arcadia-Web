using Libreria_API.Models;
using Libreria_API.Repositories;
using Libreria_API.Repositories.Implementations;
using Libreria_API.Repositories.Interfaces;
using Libreria_API.Services;
using Libreria_API.Services.Implementations;
using Libreria_API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);


// 1. Configuración de la autenticación
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Carga la clave secreta de la configuración (por ejemplo, appsettings.json)
    var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:Key"]);

    options.SaveToken = true; // Guarda el token en el HttpContext
    options.RequireHttpsMetadata = false; // Solo para desarrollo/pruebas. En prod debe ser 'true'
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"], // El emisor (issuer)
        ValidAudience = builder.Configuration["Jwt:Audience"], // La audiencia (audience)
        IssuerSigningKey = new SymmetricSecurityKey(key), // La clave secreta
        ClockSkew = TimeSpan.Zero // Elimina la tolerancia de tiempo por defecto (5 minutos)
    };
});

// 2. Configuración de la autorización
builder.Services.AddAuthorization();


// Configurar CORS para desarrollo: acepta cualquier frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend",
        policy =>
        {
            policy.AllowAnyOrigin()      // permite cualquier origen
                  .AllowAnyHeader()      // permite cualquier header
                  .AllowAnyMethod();     // permite cualquier m�todo (GET, POST, etc)
        });
});

builder.Services.AddDbContext<LibreriaContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("CamiConnection")));

  


builder.Services.AddScoped<ILibroRepository, LibroRepository>();
builder.Services.AddScoped<ILibroService, LibroService>();

builder.Services.AddScoped<IPedidoRepository, PedidoRepository>();
builder.Services.AddScoped<IPedidoService, PedidoService>();

builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IClienteService, ClienteService>();

builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// **Importante:** CORS antes de Authorization
app.UseCors("PermitirFrontend");

app.UseAuthentication();


app.MapControllers();

app.Run();
