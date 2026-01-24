using Microsoft.AspNetCore.Mvc;
using TraceOps.Api.Data;
using TraceOps.Api.Models;

namespace TraceOps.Api.Controllers;

[ApiController]
[Route("automation")]
public class AutomationController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _cfg;

    public AutomationController(AppDbContext db, IConfiguration cfg)
    {
        _db = db;
        _cfg = cfg;
    }
     
    public record CreateAlertDto(
        Guid tenantId,
        Guid? eventId,
        string type,
        string severity,
        string title,
        string? details
    );

    [HttpPost("alerts")]
    public async Task<IActionResult> CreateAlert([FromBody] CreateAlertDto dto)
    {
        var secret = Request.Headers["X-TraceOps-Secret"].ToString();
        if (secret != _cfg["Automation:InboundSecret"])
            return Unauthorized("Invalid automation secret");

        var alert = new Alert
        {
            Id = Guid.NewGuid(),
            TenantId = dto.tenantId,
            EventId = dto.eventId,
            Type = dto.type,
            Severity = dto.severity,
            Title = dto.title,
            Details = dto.details
        };

        _db.Alerts.Add(alert);
        await _db.SaveChangesAsync();

        return Ok(new { id = alert.Id });
    }
}
