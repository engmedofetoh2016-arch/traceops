namespace TraceOps.Api.Models;

public class ReportRun
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }

    public string Type { get; set; } = "AUDIT_PACK_PDF"; // later: CSV, etc.
    public DateTimeOffset From { get; set; }
    public DateTimeOffset To { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public string FileName { get; set; } = default!;
    public string ContentType { get; set; } = "application/pdf";
    public byte[] Data { get; set; } = default!;
}
