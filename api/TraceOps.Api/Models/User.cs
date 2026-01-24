namespace TraceOps.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public string Email { get; set; } = default!;
    public string Role { get; set; } = "ADMIN"; // ADMIN / AUDITOR / VIEWER
    public string PasswordHash { get; set; } = default!;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
