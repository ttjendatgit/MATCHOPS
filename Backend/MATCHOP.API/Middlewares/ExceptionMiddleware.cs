using System.Net;
using System.Text.Json;
using MATCHOP.API.Helpers;

namespace MATCHOP.API.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public ExceptionMiddleware(
            RequestDelegate next,
            ILogger<ExceptionMiddleware> logger,
            IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (AppException ex)
            {
                await HandleAppExceptionAsync(context, ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception occurred.");

                await HandleUnknownExceptionAsync(context, ex);
            }
        }

        private static async Task HandleAppExceptionAsync(HttpContext context, AppException exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = exception.StatusCode;

            var response = new ErrorResponse
            {
                Success = false,
                Code = exception.Code,
                Message = exception.Message
            };

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }

        private async Task HandleUnknownExceptionAsync(HttpContext context, Exception ex)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var response = new ErrorResponse
            {
                Success = false,
                Code = ErrorCodes.InternalServerError,
                Message = _environment.IsDevelopment()
                    ? $"Lỗi: {ex.Message}"
                    : "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
            };

            if (_environment.IsDevelopment())
            {
                response.Errors = new Dictionary<string, string[]>
                {
                    { "stack", new[] { ex.StackTrace ?? "no stack" } }
                };
            }

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }
}