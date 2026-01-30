using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TraceOps.Api.Auth;
using TraceOps.Api.Data;
using TraceOps.Api.Models;

namespace TraceOps.Api.Controllers;

[ApiController]
[Route("dev/apikeys")]
public class DevApiKeysController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHostEnvironment _env;
    private readonly IConfiguration _cfg;

    public DevApiKeysController(AppDbContext db, IHostEnvironment env, IConfiguration cfg)
    {
        _db = db;
        _env = env;
        _cfg = cfg;
    }

    public record CreateApiKeyRequest(Guid tenantId, string? name);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateApiKeyRequest req)
    {
        // DEV only (or ALLOW_BOOTSTRAP=true)
        if (!_env.IsDevelopment() && _cfg["ALLOW_BOOTSTRAP"] != "true")
            return NotFound();

        var tenantExists = await _db.Tenants.AnyAsync(t => t.Id == req.tenantId);
        if (!tenantExists) return BadRequest("Tenant not found");

        // ✅ generate raw key and store only hash
        var rawKey = ApiKeyHasher.GenerateKey();
        var hash = ApiKeyHasher.Hash(rawKey);

        var apiKey = new ApiKey
        {
            Id = Guid.NewGuid(),
            TenantId = req.tenantId,
            Name = string.IsNullOrWhiteSpace(req.name) ? "Default key" : req.name,
            KeyHash = hash
        };

        _db.ApiKeys.Add(apiKey);
        await _db.SaveChangesAsync();

        // IMPORTANT: return raw key only once
        return Ok(new
        {
            id = apiKey.Id,
            tenantId = apiKey.TenantId,
            name = apiKey.Name,
            apiKey = rawKey
        });
    }
}
