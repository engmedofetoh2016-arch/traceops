using Microsoft.AspNetCore.Mvc;
using TraceOps.Api.Data;
using TraceOps.Api.Models;
using System.Text.Json;

namespace TraceOps.Api.Controllers;

[ApiController]
[Route("v1/events")]
public class EventsController : ControllerBase
{
    private readonly AppDbContext _db;

    public EventsController(AppDbContext db) => _db = db;

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

        return Ok(new { id = entity.Id });
    }

    [HttpPost("batch")]
    public async Task<IActionResult> IngestBatch([FromBody] List<IngestEventDto> items)
    {
        if (items.Count > 1000) return BadRequest("Batch limit is 1000");

        var tenantId = (Guid)HttpContext.Items["TenantId"]!;

        foreach (var dto in items)
        {
            _db.AuditEvents.Add(new AuditEvent
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
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { inserted = items.Count });
    }
}
