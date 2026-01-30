using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;
using System.Text;
using TraceOps.Api.Auth;
using TraceOps.Api.Data;



var builder = WebApplication.CreateBuilder(args);
QuestPDF.Settings.License = LicenseType.Community;

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpClient();

// Swagger: support BOTH ApiKey and Bearer JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "TraceOps API", Version = "v1" });

    // API Key (for ingestion endpoints)
    c.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.ApiKey,
        Name = "X-API-Key",
        In = ParameterLocation.Header,
        Description = "API Key for POST /v1/events ingestion"
    });

    // JWT Bearer (for UI/human endpoints)
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Bearer token for UI endpoints"
    });

    // Apply security requirements (Swagger will show Authorize options)
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "ApiKey" }
            },
            Array.Empty<string>()
        },
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ✅ CORS for UI (Coolify public UI domain). No cookies needed => no AllowCredentials.
builder.Services.AddCors(options =>
{
    options.AddPolicy("ui", policy =>
        policy
            .WithOrigins("http://v8ck44scggwkogkscs4ogsk0.157.173.102.16.sslip.io")
            .AllowAnyHeader()
            .AllowAnyMethod()
    );
});

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// JWT Auth
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
            ),

            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<TraceOps.Api.Services.AlertRules>();
var app = builder.Build();

// Run migrations at startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Swagger only in Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ✅ Correct middleware order
app.UseRouting();

// CORS must be after routing and before auth/middleware so OPTIONS preflight works
app.UseCors("ui");

// In Coolify you're using HTTP; keep HTTPS redirection off.
// If you later enable HTTPS at the edge and want redirect, uncomment:
// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// API Key protection ONLY for ingestion endpoints (your middleware already narrows it to POST /v1/events(+/batch))
app.UseMiddleware<ApiKeyMiddleware>();

app.MapControllers();

app.Run();
