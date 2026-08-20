using Microsoft.AspNetCore.Mvc.Testing;
using NUnit.Framework;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Shared test fixture to reuse WebApplicationFactory across all test classes
/// This dramatically reduces test execution time by avoiding application startup overhead
/// </summary>
[SetUpFixture]
public class SharedTestFixture
{
    public static WebApplicationFactory<Program>? Factory { get; private set; }
    public static HttpClient? Client { get; private set; }

    [OneTimeSetUp]
    public void OneTimeSetUp()
    {
        // Create the factory once for all tests with proper JWT configuration
        Factory = new SharedWebApplicationFactory();
        Client = Factory.CreateClient();

        Console.WriteLine("✅ Shared test fixture initialized - WebApplicationFactory created once for all tests with JWT configuration");
    }

    [OneTimeTearDown]
    public void OneTimeTearDown()
    {
        Client?.Dispose();
        Factory?.Dispose();

        Console.WriteLine("✅ Shared test fixture disposed");
    }
}