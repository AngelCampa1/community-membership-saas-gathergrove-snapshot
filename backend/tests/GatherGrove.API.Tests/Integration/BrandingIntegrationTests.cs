using NUnit.Framework;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;
using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using System.Text.Encodings.Web;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs.Branding;
using GatherGrove.API.Tests.Helpers;
using GatherGrove.Application.Authorization;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Branding;
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.API.Tests.Integration;

/// <summary>
/// Integration tests for the Branding API endpoints
/// Testing full HTTP request/response cycles with in-memory database
/// </summary>
[TestFixture]
public class BrandingIntegrationTests
{
    private WebApplicationFactory<Program> _factory;
    private HttpClient _client;
    private GatherGroveDbContext _context;
    private const int TestClubId = 1;
    private const int TestUserId = 1;

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
                        options.UseInMemoryDatabase("BrandingIntegrationTestDb");
                    });

                    // Add test authentication scheme
                    services.AddAuthentication("Test")
                        .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(
                            "Test", options => { });

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

                    // Keep the real branding service for integration tests
                    // Integration tests should test the real implementation
                });
            });

        _client = _factory.CreateClient();

        // Setup test database
        using var scope = _factory.Services.CreateScope();
        _context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        _context.Database.EnsureCreated();
        SeedTestData();
    }

    [OneTimeTearDown]
    public void OneTimeTearDown()
    {
        _context?.Dispose();
        _client?.Dispose();
        _factory?.Dispose();
    }

    [SetUp]
    public void SetUp()
    {
        // Add authorization header for each test
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Test");
    }

    private void SeedTestData()
    {
        // Create test club
        var club = new Club
        {
            Id = TestClubId,
            Name = "Test Club",
            Tier = "Unlimited", // Required for Unlimited tier authorization
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = TestUserId
        };
        _context.Clubs.Add(club);

        // Create test user
        var user = new User
        {
            Id = TestUserId,
            Email = "test@example.com",
            FullName = "Test User",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
        };
        _context.Users.Add(user);

        // Create club admin relationship
        var clubAdmin = new ClubAdmin
        {
            UserId = TestUserId,
            ClubId = TestClubId,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubAdmins.Add(clubAdmin);

        _context.SaveChanges();
    }

    /// <summary>
    /// Sets up a club with admin relationship for testing with the given club ID
    /// </summary>
    private void SetupTestClub(int clubId)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        // Check if club already exists
        if (!context.Clubs.Any(c => c.Id == clubId))
        {
            var club = new Club
            {
                Id = clubId,
                Name = $"Test Club {clubId}",
                Tier = "Unlimited",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedByUserId = TestUserId
            };
            context.Clubs.Add(club);
        }

        // Check if admin relationship already exists
        if (!context.ClubAdmins.Any(ca => ca.ClubId == clubId && ca.UserId == TestUserId))
        {
            var clubAdmin = new ClubAdmin
            {
                UserId = TestUserId,
                ClubId = clubId,
                CreatedAt = DateTime.UtcNow
            };
            context.ClubAdmins.Add(clubAdmin);
        }

        context.SaveChanges();
    }

    #region GET /api/v1/clubs/{clubId}/branding Tests

    [Test]
    public async Task GetBranding_WhenNoSettings_Returns404()
    {
        // Act
        var response = await _client.GetAsync($"/api/v1/clubs/{TestClubId}/branding");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    public async Task GetBranding_WhenSettingsExist_ReturnsOkWithData()
    {
        // Arrange
        var branding = new ClubBranding
        {
            ClubId = TestClubId,
            LogoUrl = "https://example.com/logo.png",
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            FontFamily = "Arial",
            CustomCSS = ".test { color: red; }",
            WhiteLabelDomain = "testclub.com",
            FacebookUrl = "https://facebook.com/testclub",
            TwitterUrl = "https://twitter.com/testclub",
            InstagramUrl = "https://instagram.com/testclub",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        context.ClubBrandings.Add(branding);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/clubs/{TestClubId}/branding");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var content = await response.Content.ReadAsStringAsync();
        var brandingResponse = JsonSerializer.Deserialize<BrandingResponse>(content, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        Assert.That(brandingResponse, Is.Not.Null);
        Assert.That(brandingResponse.ClubId, Is.EqualTo(TestClubId));
        Assert.That(brandingResponse.PrimaryColor, Is.EqualTo("#FF0000"));
        Assert.That(brandingResponse.WhiteLabelDomain, Is.EqualTo("testclub.com"));
    }

    #endregion

    #region POST /api/v1/clubs/{clubId}/branding Tests

    [Test]
    public async Task CreateBranding_WithValidData_ReturnsCreated()
    {
        // Arrange
        SetupTestClub(TestClubId + 1);

        var request = new CreateBrandingRequest
        {
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            FontFamily = "Arial",
            CustomCSS = ".header { background: red; }",
            WhiteLabelDomain = "newclub.com",
            FacebookUrl = "https://facebook.com/newclub",
            TwitterUrl = "https://twitter.com/newclub",
            InstagramUrl = "https://instagram.com/newclub"
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{TestClubId + 1}/branding", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));

        var responseContent = await response.Content.ReadAsStringAsync();
        var brandingResponse = JsonSerializer.Deserialize<BrandingResponse>(responseContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        Assert.That(brandingResponse, Is.Not.Null);
        Assert.That(brandingResponse.PrimaryColor, Is.EqualTo("#FF0000"));
        Assert.That(brandingResponse.WhiteLabelDomain, Is.EqualTo("newclub.com"));
    }

    [Test]
    public async Task CreateBranding_WithInvalidData_ReturnsBadRequest()
    {
        // Arrange
        SetupTestClub(TestClubId + 2);
        var request = new CreateBrandingRequest
        {
            PrimaryColor = "invalid-color", // Invalid hex color
            WhiteLabelDomain = "invalid domain with spaces"
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{TestClubId + 2}/branding", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task CreateBranding_WhenAlreadyExists_ReturnsConflict()
    {
        // Arrange - Create existing branding
        SetupTestClub(TestClubId + 3);

        var existingBranding = new ClubBranding
        {
            ClubId = TestClubId + 3,
            PrimaryColor = "#000000",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        context.ClubBrandings.Add(existingBranding);
        await context.SaveChangesAsync();

        // Try to create another one
        var request = new CreateBrandingRequest
        {
            PrimaryColor = "#FF0000"
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{TestClubId + 3}/branding", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Conflict));
    }

    #endregion

    #region PUT /api/v1/clubs/{clubId}/branding Tests

    [Test]
    public async Task UpdateBranding_WithValidData_ReturnsOk()
    {
        // Arrange - Create existing branding
        var clubId = TestClubId + 4;
        SetupTestClub(clubId);
        var existingBranding = new ClubBranding
        {
            ClubId = clubId,
            PrimaryColor = "#000000",
            SecondaryColor = "#FFFFFF",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        context.ClubBrandings.Add(existingBranding);
        await context.SaveChangesAsync();

        var request = new UpdateBrandingRequest
        {
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            FontFamily = "Helvetica"
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PutAsync($"/api/v1/clubs/{clubId}/branding", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseContent = await response.Content.ReadAsStringAsync();
        var brandingResponse = JsonSerializer.Deserialize<BrandingResponse>(responseContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        Assert.That(brandingResponse, Is.Not.Null);
        Assert.That(brandingResponse.PrimaryColor, Is.EqualTo("#FF0000"));
        Assert.That(brandingResponse.FontFamily, Is.EqualTo("Helvetica"));
    }

    [Test]
    public async Task UpdateBranding_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new UpdateBrandingRequest
        {
            PrimaryColor = "#FF0000"
        };

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PutAsync($"/api/v1/clubs/999/branding", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    #endregion

    #region DELETE /api/v1/clubs/{clubId}/branding Tests

    [Test]
    public async Task DeleteBranding_WhenExists_ReturnsNoContent()
    {
        // Arrange - Create existing branding
        var clubId = TestClubId + 5;
        SetupTestClub(clubId);
        var existingBranding = new ClubBranding
        {
            ClubId = clubId,
            PrimaryColor = "#000000",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        context.ClubBrandings.Add(existingBranding);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/v1/clubs/{clubId}/branding");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

        // Verify it was actually deleted
        var getResponse = await _client.GetAsync($"/api/v1/clubs/{clubId}/branding");
        Assert.That(getResponse.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    public async Task DeleteBranding_WhenNotFound_ReturnsNotFound()
    {
        // Act
        var response = await _client.DeleteAsync($"/api/v1/clubs/999/branding");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    #endregion

    #region POST /api/v1/clubs/{clubId}/branding/upload Tests

    [Test]
    public async Task UploadLogo_WithValidFile_ReturnsOk()
    {
        // Arrange
        SetupTestClub(TestClubId + 6);
        // Use a simple, non-suspicious binary content for testing
        var fileContent = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46 }; // JPEG header bytes
        var form = new MultipartFormDataContent();
        var fileStreamContent = new ByteArrayContent(fileContent);
        fileStreamContent.Headers.Add("Content-Type", "image/jpeg");
        form.Add(fileStreamContent, "file", "logo.jpg");

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{TestClubId + 6}/branding/upload", form);

        // Debug: Print response details if not OK
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var debugContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Response Status: {response.StatusCode}");
            Console.WriteLine($"Response Content: {debugContent}");
        }

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseContent = await response.Content.ReadAsStringAsync();
        var logoResponse = JsonSerializer.Deserialize<LogoUploadResponse>(responseContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        Assert.That(logoResponse, Is.Not.Null);
        Assert.That(logoResponse.LogoUrl, Is.Not.Null);
        Assert.IsTrue(logoResponse.LogoUrl.Contains("club"));
    }

    [Test]
    public async Task UploadLogo_WithoutFile_ReturnsBadRequest()
    {
        // Arrange
        var form = new MultipartFormDataContent();

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{TestClubId}/branding/upload", form);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task UploadLogo_WithInvalidFileType_ReturnsBadRequest()
    {
        // Arrange
        SetupTestClub(TestClubId + 7);
        var fileContent = Encoding.UTF8.GetBytes("fake-text-content");
        var form = new MultipartFormDataContent();
        var fileStreamContent = new ByteArrayContent(fileContent);
        fileStreamContent.Headers.Add("Content-Type", "text/plain");
        form.Add(fileStreamContent, "file", "document.txt");

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{TestClubId + 7}/branding/upload", form);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    #endregion

    #region Authorization Tests

    [Test]
    public async Task GetBranding_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var unauthenticatedClient = _factory.CreateClient();

        // Act
        var response = await unauthenticatedClient.GetAsync($"/api/v1/clubs/{TestClubId}/branding");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    #endregion
}