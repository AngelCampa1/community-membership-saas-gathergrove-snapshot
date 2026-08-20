using Microsoft.Extensions.Logging;
using NUnit.Framework;

namespace GatherGrove.API.Tests;

[SetUpFixture]
public class GlobalTestSetup
{
    [OneTimeSetUp]
    public void GlobalSetup()
    {
        // Set the environment to Test for all tests
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Test");

        // Set required environment variables for tests
        Environment.SetEnvironmentVariable("JWT_SECRET_KEY", "TestSecretKeyThatIsAtLeast32CharactersLongForTesting123!");
        Environment.SetEnvironmentVariable("STRIPE_SECRET_KEY", "sk_test_51234567890abcdef");
        Environment.SetEnvironmentVariable("USE_INMEMORY_DB", "true");
        Environment.SetEnvironmentVariable("SKIP_DB_SEEDING", "true");

        // Configure minimal logging for tests
        using var loggerFactory = LoggerFactory.Create(builder =>
        {
            builder.SetMinimumLevel(LogLevel.Error);
        });
    }

    [OneTimeTearDown]
    public void GlobalTearDown()
    {
        // Clean up environment variables
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", null);
        Environment.SetEnvironmentVariable("JWT_SECRET_KEY", null);
        Environment.SetEnvironmentVariable("STRIPE_SECRET_KEY", null);
        Environment.SetEnvironmentVariable("USE_INMEMORY_DB", null);
        Environment.SetEnvironmentVariable("SKIP_DB_SEEDING", null);
    }
}