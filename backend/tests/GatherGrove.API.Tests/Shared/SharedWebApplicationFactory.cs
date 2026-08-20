using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Shared WebApplicationFactory to prevent resource conflicts and port collisions
/// when running multiple API test classes simultaneously.
/// </summary>
public class SharedWebApplicationFactory : WebApplicationFactory<Program>
{
    private static readonly Lazy<SharedWebApplicationFactory> _instance = new(() => new SharedWebApplicationFactory());
    private static readonly ConcurrentDictionary<string, HttpClient> _clients = new();

    public static SharedWebApplicationFactory Instance => _instance.Value;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Set environment variables before configuration is built
        Environment.SetEnvironmentVariable("JWT_SECRET_KEY", "TestSecretKeyThatIsAtLeast32CharactersLongForTesting123!");
        Environment.SetEnvironmentVariable("USE_INMEMORY_DB", "true");
        Environment.SetEnvironmentVariable("SKIP_DB_SEEDING", "true");
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");

        // Disable logging to reduce console noise during tests
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.SetMinimumLevel(LogLevel.Error);
        });

        // Set test environment
        builder.UseEnvironment("Testing");

        // Use dynamic port to avoid conflicts
        builder.UseUrls("http://localhost:0");

        builder.ConfigureServices(services =>
        {
            // Configure in-memory database with unique name per factory
            var uniqueDbName = $"TestDb_{Environment.ProcessId}_{DateTime.UtcNow.Ticks}";
            Environment.SetEnvironmentVariable("INMEMORY_DB_NAME", uniqueDbName);

            // Disable background services that might cause issues in tests
            services.Configure<HostOptions>(opts => opts.ShutdownTimeout = TimeSpan.FromSeconds(5));
        });

        // Add test configuration for JWT and other settings
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new[]
            {
                KeyValuePair.Create("JwtSettings:SecretKey", "TestSecretKeyThatIsAtLeast32CharactersLongForTesting123!"),
                KeyValuePair.Create("JwtSettings:Issuer", "GatherGrove"),
                KeyValuePair.Create("JwtSettings:Audience", "GatherGrove"),
                KeyValuePair.Create("JwtSettings:TokenLifetimeInMinutes", "60"),
                KeyValuePair.Create("Stripe:SecretKey", "sk_test_123456789"),
                KeyValuePair.Create("Stripe:PublishableKey", "pk_test_123456789"),
                KeyValuePair.Create("App:FrontendUrl", "http://localhost:3000"),
                KeyValuePair.Create("App:ApiUrl", "http://localhost:0") // Use dynamic port
            });
        });

        base.ConfigureWebHost(builder);
    }

    /// <summary>
    /// Gets a client for the specified test class, creating one if it doesn't exist.
    /// This ensures each test class gets its own HttpClient instance while sharing the factory.
    /// </summary>
    public HttpClient GetClient(string testClassName)
    {
        return _clients.GetOrAdd(testClassName, _ => CreateClient());
    }

    /// <summary>
    /// Creates a scoped WebApplicationFactory for tests that need custom service configurations.
    /// </summary>
    public WebApplicationFactory<Program> WithServices(Action<IServiceCollection> configureServices)
    {
        return this.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(configureServices);
        });
    }

    /// <summary>
    /// Disposes a client for a specific test class
    /// </summary>
    public void DisposeClient(string testClassName)
    {
        if (_clients.TryRemove(testClassName, out var client))
        {
            client.Dispose();
        }
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            foreach (var client in _clients.Values)
            {
                client.Dispose();
            }
            _clients.Clear();
        }
        base.Dispose(disposing);
    }
}