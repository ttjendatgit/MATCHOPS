using MATCHOP.API;
using MATCHOP.API.Middlewares;
using MATCHOP.API.Services;
using Microsoft.EntityFrameworkCore;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MATCHOP.API.Repositories;
using MATCHOP.API.Helpers;
using MATCHOP.API.Validators;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MATCHOP.API.Repositories.Interfaces;
using MATCHOP.API.Services.Interfaces;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

var configuredOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

if (configuredOrigins.Length == 0)
{
    var frontendBaseUrl = builder.Configuration["Frontend:BaseUrl"];
    configuredOrigins = string.IsNullOrWhiteSpace(frontendBaseUrl)
        ? []
        : [frontendBaseUrl];
}

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(
                    x => NormalizeModelStateKey(x.Key),
                    x => x.Value!.Errors
                        .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage)
                            ? "Dữ liệu không hợp lệ."
                            : error.ErrorMessage)
                        .Distinct()
                        .ToArray());

            var response = new ErrorResponse
            {
                Success = false,
                Code = ErrorCodes.ValidationError,
                Message = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.",
                Errors = errors
            };

            return new BadRequestObjectResult(response);
        };
    });

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestDtoValidator>();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        if (configuredOrigins.Length == 0 || configuredOrigins.Contains("*"))
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
            return;
        }

        policy.WithOrigins(configuredOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database");

builder.Services.AddRateLimiter(options =>
{
    var permitLimit = builder.Configuration.GetValue("RateLimiting:PermitLimit", 100);
    var windowSeconds = builder.Configuration.GetValue("RateLimiting:WindowSeconds", 60);
    var queueLimit = builder.Configuration.GetValue("RateLimiting:QueueLimit", 0);

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var key = context.User.Identity?.IsAuthenticated == true
            ? context.User.Identity.Name ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "authenticated"
            : context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";

        return RateLimitPartition.GetFixedWindowLimiter(
            key,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromSeconds(windowSeconds),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = queueLimit,
                AutoReplenishment = true
            });
    });
});

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MATCHOP API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập JWT token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ISportService, SportService>();
builder.Services.AddScoped<IVenueRepository, VenueRepository>();
builder.Services.AddScoped<IVenueService, VenueService>();
builder.Services.AddSingleton<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<ICourtRepository, CourtRepository>();
builder.Services.AddScoped<ICourtService, CourtService>();
builder.Services.AddScoped<IPriceRuleRepository, PriceRuleRepository>();
builder.Services.AddScoped<IPriceRuleService, PriceRuleService>();
builder.Services.AddScoped<IBookingSlotRepository, BookingSlotRepository>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<ICourtAvailabilityService, CourtAvailabilityService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<ICourtBlockService, CourtBlockService>();
builder.Services.AddHostedService<BookingExpirationHostedService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var key = builder.Configuration["Jwt:Key"];
    var issuer = builder.Configuration["Jwt:Issuer"];
    var audience = builder.Configuration["Jwt:Audience"];

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key!))
    };
});

builder.Services.AddAuthorization();
var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health").AllowAnonymous();
app.MapControllers();

app.Run();

static string NormalizeModelStateKey(string key)
{
    if (string.IsNullOrWhiteSpace(key))
    {
        return "request";
    }

    var fieldName = key.Split('.').Last();
    if (string.IsNullOrWhiteSpace(fieldName))
    {
        return "request";
    }

    return char.ToLowerInvariant(fieldName[0]) + fieldName[1..];
}
