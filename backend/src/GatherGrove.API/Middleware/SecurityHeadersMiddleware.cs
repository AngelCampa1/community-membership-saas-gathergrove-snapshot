namespace GatherGrove.API.Middleware;

/// <summary>
/// Middleware to add security headers to all responses
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;

    public SecurityHeadersMiddleware(RequestDelegate next, ILogger<SecurityHeadersMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Remove server header for security
        context.Response.Headers.Remove("Server");

        // Add security headers
        var headers = context.Response.Headers;

        // Strict Transport Security (HSTS)
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

        // Prevent content type sniffing
        headers["X-Content-Type-Options"] = "nosniff";

        // XSS Protection
        headers["X-XSS-Protection"] = "1; mode=block";

        // Clickjacking protection
        headers["X-Frame-Options"] = "DENY";

        // Referrer Policy
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Enhanced Content Security Policy
        var csp = "default-src 'self'; " +
                  "script-src 'self' 'nonce-RANDOM' https://js.stripe.com; " +
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                  "font-src 'self' https://fonts.gstatic.com; " +
                  "img-src 'self' data: https:; " +
                  "connect-src 'self' https://api.stripe.com https://*.ingest.sentry.io https://www.google-analytics.com https://analytics.google.com; " +
                  "frame-src 'self' https://js.stripe.com; " +
                  "object-src 'none'; " +
                  "base-uri 'self'; " +
                  "form-action 'self'; " +
                  "frame-ancestors 'none'; " +
                  "worker-src 'self'; " +
                  "manifest-src 'self'; " +
                  "upgrade-insecure-requests; " +
                  "block-all-mixed-content";

        headers["Content-Security-Policy"] = csp;

        // Enhanced Permissions Policy
        headers["Permissions-Policy"] =
            "geolocation=(), microphone=(), camera=(), payment=('self' https://js.stripe.com), " +
            "fullscreen=(self), accelerometer=(), autoplay=(), encrypted-media=(), gyroscope=(), " +
            "picture-in-picture=(), usb=(), web-share=()";

        // Additional security headers
        headers["X-Permitted-Cross-Domain-Policies"] = "none";
        headers["Cross-Origin-Embedder-Policy"] = "require-corp";
        headers["Cross-Origin-Opener-Policy"] = "same-origin";
        headers["Cross-Origin-Resource-Policy"] = "cross-origin";

        await _next(context);
    }
}