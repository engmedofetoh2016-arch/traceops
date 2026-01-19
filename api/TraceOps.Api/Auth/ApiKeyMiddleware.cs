using Microsoft.EntityFrameworkCore;
using TraceOps.Api.Data;

namespace TraceOps.Api.Auth;

public class ApiKeyMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        // Only protect /v1 endpoints for now
        if (!context.Request.Path.StartsWithSegments("/v1"))
        {
            await next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue("X-API-Key", out var apiKeyValue))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("Missing X-API-Key");
            return;
        }

        var hash = ApiKeyHasher.Hash(apiKeyValue!);

        var apiKey = await db.ApiKeys
            .AsNoTracking()
            .FirstOrDefaultAsync(k => k.KeyHash == hash && k.RevokedAt == null);

        if (apiKey is null)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("Invalid API key");
            return;
        }

        // Attach tenant to HttpContext for controllers
        context.Items["TenantId"] = apiKey.TenantId;

        await next(context);
    }
}
