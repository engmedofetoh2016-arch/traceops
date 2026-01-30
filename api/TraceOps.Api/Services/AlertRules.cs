using System.Text.Json;
using TraceOps.Api.Data;
using TraceOps.Api.Models;

namespace TraceOps.Api.Services;

public class AlertRules
{
    private readonly AppDbContext _db;
    public AlertRules(AppDbContext db) => _db = db;

    // ✅ no async, no SaveChanges here
    public void Apply(AuditEvent ev)
    {
        // Rule 1: Large export
        if (string.Equals(ev.Action, "EXPORT_DATA", StringComparison.OrdinalIgnoreCase))
        {
            var rows = TryGetRows(ev.Metadata);
            if (rows.HasValue && rows.Value > 1000)
            {
                _db.Alerts.Add(new Alert
                {
                    Id = Guid.NewGuid(),
                    TenantId = ev.TenantId,
                    EventId = ev.Id,
                    Type = "EXPORT_TOO_LARGE",
                    Severity = "HIGH",
                    Title = "Large export detected",
                    Details = $"Exported {rows.Value} rows from {ev.Resource}{(ev.ResourceId != null ? ":" + ev.ResourceId : "")}"
                });
            }
        }

        // Rule 2: Failure
        if (!string.IsNullOrWhiteSpace(ev.Result) &&
            !string.Equals(ev.Result, "SUCCESS", StringComparison.OrdinalIgnoreCase))
        {
            _db.Alerts.Add(new Alert
            {
                Id = Guid.NewGuid(),
                TenantId = ev.TenantId,
                EventId = ev.Id,
                Type = "ACTION_FAILED",
                Severity = "MEDIUM",
                Title = "Action failed",
                Details = $"{ev.Action} on {ev.Resource} failed (result={ev.Result})"
            });
        }
    }

    private static int? TryGetRows(JsonDocument? meta)
    {
        try
        {
            if (meta is null) return null;
            if (meta.RootElement.ValueKind != JsonValueKind.Object) return null;
            if (!meta.RootElement.TryGetProperty("rows", out var rowsEl)) return null;
            if (rowsEl.ValueKind == JsonValueKind.Number && rowsEl.TryGetInt32(out var rows)) return rows;
            return null;
        }
        catch
        {
            return null;
        }
    }
}
