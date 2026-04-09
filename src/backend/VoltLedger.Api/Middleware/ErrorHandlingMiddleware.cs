using System.Net;
using System.Text.Json;
using VoltLedger.Api.DTOs;

namespace VoltLedger.Api.Middleware
{
    /// <summary>
    /// Global error handling middleware with audit logging
    /// </summary>
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var requestId = context.TraceIdentifier;
            var userId = context.User?.Identity?.Name ?? "anonymous";
            var path = context.Request.Path;
            var method = context.Request.Method;

            _logger.LogError(exception, 
                "Request failed: {Method} {Path} | User: {User} | RequestId: {RequestId}",
                method, path, userId, requestId);

            // Determine status code based on exception type
            var statusCode = exception switch
            {
                UnauthorizedAccessException => (int)HttpStatusCode.Forbidden,
                KeyNotFoundException => (int)HttpStatusCode.NotFound,
                ArgumentException => (int)HttpStatusCode.BadRequest,
                InvalidOperationException => (int)HttpStatusCode.BadRequest,
                _ => (int)HttpStatusCode.InternalServerError
            };

            // Don't expose detailed error information in production
            var isDevelopment = context.RequestServices
                .GetService<IWebHostEnvironment>()?.IsDevelopment() ?? false;

            var message = isDevelopment 
                ? exception.Message 
                : "An error occurred while processing your request";

            var errors = isDevelopment && exception.InnerException != null
                ? new List<string> { exception.InnerException.Message }
                : null;

            var response = ApiResponse.Error(
                message,
                statusCode,
                errors
            );
            response.RequestId = requestId;

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
        }
    }
}
