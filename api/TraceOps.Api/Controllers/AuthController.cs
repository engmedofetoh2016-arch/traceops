using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TraceOps.Api.Data;
using TraceOps.Api.Models;

namespace TraceOps.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _cfg;

    public AuthController(AppDbContext db, IConfiguration cfg)
    {
        _db = db;
        _cfg = cfg;
    }

    public record LoginRequest(Guid tenantId, string email, string password);
    public record RegisterRequest(Guid tenantId, string email, string password, string role);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.TenantId == req.tenantId && u.Email == req.email);

        if (user is null) return Unauthorized("Invalid credentials");
        if (!BCrypt.Net.BCrypt.Verify(req.password, user.PasswordHash))
            return Unauthorized("Invalid credentials");

        var token = CreateJwt(user);

        return Ok(new
        {
            token,
            user = new { id = user.Id, email = user.Email, role = user.Role, tenantId = user.TenantId }
        });
    }

    // Dev-only: create first user for a tenant
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (!HttpContext.RequestServices.GetRequiredService<IHostEnvironment>().IsDevelopment())
            return NotFound();

        var exists = await _db.Users.AnyAsync(u => u.TenantId == req.tenantId && u.Email == req.email);
        if (exists) return BadRequest("User already exists");

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = req.tenantId,
            Email = req.email,
            Role = string.IsNullOrWhiteSpace(req.role) ? "ADMIN" : req.role,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { id = user.Id });
    }

    private string CreateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim("tenantId", user.TenantId.ToString()),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Email, user.Email)
        };

        var expires = DateTime.UtcNow.AddMinutes(int.Parse(_cfg["Jwt:ExpiryMinutes"]!));

        var token = new JwtSecurityToken(
            issuer: _cfg["Jwt:Issuer"],
            audience: _cfg["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
