namespace TraceOps.Api.Models;

public class Alert
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }

    public Guid? EventId { get; set; } // optional link to audit event
    public string Type { get; set; } = default!; // e.g. "EXPORT_TOO_LARGE"
    public string Severity { get; set; } = "MEDIUM"; // LOW/MEDIUM/HIGH
    public string Title { get; set; } = default!;
    public string? Details { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsResolved { get; set; } = false;
    public DateTimeOffset? ResolvedAt { get; set; }
}
