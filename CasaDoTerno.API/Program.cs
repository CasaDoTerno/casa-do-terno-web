using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Application.Services;
using CasaDoTerno.Infrastructure;
using CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Microsoft.AspNetCore.Identity;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddDbContext<CasaDoTernoContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
// ensina o .NET: sempre que alguém pedir ICasaDoTernoContext, entregue o CasaDoTernoContext real
builder.Services.AddScoped<ICasaDoTernoContext>(sp => sp.GetRequiredService<CasaDoTernoContext>());
builder.Services.AddScoped<LocacaoService>();
builder.Services.AddScoped<VendaService>();
builder.Services.AddScoped<LocacaoService>();
builder.Services.AddScoped<CompraService>();
builder.Services.AddScoped<RelatorioService>();
builder.Services.AddScoped<ParcelaService>();
builder.Services.AddScoped<DespesaService>();
builder.Services.AddIdentityApiEndpoints<IdentityUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<CasaDoTernoContext>();


builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirReact", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://casa-do-terno-web-fawn.vercel.app"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    string[] papeis = { "Admin", "Vendedor" };
    foreach (var papel in papeis)
    {
        if (!await roleManager.RoleExistsAsync(papel))
            await roleManager.CreateAsync(new IdentityRole(papel));
    }
}

app.UseCors("PermitirReact");
app.UseAuthentication();
app.UseAuthorization();

app.MapIdentityApi<IdentityUser>(); // cria automaticamente /register, /login, /refresh

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapScalarApiReference(); // expõe a telinha visual (substitui o Swagger UI)
    app.MapOpenApi();
}


app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapControllers(); 

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

