using NUnit.Framework;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs.Branding;
using GatherGrove.API.Tests.Helpers;
using GatherGrove.Application.Authorization;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Branding;
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.API.Tests.Performance;

/// <summary>
/// Performance tests for the Branding API endpoints
/// Validates response times and concurrent request handling
/// </summary>
[TestFixture]
public class BrandingPerformanceTests
{
    private WebApplicationFactory<Program> _factory;
    private HttpClient _client;
    private const int TestClubId = 100;
    private const int PerformanceTestTimeout = 5000; // 5 seconds max

    [OneTimeSetUp]
    public void OneTimeSetUp()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the existing DbContext registration
                    var dbContextDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<GatherGroveDbContext>));
                    if (dbContextDescriptor != null)
                        services.Remove(dbContextDescriptor);

                    // Add in-memory database for testing
                    services.AddDbContext<GatherGroveDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("BrandingPerformanceTestDb");
                    });

                    // Add test authentication
                    services.AddAuthentication("Test")
                        .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", options => { });

                    // Add test authorization services
                    services.AddScoped<GatherGrove.Infrastructure.Services.IClubAuthorizationService, TestClubAuthorizationService>();
                    services.AddScoped<IClubTierService, TestClubTierService>();

                    // Configure authorization policies for testing
                    services.AddAuthorization(options =>
                    {
                        options.AddPolicy("AdminOnly", policy =>
                            policy.RequireAuthenticatedUser()
                                  .RequireClaim("IsAdmin", "true"));

                        options.AddPolicy("UnlimitedTierRequired", policy =>
                            policy.RequireAuthenticatedUser()
                                  .RequireClaim("UnlimitedTier", "true"));
                    });

                    // Add authorization handlers
                    services.AddScoped<IAuthorizationHandler, TestAdminOnlyHandler>();
                    services.AddScoped<IAuthorizationHandler, TestUnlimitedTierHandler>();

                    // Replace branding service with test implementation
                    var brandingServiceDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IBrandingService));
                    if (brandingServiceDescriptor != null)
                        services.Remove(brandingServiceDescriptor);
                    services.AddScoped<IBrandingService, TestBrandingService>();
                });
            });

        _client = _factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Test");

        // Setup test data
        SeedPerformanceTestData();
    }

    [OneTimeTearDown]
    public void OneTimeTearDown()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }

    private void SeedPerformanceTestData()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        context.Database.EnsureCreated();

        // Create multiple test clubs for performance testing
        var clubs = new List<Club>();
        var brandings = new List<ClubBranding>();

        for (int i = TestClubId; i < TestClubId + 50; i++)
        {
            clubs.Add(new Club
            {
                Id = i,
                Name = $"Performance Test Club {i}",
                Tier = "Unlimited",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedByUserId = 1
            });

            // Create branding for all clubs
            brandings.Add(new ClubBranding
            {
                ClubId = i,
                PrimaryColor = $"#{i:X6}",
                SecondaryColor = $"#{(i * 2):X6}",
                FontFamily = "Arial",
                WhiteLabelDomain = $"club{i}.test.com",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        context.Clubs.AddRange(clubs);
        context.ClubBrandings.AddRange(brandings);
        context.SaveChanges();
    }

    [Test, Timeout(PerformanceTestTimeout)]
    public async Task GetBranding_ResponseTime_ShouldBeUnder500Ms()
    {
        // Arrange
        var stopwatch = Stopwatch.StartNew();

        // Act
        var response = await _client.GetAsync($"/api/v1/clubs/{TestClubId}/branding");

        // Assert
        stopwatch.Stop();

        TestContext.WriteLine($"GET branding response time: {stopwatch.ElapsedMilliseconds}ms");
        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(500), "GET branding should respond in under 500ms");
    }

    [Test, Timeout(PerformanceTestTimeout)]
    public async Task CreateBranding_ResponseTime_ShouldBeUnder1Second()
    {
        // Arrange
        var request = new CreateBrandingRequest
        {
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            FontFamily = "Arial",
            WhiteLabelDomain = "performance-test.com"
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var stopwatch = Stopwatch.StartNew();

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{TestClubId + 25}/branding", content);

        // Assert
        stopwatch.Stop();

        TestContext.WriteLine($"POST branding response time: {stopwatch.ElapsedMilliseconds}ms");
        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(1000), "POST branding should respond in under 1 second");
    }

    [Test, Timeout(PerformanceTestTimeout)]
    public async Task GetBranding_ConcurrentRequests_ShouldHandleLoad()
    {
        // Arrange
        const int concurrentRequests = 20;
        var tasks = new List<Task<(HttpResponseMessage Response, long ElapsedMs)>>();

        // Act
        for (int i = 0; i < concurrentRequests; i++)
        {
            var clubId = TestClubId + (i % 25); // Use existing clubs
            tasks.Add(GetBrandingWithTiming(clubId));
        }

        var results = await Task.WhenAll(tasks);

        // Assert
        var successfulRequests = results.Count(r => r.Response.IsSuccessStatusCode);
        var avgResponseTime = results.Average(r => r.ElapsedMs);
        var maxResponseTime = results.Max(r => r.ElapsedMs);

        TestContext.WriteLine($"Concurrent requests: {concurrentRequests}");
        TestContext.WriteLine($"Successful requests: {successfulRequests}");
        TestContext.WriteLine($"Average response time: {avgResponseTime:F2}ms");
        TestContext.WriteLine($"Max response time: {maxResponseTime}ms");

        Assert.GreaterOrEqual(successfulRequests, concurrentRequests * 0.95,
            "At least 95% of concurrent requests should succeed");
        Assert.Less(avgResponseTime, 1000,
            "Average response time should be under 1 second");
        Assert.Less(maxResponseTime, 3000,
            "Maximum response time should be under 3 seconds");

        // Cleanup
        foreach (var (response, _) in results)
        {
            response?.Dispose();
        }
    }

    [Test, Timeout(PerformanceTestTimeout)]
    public async Task UpdateBranding_BulkOperations_ShouldBeEfficient()
    {
        // Arrange
        const int bulkOperations = 10;
        var tasks = new List<Task<(HttpResponseMessage Response, long ElapsedMs)>>();

        // Act
        for (int i = 0; i < bulkOperations; i++)
        {
            var clubId = TestClubId + (i * 2); // Use clubs with existing branding
            tasks.Add(UpdateBrandingWithTiming(clubId, i));
        }

        var results = await Task.WhenAll(tasks);

        // Assert
        var successfulUpdates = results.Count(r => r.Response.IsSuccessStatusCode);
        var avgResponseTime = results.Average(r => r.ElapsedMs);

        TestContext.WriteLine($"Bulk update operations: {bulkOperations}");
        TestContext.WriteLine($"Successful updates: {successfulUpdates}");
        TestContext.WriteLine($"Average response time: {avgResponseTime:F2}ms");

        Assert.That(successfulUpdates, Is.EqualTo(bulkOperations), "All bulk updates should succeed");
        Assert.That(avgResponseTime, Is.LessThan(1500), "Average bulk update time should be under 1.5 seconds");

        // Cleanup
        foreach (var (response, _) in results)
        {
            response?.Dispose();
        }
    }

    [Test, Timeout(PerformanceTestTimeout)]
    public async Task UploadLogo_LargeFile_ShouldHandleEfficiently()
    {
        // Arrange
        var largeFakeImageContent = new byte[2 * 1024 * 1024]; // 2MB
        new Random().NextBytes(largeFakeImageContent);

        var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(largeFakeImageContent);
        fileContent.Headers.Add("Content-Type", "image/png");
        form.Add(fileContent, "file", "large-logo.png");

        var stopwatch = Stopwatch.StartNew();

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{TestClubId + 30}/branding/upload", form);

        // Assert
        stopwatch.Stop();

        TestContext.WriteLine($"Large file upload response time: {stopwatch.ElapsedMilliseconds}ms");
        TestContext.WriteLine($"File size: {largeFakeImageContent.Length / 1024 / 1024}MB");

        Assert.Less(stopwatch.ElapsedMilliseconds, 5000,
            "Large file upload should complete in under 5 seconds");

        response?.Dispose();
        form?.Dispose();
    }

    [Test]
    public async Task DatabaseQueries_OptimizationCheck()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        var stopwatch = Stopwatch.StartNew();

        // Act - Simulate database query patterns used by the service
        var brandingCount = await context.ClubBrandings.CountAsync();
        var specificBranding = await context.ClubBrandings
            .Where(b => b.ClubId == TestClubId)
            .FirstOrDefaultAsync();
        var recentBrandings = await context.ClubBrandings
            .Where(b => b.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .OrderByDescending(b => b.CreatedAt)
            .Take(10)
            .ToListAsync();

        // Assert
        stopwatch.Stop();

        TestContext.WriteLine($"Database operations completed in: {stopwatch.ElapsedMilliseconds}ms");
        TestContext.WriteLine($"Total branding records: {brandingCount}");
        TestContext.WriteLine($"Recent brandings found: {recentBrandings.Count}");

        Assert.Less(stopwatch.ElapsedMilliseconds, 500,
            "Database operations should complete in under 500ms with in-memory database");
        Assert.That(brandingCount, Is.GreaterThanOrEqualTo(25), "Should have seeded branding data");
    }

    private async Task<(HttpResponseMessage Response, long ElapsedMs)> GetBrandingWithTiming(int clubId)
    {
        var stopwatch = Stopwatch.StartNew();
        var response = await _client.GetAsync($"/api/v1/clubs/{clubId}/branding");
        stopwatch.Stop();
        return (response, stopwatch.ElapsedMilliseconds);
    }

    private async Task<(HttpResponseMessage Response, long ElapsedMs)> UpdateBrandingWithTiming(int clubId, int iteration)
    {
        var request = new UpdateBrandingRequest
        {
            PrimaryColor = $"#{(iteration * 1000):X6}",
            SecondaryColor = $"#{(iteration * 2000):X6}",
            FontFamily = iteration % 2 == 0 ? "Arial" : "Helvetica"
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var stopwatch = Stopwatch.StartNew();
        var response = await _client.PutAsync($"/api/v1/clubs/{clubId}/branding", content);
        stopwatch.Stop();

        return (response, stopwatch.ElapsedMilliseconds);
    }
}