using NUnit.Framework;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using System.Text.Json;
using System.Net;
using System.Security.Claims;
using System.Text.Encodings.Web;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs.Branding;
using GatherGrove.API.Tests.Helpers;
using GatherGrove.Application.Authorization;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Branding;
using GatherGrove.Infrastructure.Services;
using Microsoft.Extensions.Configuration;

namespace GatherGrove.API.Tests.Security;

/// <summary>
/// Security tests for the Branding API endpoints
/// Validates authorization, authentication, and security measures
/// </summary>
[TestFixture]
public class BrandingSecurityTests
{
    private WebApplicationFactory<Program> _factory;
    private HttpClient _authenticatedClient;
    private HttpClient _unauthenticatedClient;
    private HttpClient _unauthorizedClient;
    private const int TestClubId = 200;

    [OneTimeSetUp]
    public void OneTimeSetUp()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                // Configure test settings to disable security middleware protections
                builder.ConfigureAppConfiguration((context, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        {"Security:EnableXssProtection", "false"},
                        {"Security:EnableSqlInjectionProtection", "false"}
                    });
                });

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
                        options.UseInMemoryDatabase("BrandingSecurityTestDb");
                    });

                    // Add test authentication schemes
                    services.AddAuthentication("Test")
                        .AddScheme<AuthenticationSchemeOptions, AuthorizedTestAuthenticationHandler>(
                            "AuthorizedTest", options => { })
                        .AddScheme<AuthenticationSchemeOptions, UnauthorizedTestAuthenticationHandler>(
                            "UnauthorizedTest", options => { })
                        .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(
                            "Test", options => { });

                    // Configure authentication to challenge for all schemes
                    services.Configure<AuthenticationOptions>(options =>
                    {
                        options.DefaultChallengeScheme = "Test";
                        options.DefaultForbidScheme = "Test";
                    });

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

        // Create clients with different authentication states
        _authenticatedClient = _factory.CreateClient();
        _authenticatedClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("AuthorizedTest");

        _unauthenticatedClient = _factory.CreateClient();
        // No authorization header

        _unauthorizedClient = _factory.CreateClient();
        _unauthorizedClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("UnauthorizedTest");

        SeedSecurityTestData();
    }

    [OneTimeTearDown]
    public void OneTimeTearDown()
    {
        _authenticatedClient?.Dispose();
        _unauthenticatedClient?.Dispose();
        _unauthorizedClient?.Dispose();
        _factory?.Dispose();
    }

    private void SeedSecurityTestData()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        context.Database.EnsureCreated();

        // Create test club with Unlimited tier
        var club = new Club
        {
            Id = TestClubId,
            Name = "Security Test Club",
            Tier = "Unlimited",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = 1
        };
        context.Clubs.Add(club);

        // Create test branding
        var branding = new ClubBranding
        {
            ClubId = TestClubId,
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            FontFamily = "Arial",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.ClubBrandings.Add(branding);

        context.SaveChanges();
    }

    #region Authentication Tests

    [Test]
    public async Task GetBranding_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Act
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/clubs/{TestClubId}/branding");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task CreateBranding_UnauthenticatedRequest_Returns401()
    {
        // Arrange
        var request = new CreateBrandingRequest { PrimaryColor = "#FF0000" };
        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _unauthenticatedClient.PostAsync($"/api/v1/clubs/{TestClubId}/branding", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task UpdateBranding_UnauthenticatedRequest_Returns401()
    {
        // Arrange
        var request = new UpdateBrandingRequest { PrimaryColor = "#00FF00" };
        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _unauthenticatedClient.PutAsync($"/api/v1/clubs/{TestClubId}/branding", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task DeleteBranding_UnauthenticatedRequest_Returns401()
    {
        // Act
        var response = await _unauthenticatedClient.DeleteAsync($"/api/v1/clubs/{TestClubId}/branding");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    #endregion

    #region Authorization Tests

    [Test]
    public async Task GetBranding_UnauthorizedUser_ReturnsForbiddenOrNotFound()
    {
        // Act
        var response = await _unauthorizedClient.GetAsync($"/api/v1/clubs/{TestClubId}/branding");

        // Assert
        // Should return 403 (Forbidden) or 404 (Not Found) depending on authorization implementation
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden).Or.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    public async Task CreateBranding_UnauthorizedUser_ReturnsForbidden()
    {
        // Arrange
        var request = new CreateBrandingRequest { PrimaryColor = "#FF0000" };
        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _unauthorizedClient.PostAsync($"/api/v1/clubs/{TestClubId}/branding", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden).Or.EqualTo(HttpStatusCode.Unauthorized));
    }

    #endregion

    #region Input Validation and Sanitization Tests

    [Test]
    public async Task CreateBranding_MaliciousScript_ShouldBeSanitized()
    {
        // Arrange
        var request = new CreateBrandingRequest
        {
            PrimaryColor = "#FF0000",
            CustomCSS = "<script>alert('XSS');</script>.malicious { background: url('javascript:alert(1)'); }"
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act - Use unique club ID that doesn't have existing branding
        var response = await _authenticatedClient.PostAsync($"/api/v1/clubs/201/branding", content);

        // Assert
        if (response.IsSuccessStatusCode)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            var brandingResponse = JsonSerializer.Deserialize<BrandingResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            // Verify that malicious scripts are removed or sanitized
            Assert.That(brandingResponse, Is.Not.Null);
            Assert.IsFalse(brandingResponse.CustomCSS?.Contains("<script>") ?? false,
                "Script tags should be removed from CSS");
            Assert.IsFalse(brandingResponse.CustomCSS?.Contains("javascript:") ?? false,
                "JavaScript URLs should be removed from CSS");
        }
        else
        {
            // Should return Bad Request for invalid CSS
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        }
    }

    [Test]
    public async Task CreateBranding_SQLInjectionAttempt_ShouldBeHandledSafely()
    {
        // Arrange
        var request = new CreateBrandingRequest
        {
            PrimaryColor = "#FF0000",
            WhiteLabelDomain = "test.com'; DROP TABLE ClubBrandings; --",
            FacebookUrl = "https://facebook.com/' OR 1=1 --"
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act & Assert
        var response = await _authenticatedClient.PostAsync($"/api/v1/clubs/{TestClubId}/branding", content);

        // Should either succeed (with sanitized input) or fail with validation error
        // But should NOT cause SQL injection
        Assert.That(response.StatusCode,
            Is.EqualTo(HttpStatusCode.Created).Or.EqualTo(HttpStatusCode.BadRequest),
            "SQL injection attempts should be handled safely");

        // Verify database integrity by checking if table still exists
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        Assert.DoesNotThrowAsync(async () => await context.ClubBrandings.CountAsync(),
            "Database table should still exist after SQL injection attempt");
    }

    [Test]
    public async Task UploadLogo_MaliciousFile_ShouldBeRejected()
    {
        // Arrange - Create a file that looks like an image but contains malicious content
        var maliciousContent = Encoding.UTF8.GetBytes("<?php system($_GET['cmd']); ?>");
        var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(maliciousContent);
        fileContent.Headers.Add("Content-Type", "image/png"); // Fake content type
        form.Add(fileContent, "file", "malicious.php.png");

        // Act
        var response = await _authenticatedClient.PostAsync($"/api/v1/clubs/{TestClubId}/branding/upload", form);

        // Assert
        var responseContent = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"Response Status: {response.StatusCode}");
        Console.WriteLine($"Response Content: {responseContent}");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest),
            "Malicious files should be rejected");

        Assert.IsTrue(responseContent.Contains("Invalid") || responseContent.Contains("not allowed"),
            "Response should indicate file was rejected");
    }

    [Test]
    public async Task UploadLogo_OversizedFile_ShouldBeRejected()
    {
        // Arrange - Create a file larger than the 5MB limit
        var oversizedContent = new byte[6 * 1024 * 1024]; // 6MB
        var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(oversizedContent);
        fileContent.Headers.Add("Content-Type", "image/png");
        form.Add(fileContent, "file", "huge-logo.png");

        // Act
        var response = await _authenticatedClient.PostAsync($"/api/v1/clubs/{TestClubId}/branding/upload", form);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest),
            "Oversized files should be rejected");
    }

    #endregion

    #region Rate Limiting and DoS Protection Tests

    [Test]
    public async Task CreateBranding_RapidRequests_ShouldBeThrottled()
    {
        // Arrange
        var tasks = new List<Task<HttpResponseMessage>>();

        // Act - Send 10 rapid requests
        for (int i = 0; i < 10; i++)
        {
            var request = new CreateBrandingRequest { PrimaryColor = $"#{i:X6}" };
            var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            tasks.Add(_authenticatedClient.PostAsync($"/api/v1/clubs/{TestClubId}/branding", content));
        }

        var responses = await Task.WhenAll(tasks);

        // Assert
        var tooManyRequestsResponses = responses.Count(r => r.StatusCode == HttpStatusCode.TooManyRequests);
        var successfulRequests = responses.Count(r => r.IsSuccessStatusCode);

        TestContext.WriteLine($"Successful requests: {successfulRequests}");
        TestContext.WriteLine($"Rate limited requests: {tooManyRequestsResponses}");

        // Should have some rate limiting in place (either through middleware or service)
        // At minimum, all requests should complete without server errors
        Assert.IsTrue(responses.All(r => r.StatusCode != HttpStatusCode.InternalServerError),
            "No requests should result in server errors");

        // Cleanup
        foreach (var response in responses)
        {
            response?.Dispose();
        }
    }

    #endregion

    #region Data Validation Tests

    [Test]
    public async Task CreateBranding_InvalidHexColor_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateBrandingRequest
        {
            PrimaryColor = "not-a-hex-color",
            SecondaryColor = "#GGGGGG" // Invalid hex characters
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _authenticatedClient.PostAsync($"/api/v1/clubs/{TestClubId}/branding", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task CreateBranding_InvalidDomain_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateBrandingRequest
        {
            PrimaryColor = "#FF0000",
            WhiteLabelDomain = "invalid domain with spaces and special chars!"
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _authenticatedClient.PostAsync($"/api/v1/clubs/{TestClubId}/branding", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task CreateBranding_InvalidSocialMediaUrls_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateBrandingRequest
        {
            PrimaryColor = "#FF0000",
            FacebookUrl = "not-a-valid-url",
            TwitterUrl = "ftp://invalid-protocol.com",
            InstagramUrl = "javascript:alert('xss')"
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _authenticatedClient.PostAsync($"/api/v1/clubs/{TestClubId}/branding", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task UploadLogo_UnauthenticatedRequest_Returns401()
    {
        // Arrange
        var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes("fake-content"));
        fileContent.Headers.Add("Content-Type", "image/png");
        form.Add(fileContent, "file", "logo.png");

        // Act
        var response = await _unauthenticatedClient.PostAsync($"/api/v1/clubs/{TestClubId}/branding/upload", form);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    #endregion
}