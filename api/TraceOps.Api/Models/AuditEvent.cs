using System.Text.Json;

namespace TraceOps.Api.Models;

public class AuditEvent
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }

    public DateTimeOffset OccurredAt { get; set; }

    public string Actor { get; set; } = default!;
    public string Action { get; set; } = default!;
    public string Resource { get; set; } = default!;
    public string? ResourceId { get; set; }

    public string? Ip { get; set; } // store as string; map to inet later if you want
    public string? Result { get; set; }

    public JsonDocument? Metadata { get; set; }
}
