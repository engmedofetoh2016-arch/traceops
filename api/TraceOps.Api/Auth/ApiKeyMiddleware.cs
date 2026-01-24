using Microsoft.EntityFrameworkCore;
using TraceOps.Api.Data;

namespace TraceOps.Api.Auth;

public class ApiKeyMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        var path = context.Request.Path.Value ?? "";
        var method = context.Request.Method;

        // Only require API key for ingestion endpoints
        var isIngest =
            method == HttpMethods.Post &&
            (path.Equals("/v1/events", StringComparison.OrdinalIgnoreCase) ||
             path.Equals("/v1/events/batch", StringComparison.OrdinalIgnoreCase));

        if (!isIngest)
        {
            await next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue("X-API-Key", out var apiKeyValue))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsync("Missing X-API-Key");
            return;
        }

        var hash = ApiKeyHasher.Hash(apiKeyValue!);

        var apiKey = await db.ApiKeys
            .AsNoTracking()
            .FirstOrDefaultAsync(k => k.KeyHash == hash && k.RevokedAt == null);

        if (apiKey is null)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsync("Invalid API key");
            return;
        }

        // Attach tenant to HttpContext for ingestion controllers
        context.Items["TenantId"] = apiKey.TenantId;

        await next(context);
    }
}
