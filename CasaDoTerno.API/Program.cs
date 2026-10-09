using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Application.Services;
using CasaDoTerno.Infrastructure;
using CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

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
builder.Services.AddScoped<CompraService>();
builder.Services.AddScoped<RelatorioService>();
builder.Services.AddScoped<ParcelaService>();
builder.Services.AddScoped<DespesaService>();
builder.Services.AddScoped<AuditoriaService>();
builder.Services.AddScoped<FuncionarioService>();
builder.Services.AddScoped<DespesaRecorrenteService>();
builder.Services.AddIdentityApiEndpoints<IdentityUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<CasaDoTernoContext>();

// chaves de assinatura dos tokens ficam no Neon: sobrevivem a deploy e reinício do Render
builder.Services.AddDataProtection()
    .SetApplicationName("CasaDoTerno")
    .PersistKeysToDbContext<CasaDoTernoContext>();

// validade da sessão
builder.Services.Configure<BearerTokenOptions>(IdentityConstants.BearerScheme, opcoes =>
{
    opcoes.BearerTokenExpiration = TimeSpan.FromHours(12);   // token de acesso (antes: 1 hora)
    opcoes.RefreshTokenExpiration = TimeSpan.FromDays(30);   // por quanto tempo dá pra renovar sozinho (antes: 14 dias)
});

builder.Services.AddSingleton(new EmailService(
    builder.Configuration["Brevo:ApiKey"]!,
    builder.Configuration["Brevo:RemetenteEmail"]!,
    builder.Configuration["Brevo:RemetenteNome"]!
));

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

app.MapGet("/health", () => Results.Ok("OK"));
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

app.MapControllers();

app.Run();
