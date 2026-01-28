using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TraceOps.Api.Data;
using TraceOps.Api.Models;

namespace TraceOps.Api.Controllers;

[ApiController]
[Route("dev")]
public class DevController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHostEnvironment _env;
    private readonly IConfiguration _cfg;

    public DevController(AppDbContext db, IHostEnvironment env, IConfiguration cfg)
    {
        _db = db;
        _env = env;
        _cfg = cfg;
    }

    private bool BootstrapAllowed()
    {
        if (_env.IsDevelopment()) return true;
        return _cfg["ALLOW_BOOTSTRAP"] == "true";
    }

    public record CreateTenantRequest(string name);

    [HttpPost("tenants")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest req)
    {
        if (!BootstrapAllowed()) return NotFound();
        if (string.IsNullOrWhiteSpace(req.name)) return BadRequest("name required");

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = req.name.Trim()
        };

        _db.Tenants.Add(tenant);
        await _db.SaveChangesAsync();

        return Ok(new { id = tenant.Id, name = tenant.Name });
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> ListTenants()
    {
        if (!BootstrapAllowed()) return NotFound();

        var items = await _db.Tenants.AsNoTracking()
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new { id = t.Id, name = t.Name, createdAt = t.CreatedAt })
            .ToListAsync();

        return Ok(new { items });
    }
}
