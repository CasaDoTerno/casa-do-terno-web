using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaDoTerno.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly CasaDoTernoContext _dbContext;
    public UsuariosController(UserManager<IdentityUser> userManager, CasaDoTernoContext dbContext)
    {
        _userManager = userManager;
        _dbContext = dbContext;
    }

    private static readonly string[] ModulosSensiveis = { "financeiro", "compras", "fornecedores", "usuarios", "relatorios" };
    [HttpPut("{id}/perfil-acesso")]
    public async Task<IActionResult> VincularPerfil(string id, [FromBody] VincularPerfilRequest request)
    {
        var usuario = await _userManager.FindByIdAsync(id);
        if (usuario == null)
            return NotFound();

        var perfil = _dbContext.Perfis.Find(request.PerfilId);
        if (perfil == null)
            return BadRequest("Perfil não encontrado.");

        var vinculoExistente = _dbContext.UsuarioPerfis.FirstOrDefault(up => up.UsuarioId == id);
        if (vinculoExistente != null)
            vinculoExistente.PerfilId = request.PerfilId;
        else
            _dbContext.UsuarioPerfis.Add(new UsuarioPerfil { UsuarioId = id, PerfilId = request.PerfilId });

        _dbContext.SaveChanges();

        // sincroniza o papel do Identity automaticamente, com base nos módulos do perfil
        var modulos = perfil.ModulosPermitidos.Split(',', StringSplitOptions.RemoveEmptyEntries);
        bool precisaSerAdmin = modulos.Any(m => ModulosSensiveis.Contains(m.Trim().ToLower()));

        var papeisAtuais = await _userManager.GetRolesAsync(usuario);
        if (papeisAtuais.Count > 0)
            await _userManager.RemoveFromRolesAsync(usuario, papeisAtuais);

        await _userManager.AddToRoleAsync(usuario, precisaSerAdmin ? "Admin" : "Vendedor");

        return Ok(new { mensagem = "Perfil vinculado com sucesso." });
    }

    public class VincularPerfilRequest
    {
        public int PerfilId { get; set; }
    }

    [HttpGet("perfil")]
    public async Task<IActionResult> Perfil()
    {
        var usuario = await _userManager.FindByNameAsync(User.Identity!.Name!);
        if (usuario == null)
            return NotFound();

        var papeis = await _userManager.GetRolesAsync(usuario);
        var papel = papeis.FirstOrDefault() ?? "Vendedor";

        var vinculo = _dbContext.UsuarioPerfis.FirstOrDefault(up => up.UsuarioId == usuario.Id);
        string modulosPermitidos = "";
        if (vinculo != null)
        {
            var perfilDoUsuario = _dbContext.Perfis.Find(vinculo.PerfilId);
            modulosPermitidos = perfilDoUsuario?.ModulosPermitidos ?? "";
        }

        return Ok(new { email = usuario.Email, papel, modulosPermitidos });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var usuarios = _userManager.Users.ToList();
        var resultado = new List<object>();

        foreach (var usuario in usuarios)
        {
            var papeis = await _userManager.GetRolesAsync(usuario);
            var vinculo = _dbContext.UsuarioPerfis.FirstOrDefault(up => up.UsuarioId == usuario.Id);
            var perfilNome = vinculo != null ? _dbContext.Perfis.Find(vinculo.PerfilId)?.Nome : null;

            resultado.Add(new
            {
                id = usuario.Id,
                email = usuario.Email,
                papel = papeis.FirstOrDefault() ?? "Vendedor",
                perfilId = vinculo?.PerfilId,
                perfilNome
            });
        }

        return Ok(resultado);
    }
    [HttpGet("lista-simples")]
    public IActionResult ListaSimples()
    {
        var usuarios = _userManager.Users
            .Select(u => new { id = u.Id, email = u.Email })
            .ToList();

        return Ok(usuarios);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("{id}")]
    public async Task<IActionResult> BuscarPorId(string id)
    {
        var usuario = await _userManager.FindByIdAsync(id);
        if (usuario == null)
            return NotFound();

        var papeis = await _userManager.GetRolesAsync(usuario);
        var vinculo = _dbContext.UsuarioPerfis.FirstOrDefault(up => up.UsuarioId == id);

        return Ok(new
        {
            id = usuario.Id,
            email = usuario.Email,
            papel = papeis.FirstOrDefault() ?? "Vendedor",
            perfilId = vinculo?.PerfilId
        });
    }
    public class CriarUsuarioRequest
    {
        public string Email { get; set; } = "";
        public string Senha { get; set; } = "";
        public string Papel { get; set; } = "Vendedor";
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarUsuarioRequest request)
    {
        var novoUsuario = new IdentityUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true
        };

        var resultado = await _userManager.CreateAsync(novoUsuario, request.Senha);

        if (!resultado.Succeeded)
        {
            var erros = string.Join("; ", resultado.Errors.Select(e => e.Description));
            return BadRequest(erros);
        }

        await _userManager.AddToRoleAsync(novoUsuario, request.Papel);

        return Ok(new { mensagem = "Usuário criado com sucesso." });
    }

    public class ResetarSenhaRequest
    {
        public string NovaSenha { get; set; } = "";
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/senha")]
    public async Task<IActionResult> ResetarSenha(string id, [FromBody] ResetarSenhaRequest request)
    {
        var usuario = await _userManager.FindByIdAsync(id);
        if (usuario == null)
            return NotFound();

        var token = await _userManager.GeneratePasswordResetTokenAsync(usuario);
        var resultado = await _userManager.ResetPasswordAsync(usuario, token, request.NovaSenha);

        if (!resultado.Succeeded)
        {
            var erros = string.Join("; ", resultado.Errors.Select(e => e.Description));
            return BadRequest(erros);
        }

        return Ok(new { mensagem = "Senha redefinida com sucesso." });
    }

    public class DefinirPapelRequest
    {
        public string Papel { get; set; } = "Vendedor";
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/papel")]
    public async Task<IActionResult> DefinirPapel(string id, [FromBody] DefinirPapelRequest request)
    {
        var usuario = await _userManager.FindByIdAsync(id);
        if (usuario == null)
            return NotFound();

        var papeisAtuais = await _userManager.GetRolesAsync(usuario);
        if (papeisAtuais.Count > 0)
            await _userManager.RemoveFromRolesAsync(usuario, papeisAtuais);

        await _userManager.AddToRoleAsync(usuario, request.Papel);

        return Ok(new { mensagem = "Papel atualizado com sucesso." });
    }
}