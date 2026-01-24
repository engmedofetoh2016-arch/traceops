using Microsoft.AspNetCore.Mvc;
using TraceOps.Api.Data;
using TraceOps.Api.Models;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;




namespace TraceOps.Api.Controllers;

[ApiController]
[Route("v1/events")]
public class EventsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _cfg;

    public EventsController(AppDbContext db, IHttpClientFactory http, IConfiguration cfg)
    {
        _db = db;
        _http = http;
        _cfg = cfg;
    }

    private Guid GetTenantIdFromJwt()
    {
        var tenantIdStr = User.Claims.First(c => c.Type == "tenantId").Value;
        return Guid.Parse(tenantIdStr);
    }


    public record IngestEventDto(
        DateTimeOffset occurredAt,
        string actor,
        string action,
        string resource,
        string? resourceId,
        string? ip,
        string? result,
        JsonElement? metadata
    );

    [HttpPost]
    public async Task<IActionResult> Ingest([FromBody] IngestEventDto dto)
    {
        var tenantId = (Guid)HttpContext.Items["TenantId"]!;

        var entity = new AuditEvent
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            OccurredAt = dto.occurredAt,
            Actor = dto.actor,
            Action = dto.action,
            Resource = dto.resource,
            ResourceId = dto.resourceId,
            Ip = dto.ip,
            Result = dto.result,
            Metadata = dto.metadata.HasValue ? JsonDocument.Parse(dto.metadata.Value.GetRawText()) : null
        };

        _db.AuditEvents.Add(entity);
        await _db.SaveChangesAsync();
        try
        {
            var url = _cfg["Automation:EventWebhookUrl"];
            if (!string.IsNullOrWhiteSpace(url))
            {
                var client = _http.CreateClient();

                await client.PostAsJsonAsync(url, new
                {
                    tenantId,
                    eventId = entity.Id,
                    occurredAt = entity.OccurredAt,
                    actor = entity.Actor,
                    action = entity.Action,
                    resource = entity.Resource,
                    resourceId = entity.ResourceId,
                    ip = entity.Ip,
                    result = entity.Result,
                    metadata = dto.metadata
                });
            }
        }
        catch
        {
            // Don't break ingestion if n8n is down.
            // Add ILogger later if you want to log failures.
        }


        return Ok(new { id = entity.Id });
    }

    [HttpPost("batch")]
    public async Task<IActionResult> IngestBatch([FromBody] List<IngestEventDto> items)
    {
        if (items.Count > 1000) return BadRequest("Batch limit is 1000");

        var tenantId = (Guid)HttpContext.Items["TenantId"]!;

        var created = new List<object>(items.Count);

        foreach (var dto in items)
        {
            var ev = new AuditEvent
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                OccurredAt = dto.occurredAt,
                Actor = dto.actor,
                Action = dto.action,
                Resource = dto.resource,
                ResourceId = dto.resourceId,
                Ip = dto.ip,
                Result = dto.result,
                Metadata = dto.metadata.HasValue ? JsonDocument.Parse(dto.metadata.Value.GetRawText()) : null
            };

            _db.AuditEvents.Add(ev);

            created.Add(new
            {
                tenantId,
                eventId = ev.Id,
                occurredAt = ev.OccurredAt,
                actor = ev.Actor,
                action = ev.Action,
                resource = ev.Resource,
                resourceId = ev.ResourceId,
                ip = ev.Ip,
                result = ev.Result,
                metadata = dto.metadata
            });
        }


        await _db.SaveChangesAsync();
        try
        {
            var url = _cfg["Automation:EventWebhookUrl"];
            if (!string.IsNullOrWhiteSpace(url))
            {
                var client = _http.CreateClient();
                await client.PostAsJsonAsync(url, new { tenantId, events = created });
            }
        }
        catch
        {
        }

        return Ok(new { inserted = items.Count });
    }
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetEvents(
    [FromQuery] DateTimeOffset? from,
    [FromQuery] DateTimeOffset? to,
    [FromQuery] string? actor,
    [FromQuery] string? action,
    [FromQuery] string? resource,
    [FromQuery] string? resourceId,
    [FromQuery] string? result,
    [FromQuery] string? ip,
    [FromQuery] string? q,
    [FromQuery] int limit = 50,
    [FromQuery] int offset = 0)
    {
        var tenantId = GetTenantIdFromJwt();

        // Guardrails
        if (limit < 1) limit = 1;
        if (limit > 200) limit = 200;
        if (offset < 0) offset = 0;

        var queryable = _db.AuditEvents
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId);

        if (from.HasValue) queryable = queryable.Where(e => e.OccurredAt >= from.Value);
        if (to.HasValue) queryable = queryable.Where(e => e.OccurredAt <= to.Value);

        if (!string.IsNullOrWhiteSpace(actor)) queryable = queryable.Where(e => e.Actor == actor);
        if (!string.IsNullOrWhiteSpace(action)) queryable = queryable.Where(e => e.Action == action);
        if (!string.IsNullOrWhiteSpace(resource)) queryable = queryable.Where(e => e.Resource == resource);
        if (!string.IsNullOrWhiteSpace(resourceId)) queryable = queryable.Where(e => e.ResourceId == resourceId);
        if (!string.IsNullOrWhiteSpace(result)) queryable = queryable.Where(e => e.Result == result);
        if (!string.IsNullOrWhiteSpace(ip)) queryable = queryable.Where(e => e.Ip == ip);

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

        var total = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(e => e.OccurredAt)
            .Skip(offset)
            .Take(limit)
            .Select(e => new
            {
                id = e.Id,
                occurredAt = e.OccurredAt,
                actor = e.Actor,
                action = e.Action,
                resource = e.Resource,
                resourceId = e.ResourceId,
                ip = e.Ip,
                result = e.Result,
                metadata = e.Metadata
            })
            .ToListAsync();

        return Ok(new
        {
            paging = new
            {
                limit,
                offset,
                total,
                hasMore = offset + items.Count < total
            },
            items
        });
    }
    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEventById([FromRoute] Guid id)
    {
        var tenantId = GetTenantIdFromJwt();

        var e = await _db.AuditEvents
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Id == id);

        if (e is null) return NotFound();

        return Ok(new
        {
            id = e.Id,
            occurredAt = e.OccurredAt,
            actor = e.Actor,
            action = e.Action,
            resource = e.Resource,
            resourceId = e.ResourceId,
            ip = e.Ip,
            result = e.Result,
            metadata = e.Metadata
        });
    }

}
