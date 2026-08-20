using GatherGrove.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace GatherGrove.API.Tests.Security;

[TestFixture]
[NonParallelizable]
public class InMemoryDatabaseSeedingSecurityTests
{
    [Test]
    public async Task ProductionLikeEnvironment_WithInMemoryDatabase_DoesNotSeedOrPrintKnownCredentials()
    {
        await AssertSeedingBehaviorAsync("Production", shouldSeed: false);
    }

    [Test]
    public async Task StagingEnvironment_WithInMemoryDatabase_DoesNotSeedOrPrintKnownCredentials()
    {
        await AssertSeedingBehaviorAsync("Staging", shouldSeed: false);
    }

    [Test]
    public async Task DevelopmentEnvironment_WithInMemoryDatabase_CanSeedWithoutPrintingKnownCredentials()
    {
        await AssertSeedingBehaviorAsync("Development", shouldSeed: true);
    }

    [Test]
    public async Task DevelopmentEnvironment_WithSkipDbSeedingTrue_DoesNotSeedOrPrintKnownCredentials()
    {
        await AssertSeedingBehaviorAsync("Development", shouldSeed: false, skipDbSeeding: "true");
    }

    private static async Task AssertSeedingBehaviorAsync(
        string environmentName,
        bool shouldSeed,
        string? skipDbSeeding = null)
    {
        var originalEnvironment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        var originalUseInMemoryDb = Environment.GetEnvironmentVariable("USE_INMEMORY_DB");
        var originalSkipSeeding = Environment.GetEnvironmentVariable("SKIP_DB_SEEDING");
        var originalJwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
        var originalCsrfSecret = Environment.GetEnvironmentVariable("CSRF_SECRET_KEY");
        var originalInMemoryDbName = Environment.GetEnvironmentVariable("INMEMORY_DB_NAME");
        var originalConsoleOut = Console.Out;

        using var consoleOutput = new StringWriter();
        Console.SetOut(consoleOutput);

        try
        {
            var jwtSecret = $"{environmentName}TestSecretKeyThatIsAtLeast32CharactersLong";
            var csrfSecret = $"{environmentName}TestCsrfSecretKeyThatIsAtLeast32CharactersLong";

            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", environmentName);
            Environment.SetEnvironmentVariable("USE_INMEMORY_DB", "true");
            Environment.SetEnvironmentVariable("SKIP_DB_SEEDING", skipDbSeeding);
            Environment.SetEnvironmentVariable("JWT_SECRET_KEY", jwtSecret);
            Environment.SetEnvironmentVariable("CSRF_SECRET_KEY", csrfSecret);
            Environment.SetEnvironmentVariable("INMEMORY_DB_NAME", $"{environmentName}SeedSecurity_{Guid.NewGuid()}");

            await using var factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseEnvironment(environmentName);
                    builder.ConfigureAppConfiguration((_, config) =>
                    {
                        config.AddInMemoryCollection(new Dictionary<string, string?>
                        {
                            ["JwtSettings:SecretKey"] = jwtSecret,
                            ["JwtSettings:Issuer"] = "GatherGrove",
                            ["JwtSettings:Audience"] = "GatherGrove",
                            ["Stripe:SecretKey"] = "sk_test_123456789",
                            ["Stripe:PublishableKey"] = "pk_test_123456789",
                            ["App:FrontendUrl"] = "http://localhost:3000",
                            ["App:ApiUrl"] = "http://localhost:0",
                            ["Security:CSRFSecretKey"] = csrfSecret
                        });
                    });
                });

            _ = factory.Services;

            using var scope = factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

            var seededKnownUsers = await dbContext.Users
                .Where(user => user.Email == "admin@test.com" || user.Email == "member@test.com")
                .Select(user => user.Email)
                .ToListAsync();

            if (shouldSeed)
            {
                Assert.That(seededKnownUsers, Is.EquivalentTo(new[] { "admin@test.com", "member@test.com" }));
            }
            else
            {
                Assert.That(seededKnownUsers, Is.Empty);
            }

            var output = consoleOutput.ToString();
            if (shouldSeed)
            {
                Assert.That(output, Does.Contain("Test data seeded successfully!"));
            }

            Assert.That(output, Does.Not.Contain("Admin Email: admin@test.com"));
            Assert.That(output, Does.Not.Contain("Admin Password: password123"));
            Assert.That(output, Does.Not.Contain("Member Email: member@test.com"));
            Assert.That(output, Does.Not.Contain("Member Password: password123"));
        }
        finally
        {
            Console.SetOut(originalConsoleOut);
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", originalEnvironment);
            Environment.SetEnvironmentVariable("USE_INMEMORY_DB", originalUseInMemoryDb);
            Environment.SetEnvironmentVariable("SKIP_DB_SEEDING", originalSkipSeeding);
            Environment.SetEnvironmentVariable("JWT_SECRET_KEY", originalJwtSecret);
            Environment.SetEnvironmentVariable("CSRF_SECRET_KEY", originalCsrfSecret);
            Environment.SetEnvironmentVariable("INMEMORY_DB_NAME", originalInMemoryDbName);
        }
    }
}
