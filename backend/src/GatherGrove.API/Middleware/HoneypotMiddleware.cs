using GatherGrove.API.Services;

namespace GatherGrove.API.Middleware;

/// <summary>
/// Honeypot middleware to detect and track automated attacks
/// </summary>
public class HoneypotMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<HoneypotMiddleware> _logger;
    private readonly ISecurityAuditService _securityAuditService;
    private readonly IConfiguration _configuration;

    // Common paths that attackers try but shouldn't exist in our app
    private readonly HashSet<string> _honeypotPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/wp-admin", "/wp-login.php", "/wordpress", "/wp-content",
        "/phpmyadmin", "/pma", "/mysql", "/dbadmin",
        "/admin.php", "/administrator", "/admin/login",
        "/cpanel", "/whm", "/plesk",
        "/xmlrpc.php", "/wp-xmlrpc.php",
        "/.env", "/.git", "/.svn", "/.htaccess",
        "/config.php", "/configuration.php",
        "/backup", "/backups", "/dump.sql", "/database.sql",
        "/shell.php", "/c99.php", "/r57.php", "/webshell.php",
        "/uploads/shell.php", "/images/shell.php",
        "/robots.txt", "/sitemap.xml" // These are normal but we monitor access
    };

    // File extensions that indicate malicious uploads or scanning
    private readonly HashSet<string> _suspiciousExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".php", ".asp", ".aspx", ".jsp", ".cgi", ".pl", ".py", ".rb",
        ".sh", ".bat", ".cmd", ".exe", ".dll", ".scr", ".vbs", ".js"
    };

    public HoneypotMiddleware(RequestDelegate next, ILogger<HoneypotMiddleware> logger, ISecurityAuditService securityAuditService, IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _securityAuditService = securityAuditService;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.ToString();
        var clientIP = GetClientIP(context);
        var userAgent = context.Request.Headers["User-Agent"].ToString();

        // Check if this is a honeypot path
        if (_honeypotPaths.Contains(path))
        {
            await LogHoneypotHit(context, "honeypot_path", $"Access to honeypot path: {path}");

            // Return a realistic 404 response to not tip off attackers
            context.Response.StatusCode = 404;
            await context.Response.WriteAsync("Not Found");
            return;
        }

        // Check for suspicious file extensions
        var extension = Path.GetExtension(path);
        if (!string.IsNullOrEmpty(extension) && _suspiciousExtensions.Contains(extension))
        {
            await LogHoneypotHit(context, "suspicious_extension", $"Request for suspicious file extension: {extension}");

            context.Response.StatusCode = 404;
            await context.Response.WriteAsync("Not Found");
            return;
        }

        // Check for directory traversal attempts
        if (path.Contains("..") || path.Contains("%2e%2e"))
        {
            await LogHoneypotHit(context, "directory_traversal", "Directory traversal attempt detected");

            context.Response.StatusCode = 400;
            await context.Response.WriteAsync("Bad Request");
            return;
        }

        // Check for common attack patterns in URL
        var attackPatterns = new[]
        {
            "union+select", "union select", "1=1", "1' or '1'='1",
            "script>", "<script", "javascript:", "eval(",
            "cmd=", "exec=", "system=", "shell=",
            "passwd", "etc/passwd", "boot.ini", "win.ini"
        };

        var fullUrl = $"{path}{context.Request.QueryString}";
        foreach (var pattern in attackPatterns)
        {
            if (fullUrl.Contains(pattern, StringComparison.OrdinalIgnoreCase))
            {
                await LogHoneypotHit(context, "attack_pattern", $"Attack pattern detected: {pattern}");

                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Bad Request");
                return;
            }
        }

        // Monitor for automated scanning tools
        var botUserAgents = new[]
        {
            "sqlmap", "nikto", "w3af", "nmap", "masscan", "zap", "burp",
            "acunetix", "netsparker", "appscan", "webscarab", "paros",
            "havij", "pangolin", "bot", "crawler", "spider", "scanner"
        };

        if (botUserAgents.Any(bot => userAgent.Contains(bot, StringComparison.OrdinalIgnoreCase)))
        {
            await LogHoneypotHit(context, "automated_tool", $"Automated tool detected: {userAgent}");
        }

        await _next(context);
    }

    private async Task LogHoneypotHit(HttpContext context, string eventType, string description)
    {
        var clientIP = GetClientIP(context);
        var userAgent = context.Request.Headers["User-Agent"].ToString();
        var path = context.Request.Path.ToString();

        var securityEvent = new SecurityEvent
        {
            EventType = eventType,
            Severity = SecurityEventSeverity.High,
            ClientIP = clientIP,
            UserAgent = userAgent,
            RequestPath = path,
            Description = description,
            AdditionalData = new Dictionary<string, string>
            {
                ["Method"] = context.Request.Method,
                ["QueryString"] = context.Request.QueryString.ToString(),
                ["Referer"] = context.Request.Headers["Referer"].ToString()
            }
        };

        await _securityAuditService.LogSecurityEventAsync(securityEvent);

        _logger.LogWarning("Honeypot triggered: {EventType} from IP {ClientIP} - {Description}",
            eventType, clientIP, description);
    }

    private string GetClientIP(HttpContext context)
    {
        return RequestClientIpResolver.GetClientIp(context, _configuration);
    }
}
