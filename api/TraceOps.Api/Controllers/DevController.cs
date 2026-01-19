using Microsoft.AspNetCore.Mvc;
using TraceOps.Api.Auth;
using TraceOps.Api.Data;
using TraceOps.Api.Models;

namespace TraceOps.Api.Controllers;

[ApiController]
[Route("dev")]
public class DevController : ControllerBase
{
    private readonly AppDbContext _db;
    public DevController(AppDbContext db) => _db = db;

    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Demo Tenant"
        };

        // This is the ONLY time you will see the plaintext key
        var plainKey = $"to_{Guid.NewGuid():N}";

        var apiKey = new ApiKey
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            KeyHash = ApiKeyHasher.Hash(plainKey),
            Name = "Demo Key"
        };

        _db.Tenants.Add(tenant);
        _db.ApiKeys.Add(apiKey);

        await _db.SaveChangesAsync();

        return Ok(new { tenantId = tenant.Id, apiKey = plainKey });
    }
}
