using Microsoft.Extensions.Logging;
using NUnit.Framework;

namespace GatherGrove.Application.Tests;

[SetUpFixture]
public class GlobalTestSetup
{
    [OneTimeSetUp]
    public void GlobalSetup()
    {
        // Set the environment to Test for all tests
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Test");

        // Set JWT Secret Key for tests
        Environment.SetEnvironmentVariable("JWT_SECRET_KEY", "TestSecretKeyThatIsAtLeast32CharactersLongForTesting123!");

        // Set database configuration for tests
        Environment.SetEnvironmentVariable("USE_INMEMORY_DB", "true");
        Environment.SetEnvironmentVariable("SKIP_DB_SEEDING", "true");
        Environment.SetEnvironmentVariable("SKIP_DB_MIGRATIONS", "true");

        // Enhanced stability settings for host process
        Environment.SetEnvironmentVariable("DOTNET_DisableEventPipe", "1");
        Environment.SetEnvironmentVariable("DOTNET_ThreadPool_ForceMinWorkerThreads", "50");
        Environment.SetEnvironmentVariable("DOTNET_ThreadPool_ForceMaxWorkerThreads", "100");
        Environment.SetEnvironmentVariable("DOTNET_GCLatencyMode", "SustainedLowLatency");
        Environment.SetEnvironmentVariable("DOTNET_gcServer", "0");

        // Configure minimal logging for tests with enhanced error handling
        using var loggerFactory = LoggerFactory.Create(builder =>
        {
            builder.SetMinimumLevel(LogLevel.Error);
            builder.AddConsole();
        });

        // Force garbage collection to start with clean slate
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
    }

    [OneTimeTearDown]
    public void GlobalTearDown()
    {
        // Clean up environment variables
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", null);
        Environment.SetEnvironmentVariable("JWT_SECRET_KEY", null);
        Environment.SetEnvironmentVariable("USE_INMEMORY_DB", null);
        Environment.SetEnvironmentVariable("SKIP_DB_SEEDING", null);
        Environment.SetEnvironmentVariable("SKIP_DB_MIGRATIONS", null);
    }
}