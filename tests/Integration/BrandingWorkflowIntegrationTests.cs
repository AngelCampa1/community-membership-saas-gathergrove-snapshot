using NUnit.Framework;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using System.Net.Http.Headers;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Tests.Integration;

[TestFixture]
public class BrandingWorkflowIntegrationTests
{
    private WebApplicationFactory<Program> _factory;
    private HttpClient _client;
    private GatherGroveDbContext _context;
    private User _testUser;
    private Club _testClub;
    private string _authToken;

    [OneTimeSetUp]
    public async Task OneTimeSetup()
    {
        _factory = new WebApplicationFactory<Program>();
        _client = _factory.CreateClient();
        
        // Get database context from DI
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();
        
        // Create test user and club
        await CreateTestUserAndClub(context);
        
        // Authenticate
        _authToken = await AuthenticateAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _authToken);
    }

    [OneTimeTearDown]
    public void OneTimeTearDown()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }

    private async Task CreateTestUserAndClub(GatherGroveDbContext context)
    {
        _testUser = new User
        {
            FullName = "Integration Test Admin",
            Email = "integration.admin@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("TestPassword123!"),
            OnboardingCompleted = true
        };

        _testClub = new Club
        {
            Name = "Integration Test Club",
            Tier = "Unlimited",
            BrandingSettings = new BrandingSettings
            {
                PrimaryColor = "#3B82F6",
                SecondaryColor = "#8B5CF6",
                OrganizationName = "Integration Test Club"
            }
        };

        var clubAdmin = new ClubAdmin
        {
            User = _testUser,
            Club = _testClub
        };

        context.Users.Add(_testUser);
        context.Clubs.Add(_testClub);
        context.ClubAdmins.Add(clubAdmin);
        await context.SaveChangesAsync();
    }

    private async Task<string> AuthenticateAsync()
    {
        var loginRequest = new
        {
            Email = "integration.admin@test.com",
            Password = "TestPassword123!"
        };

        var json = JsonSerializer.Serialize(loginRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _client.PostAsync("/api/auth/login", content);
        response.EnsureSuccessStatusCode();
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponse>(responseContent);
        
        return authResponse.Token;
    }

    [Test, Order(1)]
    public async Task GetBrandingSettings_InitialState_ReturnsDefaultSettings()
    {
        // Act
        var response = await _client.GetAsync($"/api/branding/{_testClub.Id}/settings");
        
        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var settings = JsonSerializer.Deserialize<BrandingSettingsDto>(content);
        
        Assert.That(settings.PrimaryColor, Is.EqualTo("#3B82F6"));
        Assert.That(settings.SecondaryColor, Is.EqualTo("#8B5CF6"));
        Assert.That(settings.OrganizationName, Is.EqualTo("Integration Test Club"));
        Assert.That(settings.LogoUrl, Is.Null);
        Assert.That(settings.FaviconUrl, Is.Null);
    }

    [Test, Order(2)]
    public async Task UpdateBrandingSettings_ValidColors_UpdatesSuccessfully()
    {
        // Arrange
        var updateRequest = new UpdateBrandingSettingsRequest
        {
            PrimaryColor = "#FF5722",
            SecondaryColor = "#4CAF50",
            OrganizationName = "Updated Test Club",
            Tagline = "Making connections through testing"
        };

        var json = JsonSerializer.Serialize(updateRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PutAsync($"/api/branding/{_testClub.Id}/settings", content);
        
        // Assert
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();
        var settings = JsonSerializer.Deserialize<BrandingSettingsDto>(responseContent);
        
        Assert.That(settings.PrimaryColor, Is.EqualTo("#FF5722"));
        Assert.That(settings.SecondaryColor, Is.EqualTo("#4CAF50"));
        Assert.That(settings.OrganizationName, Is.EqualTo("Updated Test Club"));
        Assert.That(settings.Tagline, Is.EqualTo("Making connections through testing"));
    }

    [Test, Order(3)]
    public async Task UploadLogo_ValidImage_UploadsSuccessfully()
    {
        // Arrange
        var imageBytes = CreateValidPngBytes();
        var content = new MultipartFormDataContent();
        var imageContent = new ByteArrayContent(imageBytes);
        imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(imageContent, "file", "test-logo.png");

        // Act
        var response = await _client.PostAsync($"/api/branding/{_testClub.Id}/logo", content);
        
        // Assert
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        Assert.That(result.GetProperty("logoUrl").GetString(), Is.Not.Null.And.Not.Empty);
    }

    [Test, Order(4)]
    public async Task GetBrandingSettings_AfterLogoUpload_ReturnsLogoUrl()
    {
        // Act
        var response = await _client.GetAsync($"/api/branding/{_testClub.Id}/settings");
        
        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var settings = JsonSerializer.Deserialize<BrandingSettingsDto>(content);
        
        Assert.That(settings.LogoUrl, Is.Not.Null.And.Not.Empty);
        Assert.That(settings.LogoUrl, Does.StartWith("https://"));
    }

    [Test, Order(5)]
    public async Task UploadFavicon_ValidIcon_UploadsSuccessfully()
    {
        // Arrange
        var iconBytes = CreateValidIcoBytes();
        var content = new MultipartFormDataContent();
        var iconContent = new ByteArrayContent(iconBytes);
        iconContent.Headers.ContentType = new MediaTypeHeaderValue("image/x-icon");
        content.Add(iconContent, "file", "favicon.ico");

        // Act
        var response = await _client.PostAsync($"/api/branding/{_testClub.Id}/favicon", content);
        
        // Assert
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        Assert.That(result.GetProperty("faviconUrl").GetString(), Is.Not.Null.And.Not.Empty);
    }

    [Test, Order(6)]
    public async Task UploadBrandAsset_ValidImage_UploadsSuccessfully()
    {
        // Arrange
        var imageBytes = CreateValidJpegBytes();
        var content = new MultipartFormDataContent();
        var imageContent = new ByteArrayContent(imageBytes);
        imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        content.Add(imageContent, "file", "banner.jpg");
        content.Add(new StringContent("banners"), "category");

        // Act
        var response = await _client.PostAsync($"/api/branding/{_testClub.Id}/assets", content);
        
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(System.Net.HttpStatusCode.Created));
        var responseContent = await response.Content.ReadAsStringAsync();
        var asset = JsonSerializer.Deserialize<BrandAssetDto>(responseContent);
        
        Assert.That(asset.Name, Is.EqualTo("banner.jpg"));
        Assert.That(asset.Type, Is.EqualTo("image/jpeg"));
        Assert.That(asset.Category, Is.EqualTo("banners"));
        Assert.That(asset.Url, Is.Not.Null.And.Not.Empty);
    }

    [Test, Order(7)]
    public async Task GetBrandAssets_AfterUploads_ReturnsAssetList()
    {
        // Act
        var response = await _client.GetAsync($"/api/branding/{_testClub.Id}/assets");
        
        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringContent();
        var assets = JsonSerializer.Deserialize<List<BrandAssetDto>>(content);
        
        Assert.That(assets, Has.Count.EqualTo(1));
        Assert.That(assets[0].Name, Is.EqualTo("banner.jpg"));
    }

    [Test, Order(8)]
    public async Task ValidateColors_ValidColors_ReturnsValidationResult()
    {
        // Arrange
        var validationRequest = new ColorValidationRequest
        {
            PrimaryColor = "#FF5722",
            SecondaryColor = "#4CAF50"
        };

        var json = JsonSerializer.Serialize(validationRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/branding/validate-colors", content);
        
        // Assert
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ColorValidationResult>(responseContent);
        
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.ContrastRatio, Is.GreaterThan(0));
        Assert.That(result.AccessibilityLevel, Is.Not.Null.And.Not.Empty);
    }

    [Test, Order(9)]
    public async Task ValidateColors_LowContrast_ReturnsWarningsAndSuggestions()
    {
        // Arrange - Colors with poor contrast
        var validationRequest = new ColorValidationRequest
        {
            PrimaryColor = "#FFFF00", // Yellow
            SecondaryColor = "#FFFFFF"  // White
        };

        var json = JsonSerializer.Serialize(validationRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/branding/validate-colors", content);
        
        // Assert
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ColorValidationResult>(responseContent);
        
        Assert.That(result.ContrastRatio, Is.LessThan(3.0));
        Assert.That(result.Suggestions, Is.Not.Empty);
    }

    [Test, Order(10)]
    public async Task GeneratePreviewLink_ValidRequest_ReturnsPreviewUrl()
    {
        // Act
        var response = await _client.PostAsync($"/api/branding/{_testClub.Id}/preview", new StringContent(""));
        
        // Assert
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        var previewUrl = result.GetProperty("previewUrl").GetString();
        Assert.That(previewUrl, Is.Not.Null.And.Not.Empty);
        Assert.That(previewUrl, Does.StartWith("https://"));
        Assert.That(previewUrl, Does.Contain("/preview/"));
    }

    [Test, Order(11)]
    public async Task GetStorageUsage_AfterUploads_ReturnsUsageStats()
    {
        // Act
        var response = await _client.GetAsync($"/api/branding/{_testClub.Id}/storage");
        
        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var usage = JsonSerializer.Deserialize<StorageUsageDto>(content);
        
        Assert.That(usage.UsedBytes, Is.GreaterThan(0));
        Assert.That(usage.FileCount, Is.GreaterThan(0));
        Assert.That(usage.LimitBytes, Is.GreaterThan(usage.UsedBytes));
        Assert.That(usage.CategoryBreakdown, Is.Not.Empty);
    }

    [Test, Order(12)]
    public async Task CompleteWorkflow_EndToEnd_AllFeaturesWork()
    {
        // This test validates the complete branding workflow
        
        // 1. Update branding settings with custom CSS
        var updateRequest = new UpdateBrandingSettingsRequest
        {
            PrimaryColor = "#2563EB",
            SecondaryColor = "#7C3AED",
            OrganizationName = "Complete Test Club",
            Tagline = "End-to-end testing excellence",
            CustomCss = ".custom-header { background-color: #2563EB; }"
        };

        var json = JsonSerializer.Serialize(updateRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var updateResponse = await _client.PutAsync($"/api/branding/{_testClub.Id}/settings", content);
        updateResponse.EnsureSuccessStatusCode();

        // 2. Upload additional brand assets
        var svgBytes = CreateValidSvgBytes();
        var multiContent = new MultipartFormDataContent();
        var svgContent = new ByteArrayContent(svgBytes);
        svgContent.Headers.ContentType = new MediaTypeHeaderValue("image/svg+xml");
        multiContent.Add(svgContent, "file", "icon.svg");
        multiContent.Add(new StringContent("icons"), "category");

        var assetResponse = await _client.PostAsync($"/api/branding/{_testClub.Id}/assets", multiContent);
        Assert.That(assetResponse.StatusCode, Is.EqualTo(System.Net.HttpStatusCode.Created));

        // 3. Generate preview link
        var previewResponse = await _client.PostAsync($"/api/branding/{_testClub.Id}/preview", new StringContent(""));
        previewResponse.EnsureSuccessStatusCode();
        
        var previewContent = await previewResponse.Content.ReadAsStringAsync();
        var previewResult = JsonSerializer.Deserialize<JsonElement>(previewContent);
        var previewUrl = previewResult.GetProperty("previewUrl").GetString();

        // 4. Validate final settings
        var finalResponse = await _client.GetAsync($"/api/branding/{_testClub.Id}/settings");
        finalResponse.EnsureSuccessStatusCode();
        
        var finalContent = await finalResponse.Content.ReadAsStringAsync();
        var finalSettings = JsonSerializer.Deserialize<BrandingSettingsDto>(finalContent);
        
        // Assert all components are working together
        Assert.That(finalSettings.PrimaryColor, Is.EqualTo("#2563EB"));
        Assert.That(finalSettings.OrganizationName, Is.EqualTo("Complete Test Club"));
        Assert.That(finalSettings.CustomCss, Contains.Substring("custom-header"));
        Assert.That(finalSettings.LogoUrl, Is.Not.Null); // From earlier test
        Assert.That(finalSettings.FaviconUrl, Is.Not.Null); // From earlier test
        Assert.That(previewUrl, Is.Not.Null.And.Not.Empty);

        // 5. Verify storage usage reflects all uploads
        var storageResponse = await _client.GetAsync($"/api/branding/{_testClub.Id}/storage");
        storageResponse.EnsureSuccessStatusCode();
        
        var storageContent = await storageResponse.Content.ReadAsStringAsync();
        var storageUsage = JsonSerializer.Deserialize<StorageUsageDto>(storageContent);
        
        Assert.That(storageUsage.FileCount, Is.GreaterThanOrEqualTo(2)); // banner.jpg + icon.svg
        Assert.That(storageUsage.CategoryBreakdown.ContainsKey("banners"), Is.True);
        Assert.That(storageUsage.CategoryBreakdown.ContainsKey("icons"), Is.True);
    }

    [Test, Order(13)]
    public async Task DeleteBrandAsset_ValidAsset_RemovesSuccessfully()
    {
        // First get the asset list to find an asset to delete
        var assetsResponse = await _client.GetAsync($"/api/branding/{_testClub.Id}/assets");
        assetsResponse.EnsureSuccessStatusCode();
        
        var assetsContent = await assetsResponse.Content.ReadAsStringAsync();
        var assets = JsonSerializer.Deserialize<List<BrandAssetDto>>(assetsContent);
        
        if (assets.Any())
        {
            var assetToDelete = assets.First();
            
            // Act - Delete the asset
            var deleteResponse = await _client.DeleteAsync($"/api/branding/{_testClub.Id}/assets/{assetToDelete.Id}");
            
            // Assert
            Assert.That(deleteResponse.StatusCode, Is.EqualTo(System.Net.HttpStatusCode.NoContent));
            
            // Verify asset is removed
            var verifyResponse = await _client.GetAsync($"/api/branding/{_testClub.Id}/assets");
            verifyResponse.EnsureSuccessStatusCode();
            
            var verifyContent = await verifyResponse.Content.ReadAsStringAsync();
            var remainingAssets = JsonSerializer.Deserialize<List<BrandAssetDto>>(verifyContent);
            
            Assert.That(remainingAssets.Any(a => a.Id == assetToDelete.Id), Is.False);
        }
    }

    [Test, Order(14)]
    public async Task DeleteLogo_ExistingLogo_RemovesSuccessfully()
    {
        // Act
        var response = await _client.DeleteAsync($"/api/branding/{_testClub.Id}/logo");
        
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(System.Net.HttpStatusCode.NoContent));
        
        // Verify logo is removed
        var settingsResponse = await _client.GetAsync($"/api/branding/{_testClub.Id}/settings");
        settingsResponse.EnsureSuccessStatusCode();
        
        var content = await settingsResponse.Content.ReadAsStringAsync();
        var settings = JsonSerializer.Deserialize<BrandingSettingsDto>(content);
        
        Assert.That(settings.LogoUrl, Is.Null);
    }

    [Test, Order(15)]
    public async Task UnauthorizedAccess_DifferentClub_ReturnsUnauthorized()
    {
        // Create another club that the user doesn't admin
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        
        var otherClub = new Club
        {
            Name = "Other Club",
            Tier = "Unlimited"
        };
        
        context.Clubs.Add(otherClub);
        await context.SaveChangesAsync();

        // Act - Try to access branding settings for club user doesn't admin
        var response = await _client.GetAsync($"/api/branding/{otherClub.Id}/settings");
        
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(System.Net.HttpStatusCode.Unauthorized));
    }

    // Helper methods to create test images
    private byte[] CreateValidPngBytes()
    {
        return new byte[]
        {
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0x1D, 0x01, 0x01, 0x00, 0x00, 0xFF,
            0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2,
            0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        };
    }

    private byte[] CreateValidIcoBytes()
    {
        // Minimal valid ICO file
        return new byte[]
        {
            0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x01,
            0x00, 0x00, 0x01, 0x00, 0x08, 0x00, 0x68, 0x05,
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00,
            0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02, 0x00,
            0x00, 0x00, 0x01, 0x00, 0x08, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        };
    }

    private byte[] CreateValidJpegBytes()
    {
        // Minimal valid JPEG file
        return new byte[]
        {
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
            0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
            0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
            0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
            0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
            0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
            0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
            0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
            0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11,
            0x01, 0x03, 0x11, 0x01, 0xFF, 0xC4, 0x00, 0x1F,
            0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01,
            0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
            0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00,
            0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xD2,
            0xCF, 0x20, 0xFF, 0xD9
        };
    }

    private byte[] CreateValidSvgBytes()
    {
        var svg = @"<?xml version=""1.0"" encoding=""UTF-8""?>
        <svg xmlns=""http://www.w3.org/2000/svg"" width=""16"" height=""16"" viewBox=""0 0 16 16"">
            <circle cx=""8"" cy=""8"" r=""6"" fill=""#3B82F6"/>
        </svg>";
        return Encoding.UTF8.GetBytes(svg);
    }

    private class AuthResponse
    {
        public string Token { get; set; }
        public User User { get; set; }
    }
}
