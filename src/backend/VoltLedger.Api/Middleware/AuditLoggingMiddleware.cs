using System.Diagnostics;

namespace VoltLedger.Api.Middleware
{
    /// <summary>
    /// Audit logging middleware for request tracking
    /// Logs all requests for security and compliance
    /// </summary>
    public class AuditLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuditLoggingMiddleware> _logger;

        public AuditLoggingMiddleware(RequestDelegate next, ILogger<AuditLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            var requestId = context.TraceIdentifier;
            var userId = context.User?.FindFirst("userId")?.Value ?? "anonymous";
            var path = context.Request.Path;
            var method = context.Request.Method;
            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = context.Request.Headers["User-Agent"].ToString();

            // Log request start
            _logger.LogInformation(
                "[AUDIT] Request started: {Method} {Path} | User: {User} | IP: {IP} | RequestId: {RequestId}",
                method, path, userId, ipAddress, requestId);

            try
            {
                await _next(context);
                
                stopwatch.Stop();
                
                var statusCode = context.Response.StatusCode;
                
                _logger.LogInformation(
                    "[AUDIT] Request completed: {Method} {Path} | Status: {Status} | Duration: {Duration}ms | User: {User} | RequestId: {RequestId}",
                    method, path, statusCode, stopwatch.ElapsedMilliseconds, userId, requestId);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                _logger.LogError(ex,
                    "[AUDIT] Request failed: {Method} {Path} | Duration: {Duration}ms | User: {User} | RequestId: {RequestId}",
                    method, path, stopwatch.ElapsedMilliseconds, userId, requestId);
                
                throw;
            }
        }
    }
}
