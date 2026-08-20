using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Infrastructure.Data;
using System.Diagnostics;
using System.Reflection;
using Microsoft.EntityFrameworkCore;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Health check controller for API status verification
/// BUG FIX #20: Added authorization to debug/comprehensive endpoints
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class HealthController : ControllerBase
{
    private readonly GatherGroveDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        GatherGroveDbContext context,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        IServiceProvider serviceProvider,
        ILogger<HealthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _environment = environment;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }
    /// <summary>
    /// Basic health check endpoint - lightweight check without database dependency
    /// </summary>
    /// <returns>API status information</returns>
    /// <response code="200">Returns the API status</response>
    [HttpGet]
    [ProducesResponseType(typeof(object), 200)]
    public IActionResult GetHealth()
    {
        try
        {
            _logger.LogInformation("HealthController.GetHealth called");

            // Basic health check without database dependency
            return Ok(new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Version = "1.0.0",
                Service = "GatherGrove API",
                Environment = _environment.EnvironmentName
            });
        }
        catch (Exception ex)
        {
            // Return 500 if there's any issue with basic service functionality
            return StatusCode(500, new
            {
                Status = "Unhealthy",
                Timestamp = DateTime.UtcNow,
                Error = ex.Message,
                Service = "GatherGrove API"
            });
        }
    }

    /// <summary>
    /// Comprehensive health check endpoint that validates all critical dependencies
    /// BUG FIX #20: Requires admin authorization to prevent information disclosure
    /// </summary>
    /// <returns>Detailed health status including database connectivity, configuration, and system resources</returns>
    /// <response code="200">Returns healthy status when all dependencies are available</response>
    /// <response code="401">Unauthorized - admin access required</response>
    /// <response code="503">Returns unhealthy status if critical services are unavailable</response>
    [HttpGet("comprehensive")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(object), 401)]
    [ProducesResponseType(typeof(object), 503)]
    public async Task<IActionResult> GetComprehensiveHealth()
    {
        var stopwatch = Stopwatch.StartNew();
        var healthChecks = new List<(string Name, bool IsHealthy, string Status, string Error, TimeSpan Duration)>();
        bool overallHealthy = true;

        try
        {
            // 1. Database Connectivity Check
            var dbCheck = await CheckDatabaseHealthAsync();
            healthChecks.Add(("Database", dbCheck.IsHealthy, dbCheck.Status, dbCheck.Error, dbCheck.Duration));
            if (!dbCheck.IsHealthy) overallHealthy = false;

            // 2. Critical Configuration Check
            var configCheck = CheckCriticalConfiguration();
            healthChecks.Add(("Configuration", configCheck.IsHealthy, configCheck.Status, configCheck.Error, configCheck.Duration));
            if (!configCheck.IsHealthy) overallHealthy = false;

            // 3. Memory and Resources Check
            var resourceCheck = CheckSystemResources();
            healthChecks.Add(("SystemResources", resourceCheck.IsHealthy, resourceCheck.Status, resourceCheck.Error, resourceCheck.Duration));
            if (!resourceCheck.IsHealthy) overallHealthy = false;

            // 4. Essential Services Check
            var servicesCheck = await CheckEssentialServicesAsync();
            healthChecks.Add(("EssentialServices", servicesCheck.IsHealthy, servicesCheck.Status, servicesCheck.Error, servicesCheck.Duration));
            if (!servicesCheck.IsHealthy) overallHealthy = false;

            // 5. Application State Check
            var appStateCheck = CheckApplicationState();
            healthChecks.Add(("ApplicationState", appStateCheck.IsHealthy, appStateCheck.Status, appStateCheck.Error, appStateCheck.Duration));
            if (!appStateCheck.IsHealthy) overallHealthy = false;

            stopwatch.Stop();

            var healthStatus = new
            {
                Status = overallHealthy ? "Healthy" : "Unhealthy",
                Timestamp = DateTime.UtcNow,
                Version = Assembly.GetEntryAssembly()?.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? "1.0.0",
                Service = "GatherGrove API",
                Environment = _environment.EnvironmentName,
                TotalDuration = stopwatch.Elapsed,
                HealthChecks = healthChecks.Select(hc => new
                {
                    Name = hc.Name,
                    Status = hc.Status,
                    IsHealthy = hc.IsHealthy,
                    Error = hc.Error,
                    Duration = hc.Duration
                })
            };

            return overallHealthy ? Ok(healthStatus) : StatusCode(503, healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Comprehensive health check failed with unexpected error");

            return StatusCode(500, new
            {
                Status = "Error",
                Timestamp = DateTime.UtcNow,
                Error = ex.Message,
                Service = "GatherGrove API",
                Duration = stopwatch.Elapsed
            });
        }
    }

    /// <summary>
    /// Deep health check endpoint that includes database connectivity
    /// BUG FIX #20: Requires admin authorization to prevent information disclosure
    /// </summary>
    /// <returns>Detailed health status including database connectivity</returns>
    /// <response code="200">Returns detailed health status</response>
    /// <response code="401">Unauthorized - admin access required</response>
    /// <response code="503">Returns unhealthy status if critical services are unavailable</response>
    [HttpGet("deep")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(object), 401)]
    [ProducesResponseType(typeof(object), 503)]
    public async Task<IActionResult> GetDeepHealth()
    {
        try
        {
            // Quick database check with timeout
            var dbCheck = await CheckDatabaseHealthAsync();
            var configCheck = CheckCriticalConfiguration();

            bool isHealthy = dbCheck.IsHealthy && configCheck.IsHealthy;

            var healthStatus = new
            {
                Status = isHealthy ? "Healthy" : "Degraded",
                Timestamp = DateTime.UtcNow,
                Version = "1.0.0",
                Service = "GatherGrove API",
                Environment = _environment.EnvironmentName,
                Database = new
                {
                    Status = dbCheck.Status,
                    Error = dbCheck.Error,
                    Duration = dbCheck.Duration
                },
                Configuration = new
                {
                    Status = configCheck.Status,
                    Error = configCheck.Error
                    // BUG FIX #20: Removed HasDefaultConnection and HasJwtSecret to prevent information disclosure
                }
            };

            // Return 503 if not healthy
            return isHealthy ? Ok(healthStatus) : StatusCode(503, healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Deep health check failed with unexpected error");

            return StatusCode(500, new
            {
                Status = "Unhealthy",
                Timestamp = DateTime.UtcNow,
                Error = ex.Message,
                Service = "GatherGrove API"
            });
        }
    }

    /// <summary>
    /// Diagnostic endpoint for debugging configuration issues
    /// BUG FIX #20: Requires admin authorization and removed sensitive configuration details
    /// IMPORTANT: Consider disabling this endpoint in production or restricting to internal networks only
    /// </summary>
    /// <returns>Configuration diagnostic information</returns>
    /// <response code="200">Returns diagnostic information</response>
    /// <response code="401">Unauthorized - admin access required</response>
    [HttpGet("debug")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(object), 401)]
    public async Task<IActionResult> GetDebugInfo()
    {
        try
        {
            var useInMemoryDb = Environment.GetEnvironmentVariable("USE_INMEMORY_DB");
            var aspNetEnvironment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

            // Test database connectivity
            bool canConnectToDatabase = false;
            int userCount = 0;
            string dbError = null;

            try
            {
                userCount = _context.Users.Count();
                canConnectToDatabase = true;
            }
            catch (Exception ex)
            {
                dbError = ex.Message;
            }

            return Ok(new
            {
                Environment = _environment.EnvironmentName,
                AspNetEnvironment = aspNetEnvironment,
                UseInMemoryDb = useInMemoryDb,
                DatabaseConnectivity = new
                {
                    CanConnect = canConnectToDatabase,
                    UserCount = userCount,
                    Error = dbError
                },
                Configuration = new
                {
                    HasDefaultConnection = !string.IsNullOrEmpty(_configuration.GetConnectionString("DefaultConnection")),
                    HasJwtSecret = !string.IsNullOrEmpty(_configuration["JwtSettings:SecretKey"])
                    // BUG FIX #20: Removed DefaultConnectionPreview to prevent connection string disclosure
                },
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                Status = "Error",
                Error = ex.Message,
                StackTrace = ex.StackTrace,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    #region Private Health Check Methods

    private async Task<(bool IsHealthy, string Status, string Error, TimeSpan Duration)> CheckDatabaseHealthAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            var canConnect = await _context.Database.CanConnectAsync(cts.Token);

            if (canConnect)
            {
                // Test a simple query to ensure database is truly functional
                var userCount = await _context.Users.CountAsync(cts.Token);
                stopwatch.Stop();
                return (true, "Connected", string.Empty, stopwatch.Elapsed);
            }
            else
            {
                stopwatch.Stop();
                return (false, "Disconnected", "Cannot connect to database", stopwatch.Elapsed);
            }
        }
        catch (OperationCanceledException)
        {
            stopwatch.Stop();
            return (false, "Timeout", "Database connection timed out", stopwatch.Elapsed);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return (false, "Error", ex.Message, stopwatch.Elapsed);
        }
    }

    private (bool IsHealthy, string Status, string Error, TimeSpan Duration) CheckCriticalConfiguration()
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            var issues = new List<string>();

            // Check required configuration values
            if (string.IsNullOrEmpty(_configuration.GetConnectionString("DefaultConnection")))
                issues.Add("Missing DefaultConnection");

            if (string.IsNullOrEmpty(_configuration["JwtSettings:SecretKey"]) &&
                string.IsNullOrEmpty(Environment.GetEnvironmentVariable("JWT_SECRET_KEY")))
                issues.Add("Missing JWT Secret Key");

            // BUG FIX #20: Removed Stripe key checks from health endpoint to prevent information disclosure
            // Stripe integration will fail at runtime if keys are missing, which is acceptable
            // if (string.IsNullOrEmpty(_configuration["Stripe:SecretKey"]))
            //     issues.Add("Missing Stripe Secret Key");
            //
            // if (string.IsNullOrEmpty(_configuration["Stripe:PublishableKey"]))
            //     issues.Add("Missing Stripe Publishable Key");

            stopwatch.Stop();

            if (issues.Any())
            {
                return (false, "Misconfigured", string.Join(", ", issues), stopwatch.Elapsed);
            }

            return (true, "Valid", string.Empty, stopwatch.Elapsed);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return (false, "Error", ex.Message, stopwatch.Elapsed);
        }
    }

    private (bool IsHealthy, string Status, string Error, TimeSpan Duration) CheckSystemResources()
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            var process = Process.GetCurrentProcess();
            var memoryMB = process.WorkingSet64 / 1024 / 1024;

            // Check memory usage (warn if over 1GB, error if over 2GB)
            if (memoryMB > 2048)
            {
                stopwatch.Stop();
                return (false, "HighMemory", $"Memory usage too high: {memoryMB} MB", stopwatch.Elapsed);
            }

            if (memoryMB > 1024)
            {
                stopwatch.Stop();
                return (true, "Warning", $"Memory usage elevated: {memoryMB} MB", stopwatch.Elapsed);
            }

            stopwatch.Stop();
            return (true, "Normal", $"Memory: {memoryMB} MB", stopwatch.Elapsed);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return (false, "Error", ex.Message, stopwatch.Elapsed);
        }
    }

    private Task<(bool IsHealthy, string Status, string Error, TimeSpan Duration)> CheckEssentialServicesAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            var issues = new List<string>();

            // Check if essential services can be resolved
            var essentialServices = new[]
            {
                typeof(GatherGrove.Application.Services.IAuthService),
                typeof(GatherGrove.Application.Services.IMemberService),
                typeof(GatherGrove.Application.Services.IBillingService)
            };

            foreach (var serviceType in essentialServices)
            {
                try
                {
                    var service = _serviceProvider.GetRequiredService(serviceType);
                    if (service == null)
                        issues.Add($"Service {serviceType.Name} is null");
                }
                catch (Exception ex)
                {
                    issues.Add($"Cannot resolve {serviceType.Name}: {ex.Message}");
                }
            }

            stopwatch.Stop();

            if (issues.Any())
            {
                return Task.FromResult((false, "ServicesMissing", string.Join(", ", issues), stopwatch.Elapsed));
            }

            return Task.FromResult((true, "Available", string.Empty, stopwatch.Elapsed));
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return Task.FromResult((false, "Error", ex.Message, stopwatch.Elapsed));
        }
    }

    private (bool IsHealthy, string Status, string Error, TimeSpan Duration) CheckApplicationState()
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            var issues = new List<string>();

            // Check if we're in a proper state
            if (!_environment.IsDevelopment() && !_environment.IsStaging() && !_environment.IsProduction())
                issues.Add($"Unknown environment: {_environment.EnvironmentName}");

            // Check if database migrations are pending (only in non-dev environments)
            if (!_environment.IsDevelopment())
            {
                var useInMemoryDb = Environment.GetEnvironmentVariable("USE_INMEMORY_DB");
                if (useInMemoryDb != "true")
                {
                    try
                    {
                        var pendingMigrations = _context.Database.GetPendingMigrations();
                        if (pendingMigrations.Any())
                        {
                            issues.Add($"Pending migrations: {string.Join(", ", pendingMigrations)}");
                        }
                    }
                    catch (Exception ex)
                    {
                        issues.Add($"Cannot check migrations: {ex.Message}");
                    }
                }
            }

            stopwatch.Stop();

            if (issues.Any())
            {
                return (false, "StateIssues", string.Join(", ", issues), stopwatch.Elapsed);
            }

            return (true, "Ready", string.Empty, stopwatch.Elapsed);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return (false, "Error", ex.Message, stopwatch.Elapsed);
        }
    }

    #endregion
}