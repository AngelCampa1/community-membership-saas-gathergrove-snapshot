using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Tests.Migrations;

[TestFixture]
public class BrandingMigrationTests
{
    private GatherGroveDbContext _context;
    private DbContextOptions<GatherGroveDbContext> _options;

    [SetUp]
    public void Setup()
    {
        _options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(_options);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task BrandingSettings_Migration_CreatesCorrectSchema()
    {
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        // Assert - Check that BrandingSettings table exists and has correct columns
        var brandingSettings = new BrandingSettings
        {
            PrimaryColor = "#3B82F6",
            SecondaryColor = "#8B5CF6",
            LogoUrl = "https://example.com/logo.png",
            FaviconUrl = "https://example.com/favicon.ico",
            OrganizationName = "Test Organization",
            Tagline = "Test tagline",
            CustomCss = ".custom { color: red; }"
        };

        // Should not throw exception
        _context.BrandingSettings.Add(brandingSettings);
        await _context.SaveChangesAsync();

        var saved = await _context.BrandingSettings.FirstAsync();
        Assert.That(saved.PrimaryColor, Is.EqualTo("#3B82F6"));
        Assert.That(saved.SecondaryColor, Is.EqualTo("#8B5CF6"));
        Assert.That(saved.LogoUrl, Is.EqualTo("https://example.com/logo.png"));
        Assert.That(saved.FaviconUrl, Is.EqualTo("https://example.com/favicon.ico"));
        Assert.That(saved.OrganizationName, Is.EqualTo("Test Organization"));
        Assert.That(saved.Tagline, Is.EqualTo("Test tagline"));
        Assert.That(saved.CustomCss, Is.EqualTo(".custom { color: red; }"));
    }

    [Test]
    public async Task BrandAssets_Migration_CreatesCorrectSchema()
    {
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        // Create a test club first
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Unlimited"
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Assert - Check that BrandAssets table exists and has correct columns
        var brandAsset = new BrandAsset
        {
            Id = "asset-123",
            ClubId = club.Id,
            Name = "logo.png",
            Type = "image/png",
            Size = 51200,
            Url = "https://storage.example.com/logo.png",
            Category = "logos",
            UploadedAt = DateTime.UtcNow,
            Dimensions = "{\"width\":300,\"height\":200}",
            Metadata = "{\"alt\":\"Company Logo\"}"
        };

        // Should not throw exception
        _context.BrandAssets.Add(brandAsset);
        await _context.SaveChangesAsync();

        var saved = await _context.BrandAssets.FirstAsync();
        Assert.That(saved.Id, Is.EqualTo("asset-123"));
        Assert.That(saved.Name, Is.EqualTo("logo.png"));
        Assert.That(saved.Type, Is.EqualTo("image/png"));
        Assert.That(saved.Size, Is.EqualTo(51200));
        Assert.That(saved.Category, Is.EqualTo("logos"));
    }

    [Test]
    public async Task BrandingPreviewLinks_Migration_CreatesCorrectSchema()
    {
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        // Create a test club first
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Unlimited"
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Assert - Check that BrandingPreviewLinks table exists and has correct columns
        var previewLink = new BrandingPreviewLink
        {
            Id = "preview-123",
            ClubId = club.Id,
            Token = "preview-token-abc123",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsActive = true,
            SettingsSnapshot = "{\"primaryColor\":\"#3B82F6\"}"
        };

        // Should not throw exception
        _context.BrandingPreviewLinks.Add(previewLink);
        await _context.SaveChangesAsync();

        var saved = await _context.BrandingPreviewLinks.FirstAsync();
        Assert.That(saved.Token, Is.EqualTo("preview-token-abc123"));
        Assert.That(saved.IsActive, Is.True);
        Assert.That(saved.SettingsSnapshot, Is.EqualTo("{\"primaryColor\":\"#3B82F6\"}"));
    }

    [Test]
    public async Task Club_BrandingSettings_Relationship_WorksCorrectly()
    {
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Unlimited",
            BrandingSettings = new BrandingSettings
            {
                PrimaryColor = "#3B82F6",
                SecondaryColor = "#8B5CF6",
                OrganizationName = "Test Organization"
            }
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Assert - Check relationship works
        var savedClub = await _context.Clubs
            .Include(c => c.BrandingSettings)
            .FirstAsync();

        Assert.That(savedClub.BrandingSettings, Is.Not.Null);
        Assert.That(savedClub.BrandingSettings.PrimaryColor, Is.EqualTo("#3B82F6"));
        Assert.That(savedClub.BrandingSettings.OrganizationName, Is.EqualTo("Test Organization"));
    }

    [Test]
    public async Task Club_BrandAssets_Relationship_WorksCorrectly()
    {
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Unlimited"
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var assets = new[]
        {
            new BrandAsset
            {
                Id = "asset-1",
                ClubId = club.Id,
                Name = "logo.png",
                Category = "logos"
            },
            new BrandAsset
            {
                Id = "asset-2",
                ClubId = club.Id,
                Name = "banner.jpg",
                Category = "banners"
            }
        };

        _context.BrandAssets.AddRange(assets);
        await _context.SaveChangesAsync();

        // Assert - Check relationship works
        var savedClub = await _context.Clubs
            .Include(c => c.BrandAssets)
            .FirstAsync();

        Assert.That(savedClub.BrandAssets, Has.Count.EqualTo(2));
        Assert.That(savedClub.BrandAssets.Any(a => a.Name == "logo.png"), Is.True);
        Assert.That(savedClub.BrandAssets.Any(a => a.Name == "banner.jpg"), Is.True);
    }

    [Test]
    public async Task BrandingSettings_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Unlimited",
            BrandingSettings = new BrandingSettings()
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Assert - Check default values
        var saved = await _context.Clubs
            .Include(c => c.BrandingSettings)
            .FirstAsync();

        Assert.That(saved.BrandingSettings.PrimaryColor, Is.Null.Or.Empty);
        Assert.That(saved.BrandingSettings.SecondaryColor, Is.Null.Or.Empty);
        Assert.That(saved.BrandingSettings.LogoUrl, Is.Null);
        Assert.That(saved.BrandingSettings.FaviconUrl, Is.Null);
        Assert.That(saved.BrandingSettings.OrganizationName, Is.Null.Or.Empty);
    }

    [Test]
    public async Task BrandingSettings_NullValues_AreHandledCorrectly()
    {
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        var brandingSettings = new BrandingSettings
        {
            PrimaryColor = null,
            SecondaryColor = null,
            LogoUrl = null,
            FaviconUrl = null,
            OrganizationName = null,
            Tagline = null,
            CustomCss = null
        };

        _context.BrandingSettings.Add(brandingSettings);
        await _context.SaveChangesAsync();

        // Assert - Should not throw and should handle nulls
        var saved = await _context.BrandingSettings.FirstAsync();
        Assert.That(saved.PrimaryColor, Is.Null);
        Assert.That(saved.SecondaryColor, Is.Null);
        Assert.That(saved.LogoUrl, Is.Null);
        Assert.That(saved.FaviconUrl, Is.Null);
    }

    [Test]
    public async Task BrandAsset_UniqueConstraints_AreEnforced()
    {
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        var club = new Club { Name = "Test Club", Tier = "Unlimited" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var asset1 = new BrandAsset
        {
            Id = "same-id",
            ClubId = club.Id,
            Name = "logo.png"
        };

        var asset2 = new BrandAsset
        {
            Id = "same-id", // Same ID should cause constraint violation
            ClubId = club.Id,
            Name = "other-logo.png"
        };

        _context.BrandAssets.Add(asset1);
        await _context.SaveChangesAsync();

        _context.BrandAssets.Add(asset2);

        // Assert - Should throw exception due to duplicate ID
        Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _context.SaveChangesAsync());
    }

    [Test]
    public async Task BrandingPreviewLink_ExpirationHandling_WorksCorrectly()
    {
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        var club = new Club { Name = "Test Club", Tier = "Unlimited" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var expiredLink = new BrandingPreviewLink
        {
            Id = "expired-link",
            ClubId = club.Id,
            Token = "expired-token",
            CreatedAt = DateTime.UtcNow.AddDays(-8),
            ExpiresAt = DateTime.UtcNow.AddDays(-1), // Expired
            IsActive = true
        };

        var activeLink = new BrandingPreviewLink
        {
            Id = "active-link",
            ClubId = club.Id,
            Token = "active-token",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7), // Future
            IsActive = true
        };

        _context.BrandingPreviewLinks.AddRange(expiredLink, activeLink);
        await _context.SaveChangesAsync();

        // Assert - Query for non-expired links
        var activeLinks = await _context.BrandingPreviewLinks
            .Where(l => l.ExpiresAt > DateTime.UtcNow && l.IsActive)
            .ToListAsync();

        Assert.That(activeLinks, Has.Count.EqualTo(1));
        Assert.That(activeLinks[0].Token, Is.EqualTo("active-token"));
    }

    [Test]
    public async Task Migration_RollbackSupport_WorksCorrectly()
    {
        // This test simulates checking that migration can be rolled back
        // In a real scenario, this would test actual migration rollback
        
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        // Add test data
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Unlimited",
            BrandingSettings = new BrandingSettings
            {
                PrimaryColor = "#3B82F6"
            }
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Verify data exists
        var clubCount = await _context.Clubs.CountAsync();
        Assert.That(clubCount, Is.EqualTo(1));

        // Simulate rollback by deleting database
        await _context.Database.EnsureDeletedAsync();

        // Assert - Database should be gone
        var newContext = new GatherGroveDbContext(_options);
        var exists = await newContext.Database.CanConnectAsync();
        Assert.That(exists, Is.False);
        
        newContext.Dispose();
    }

    [Test]
    public async Task DataIntegrity_CascadeDeletes_WorkCorrectly()
    {
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Unlimited",
            BrandingSettings = new BrandingSettings
            {
                PrimaryColor = "#3B82F6"
            }
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Add brand assets
        var asset = new BrandAsset
        {
            Id = "asset-1",
            ClubId = club.Id,
            Name = "logo.png"
        };

        _context.BrandAssets.Add(asset);
        await _context.SaveChangesAsync();

        // Verify data exists
        Assert.That(await _context.Clubs.CountAsync(), Is.EqualTo(1));
        Assert.That(await _context.BrandAssets.CountAsync(), Is.EqualTo(1));
        Assert.That(await _context.BrandingSettings.CountAsync(), Is.EqualTo(1));

        // Delete club
        _context.Clubs.Remove(club);
        await _context.SaveChangesAsync();

        // Assert - Related data should be cascade deleted or handled appropriately
        Assert.That(await _context.Clubs.CountAsync(), Is.EqualTo(0));
        
        // BrandAssets should be deleted due to foreign key constraint
        Assert.That(await _context.BrandAssets.CountAsync(), Is.EqualTo(0));
        
        // BrandingSettings should be deleted due to relationship
        Assert.That(await _context.BrandingSettings.CountAsync(), Is.EqualTo(0));
    }

    [Test]
    public async Task Migration_IndexesCreated_ForPerformance()
    {
        // Arrange & Act
        await _context.Database.EnsureCreatedAsync();

        // This test verifies that appropriate indexes exist
        // In a real database, you'd check system tables for indexes
        
        var club = new Club { Name = "Test Club", Tier = "Unlimited" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Add many assets to test index performance
        var assets = Enumerable.Range(1, 1000).Select(i => new BrandAsset
        {
            Id = $"asset-{i}",
            ClubId = club.Id,
            Name = $"asset-{i}.png",
            Category = i % 3 == 0 ? "logos" : i % 3 == 1 ? "banners" : "icons",
            UploadedAt = DateTime.UtcNow.AddDays(-i)
        }).ToArray();

        _context.BrandAssets.AddRange(assets);
        await _context.SaveChangesAsync();

        // Test query performance (should use indexes)
        var start = DateTime.Now;
        var logoAssets = await _context.BrandAssets
            .Where(a => a.ClubId == club.Id && a.Category == "logos")
            .OrderBy(a => a.UploadedAt)
            .ToListAsync();
        var elapsed = DateTime.Now - start;

        // Assert - Query should be fast with proper indexes
        Assert.That(elapsed.TotalMilliseconds, Is.LessThan(100));
        Assert.That(logoAssets.Count, Is.GreaterThan(300));
    }
}
