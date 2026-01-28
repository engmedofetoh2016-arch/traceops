using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TraceOps.Api.Data;
using TraceOps.Api.Models;

namespace TraceOps.Api.Controllers;

[ApiController]
[Route("v1/alerts")]
public class AlertsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AlertsController(AppDbContext db) => _db = db;

    private Guid TenantId => Guid.Parse(User.Claims.First(c => c.Type == "tenantId").Value);

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool? resolved = null, [FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        if (limit < 1) limit = 1;
        if (limit > 200) limit = 200;
        if (offset < 0) offset = 0;


        var q = _db.Alerts.AsNoTracking().Where(a => a.TenantId == TenantId);
        if (resolved.HasValue) q = q.Where(a => a.IsResolved == resolved.Value);

        var total = await q.CountAsync();

        var items = await q.OrderByDescending(a => a.CreatedAt)
            .Skip(offset).Take(limit)
            .Select(a => new
            {
                id = a.Id,
                createdAt = a.CreatedAt,
                type = a.Type,
                severity = a.Severity,
                title = a.Title,
                details = a.Details,
                eventId = a.EventId,
                isResolved = a.IsResolved
            })
            .ToListAsync();

        return Ok(new { paging = new { limit, offset, total }, items });
    }
    public record CreateAlertRequest(
    Guid? eventId,
    string type,
    string severity,
    string title,
    string? details
);

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAlertRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.type)) return BadRequest("type required");
        if (string.IsNullOrWhiteSpace(req.title)) return BadRequest("title required");

        var alert = new Alert
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            EventId = req.eventId,
            Type = req.type.Trim(),
            Severity = string.IsNullOrWhiteSpace(req.severity) ? "MEDIUM" : req.severity.Trim().ToUpperInvariant(),
            Title = req.title.Trim(),
            Details = req.details
        };

        _db.Alerts.Add(alert);
        await _db.SaveChangesAsync();

        return Ok(new { id = alert.Id });
    }
    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOne([FromRoute] Guid id)
    {
        var a = await _db.Alerts.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == TenantId);

        if (a is null) return NotFound();

        return Ok(new
        {
            id = a.Id,
            createdAt = a.CreatedAt,
            type = a.Type,
            severity = a.Severity,
            title = a.Title,
            details = a.Details,
            eventId = a.EventId,
            isResolved = a.IsResolved,
            resolvedAt = a.ResolvedAt
        });
    }
    [Authorize]
    [HttpPatch("{id:guid}/resolve")]
    public async Task<IActionResult> Resolve([FromRoute] Guid id)
    {
        var alert = await _db.Alerts.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == TenantId);
        if (alert is null) return NotFound();

        if (!alert.IsResolved)
        {
            alert.IsResolved = true;
            alert.ResolvedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
        }

        return Ok(new { id = alert.Id, isResolved = alert.IsResolved, resolvedAt = alert.ResolvedAt });
    }



}
