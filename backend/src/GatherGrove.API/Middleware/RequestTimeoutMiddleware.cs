using System.Net;

namespace GatherGrove.API.Middleware
{
    /// <summary>
    /// Middleware to handle request timeouts gracefully and prevent 231s backend timeouts
    /// </summary>
    public class RequestTimeoutMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestTimeoutMiddleware> _logger;
        private readonly TimeSpan _timeout;

        public RequestTimeoutMiddleware(RequestDelegate next, ILogger<RequestTimeoutMiddleware> logger, IConfiguration configuration)
        {
            _next = next;
            _logger = logger;

            // Configure timeout from settings or use default of 200 seconds (before Azure's 230s limit)
            var timeoutSeconds = configuration.GetValue<int>("RequestTimeout:TimeoutSeconds", 200);
            _timeout = TimeSpan.FromSeconds(timeoutSeconds);
        }

        public async Task InvokeAsync(HttpContext context)
        {
            using var timeoutCancellationTokenSource = new CancellationTokenSource(_timeout);
            using var combinedCancellationTokenSource = CancellationTokenSource.CreateLinkedTokenSource(
                context.RequestAborted,
                timeoutCancellationTokenSource.Token);

            var originalRequestAborted = context.RequestAborted;
            context.RequestAborted = combinedCancellationTokenSource.Token;

            var requestPath = context.Request.Path;
            var startTime = DateTime.UtcNow;

            try
            {
                _logger.LogDebug("Request to {Path} started, timeout {Timeout}s",
                    requestPath, _timeout.TotalSeconds);

                await _next(context);

                var duration = DateTime.UtcNow - startTime;
                if (duration > TimeSpan.FromSeconds(30))
                {
                    _logger.LogWarning("Long-running request {RequestPath} completed in {Duration}ms",
                        requestPath, duration.TotalMilliseconds);
                }
            }
            catch (OperationCanceledException) when (timeoutCancellationTokenSource.Token.IsCancellationRequested)
            {
                var duration = DateTime.UtcNow - startTime;

                _logger.LogWarning("Request {RequestPath} timed out after {Duration}ms (timeout: {TimeoutSeconds}s)",
                    requestPath, duration.TotalMilliseconds, _timeout.TotalSeconds);

                // Check if the response has already started
                if (!context.Response.HasStarted)
                {
                    context.Response.StatusCode = (int)HttpStatusCode.RequestTimeout;
                    context.Response.ContentType = "application/json";

                    var timeoutResponse = new
                    {
                        error = "Request Timeout",
                        message = $"The request took longer than the allowed {_timeout.TotalSeconds} seconds to complete.",
                        statusCode = 408,
                        timestamp = DateTime.UtcNow.ToString("O"),
                        path = requestPath.Value
                    };

                    await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(timeoutResponse));
                }
            }
            catch (OperationCanceledException) when (originalRequestAborted.IsCancellationRequested)
            {
                var duration = DateTime.UtcNow - startTime;

                _logger.LogInformation("Request {RequestPath} was cancelled by client after {Duration}ms",
                    requestPath, duration.TotalMilliseconds);

                throw; // Re-throw client cancellation
            }
            catch (Exception ex)
            {
                var duration = DateTime.UtcNow - startTime;

                _logger.LogError(ex, "Request {RequestPath} failed after {Duration}ms with exception: {ExceptionType}",
                    requestPath, duration.TotalMilliseconds, ex.GetType().Name);

                throw; // Let other middleware handle the exception
            }
            finally
            {
                // Restore original cancellation token
                context.RequestAborted = originalRequestAborted;
            }
        }
    }

    /// <summary>
    /// Extension methods for registering the request timeout middleware
    /// </summary>
    public static class RequestTimeoutMiddlewareExtensions
    {
        /// <summary>
        /// Adds request timeout middleware to the pipeline
        /// </summary>
        public static IApplicationBuilder UseRequestTimeout(this IApplicationBuilder app)
        {
            return app.UseMiddleware<RequestTimeoutMiddleware>();
        }
    }
}