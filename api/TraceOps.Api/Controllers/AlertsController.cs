using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TraceOps.Api.Data;

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
    public async Task<IActionResult> List([FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        if (limit < 1) limit = 1;
        if (limit > 200) limit = 200;
        if (offset < 0) offset = 0;

        var q = _db.Alerts.AsNoTracking().Where(a => a.TenantId == TenantId);

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
}
