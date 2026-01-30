using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using TraceOps.Api.Data;
using TraceOps.Api.Models;
using TraceOps.Api.Reports;

namespace TraceOps.Api.Controllers;

[ApiController]
[Route("v1/reports")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    private Guid TenantId => Guid.Parse(User.Claims.First(c => c.Type == "tenantId").Value);

    [Authorize]
    [HttpGet("events.csv")]
    public async Task<IActionResult> ExportEventsCsv(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] string? actor,
        [FromQuery] string? action,
        [FromQuery] string? resource,
        [FromQuery] string? q)
    {
        var tenantId = TenantId;

        var queryable = _db.AuditEvents.AsNoTracking().Where(e => e.TenantId == tenantId);

        if (from.HasValue) queryable = queryable.Where(e => e.OccurredAt >= from.Value);
        if (to.HasValue) queryable = queryable.Where(e => e.OccurredAt <= to.Value);

        if (!string.IsNullOrWhiteSpace(actor)) queryable = queryable.Where(e => e.Actor == actor);
        if (!string.IsNullOrWhiteSpace(action)) queryable = queryable.Where(e => e.Action == action);
        if (!string.IsNullOrWhiteSpace(resource)) queryable = queryable.Where(e => e.Resource == resource);

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.Trim();
            queryable = queryable.Where(e =>
                e.Actor.Contains(q) ||
                e.Action.Contains(q) ||
                e.Resource.Contains(q) ||
                (e.ResourceId != null && e.ResourceId.Contains(q)) ||
                (e.Result != null && e.Result.Contains(q)) ||
                (e.Ip != null && e.Ip.Contains(q)));
        }

        // Guardrail: don’t allow “All time” export by mistake (optional)
        // If you want, you can remove this.
        if (!from.HasValue && !to.HasValue)
            return BadRequest("Please provide from/to date range.");

        var rows = await queryable
            .OrderByDescending(e => e.OccurredAt)
            .Select(e => new
            {
                e.OccurredAt,
                e.Actor,
                e.Action,
                e.Resource,
                e.ResourceId,
                e.Ip,
                e.Result
            })
            .ToListAsync();

        static string Esc(string? s)
        {
            s ??= "";
            if (s.Contains('"') || s.Contains(',') || s.Contains('\n') || s.Contains('\r'))
                return "\"" + s.Replace("\"", "\"\"") + "\"";
            return s;
        }

        var sb = new StringBuilder();
        sb.AppendLine("occurredAt,actor,action,resource,resourceId,ip,result");

        foreach (var r in rows)
        {
            sb.Append(Esc(r.OccurredAt.ToString("O"))).Append(',')
              .Append(Esc(r.Actor)).Append(',')
              .Append(Esc(r.Action)).Append(',')
              .Append(Esc(r.Resource)).Append(',')
              .Append(Esc(r.ResourceId)).Append(',')
              .Append(Esc(r.Ip)).Append(',')
              .Append(Esc(r.Result)).AppendLine();
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"traceops-events-{DateTime.UtcNow:yyyyMMdd-HHmm}.csv";

        return File(bytes, "text/csv; charset=utf-8", fileName);
    }
    [Authorize]
    [HttpGet("summary")]
    public async Task<IActionResult> Summary(
    [FromQuery] DateTimeOffset from,
    [FromQuery] DateTimeOffset to)
    {
        if (to < from) return BadRequest("Invalid range");
        if (to - from > TimeSpan.FromDays(120)) return BadRequest("Range too large (max 120 days)");

        var tenantId = TenantId;

        var baseQ = _db.AuditEvents.AsNoTracking()
            .Where(e => e.TenantId == tenantId && e.OccurredAt >= from && e.OccurredAt <= to);

        var total = await baseQ.CountAsync();

        var success = await baseQ.Where(e => e.Result == "SUCCESS").CountAsync();
        var failed = await baseQ.Where(e => e.Result != null && e.Result != "SUCCESS").CountAsync();

        // “high-risk” = exports (simple MVP heuristic)
        var exports = await baseQ.Where(e => e.Action == "EXPORT_DATA").CountAsync();

        var topActions = await baseQ
            .GroupBy(e => e.Action)
            .Select(g => new { key = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(6)
            .ToListAsync();

        var topActors = await baseQ
            .GroupBy(e => e.Actor)
            .Select(g => new { key = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(6)
            .ToListAsync();

        return Ok(new
        {
            from,
            to,
            totals = new
            {
                events = total,
                success,
                failed,
                exports
            },
            topActions,
            topActors
        });
    }
    public record AuditPackRequest(DateTimeOffset from, DateTimeOffset to);

    [Authorize]
    [HttpPost("audit-pack")]
    public async Task<IActionResult> CreateAuditPack([FromBody] AuditPackRequest req)
    {
        if (req.to < req.from) return BadRequest("Invalid range");
        if (req.to - req.from > TimeSpan.FromDays(120)) return BadRequest("Range too large (max 120 days)");

        var tenantId = TenantId;

        // Tenant name (optional but makes PDF nicer)
        var tenantName = await _db.Tenants.AsNoTracking()
            .Where(t => t.Id == tenantId)
            .Select(t => t.Name)
            .FirstOrDefaultAsync() ?? "Tenant";

        var baseQ = _db.AuditEvents.AsNoTracking()
            .Where(e => e.TenantId == tenantId && e.OccurredAt >= req.from && e.OccurredAt <= req.to);

        var total = await baseQ.CountAsync();
        var success = await baseQ.CountAsync(e => e.Result == "SUCCESS");
        var failed = await baseQ.CountAsync(e => e.Result != null && e.Result != "SUCCESS");
        var exports = await baseQ.CountAsync(e => e.Action == "EXPORT_DATA");

        var topActions = await baseQ
            .GroupBy(e => e.Action)
            .Select(g => new { key = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(8)
            .ToListAsync();

        var topActors = await baseQ
            .GroupBy(e => e.Actor)
            .Select(g => new { key = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(8)
            .ToListAsync();

        var data = new AuditPackData(
            TenantName: tenantName,
            From: req.from,
            To: req.to,
            TotalEvents: total,
            Success: success,
            Failed: failed,
            Exports: exports,
            TopActions: topActions.Select(x => (x.key, x.count)).ToList(),
            TopActors: topActors.Select(x => (x.key, x.count)).ToList(),
            GeneratedAtUtc: DateTimeOffset.UtcNow
        );

        // Build PDF bytes
        var pdfBytes = AuditPackPdf.Build(data);

        // Store as a "run"
        var run = new ReportRun
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Type = "AUDIT_PACK",
            From = req.from,
            To = req.to,
            CreatedAt = DateTimeOffset.UtcNow,
            FileName = $"traceops-audit-pack-{DateTime.UtcNow:yyyyMMdd-HHmm}.pdf",
            Data = pdfBytes
        };

        _db.ReportRuns.Add(run);
        await _db.SaveChangesAsync();

        return Ok(new { id = run.Id, createdAt = run.CreatedAt, fileName = run.FileName });
    }

    [Authorize]
    [HttpGet("runs")]
    public async Task<IActionResult> ListRuns([FromQuery] int limit = 20, [FromQuery] int offset = 0)
    {
        if (limit < 1) limit = 1;
        if (limit > 200) limit = 200;
        if (offset < 0) offset = 0;

        var tenantId = TenantId;

        var q = _db.ReportRuns.AsNoTracking().Where(r => r.TenantId == tenantId);

        var total = await q.CountAsync();

        var items = await q.OrderByDescending(r => r.CreatedAt)
            .Skip(offset).Take(limit)
            .Select(r => new
            {
                id = r.Id,
                type = r.Type,
                from = r.From,
                to = r.To,
                createdAt = r.CreatedAt,
                fileName = r.FileName
            })
            .ToListAsync();

        return Ok(new { paging = new { limit, offset, total }, items });
    }

    [Authorize]
    [HttpGet("runs/{id:guid}/download")]
    public async Task<IActionResult> DownloadRun([FromRoute] Guid id)
    {
        var tenantId = TenantId;

        var run = await _db.ReportRuns.AsNoTracking()
            .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.Id == id);

        if (run is null) return NotFound();

        return File(run.Data, "application/pdf", run.FileName);
    }


}
