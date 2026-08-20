using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Tests.TestUtilities;
using NUnit.Framework;

namespace GatherGrove.Infrastructure.Tests.Repositories;

[TestFixture]
public class BrandingRepositoryTests : RepositoryTestBase
{
    private BrandingRepository _repository = null!;
    private Club _testClub = null!;

    [SetUp]
    public void SetUp()
    {
        CreateContext();
        _repository = new BrandingRepository(Context);

        // Setup test club
        _testClub = new Club
        {
            Id = 1,
            Name = "Test Club",
            Tier = "Unlimited",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Clubs.Add(_testClub);
        Context.SaveChanges();
    }

    #region GetByClubIdAsync Tests

    [Test]
    public async Task GetByClubIdAsync_ExistingBranding_ReturnsBrandingWithClub()
    {
        // Arrange
        var branding = new ClubBranding
        {
            ClubId = _testClub.Id,
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            LogoUrl = "https://example.com/logo.png",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ClubBrandings.Add(branding);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.PrimaryColor, Is.EqualTo("#FF0000"));
        Assert.That(result.SecondaryColor, Is.EqualTo("#00FF00"));
        Assert.That(result.Club, Is.Not.Null);
        Assert.That(result.Club.Name, Is.EqualTo("Test Club"));
    }

    [Test]
    public async Task GetByClubIdAsync_NonExistentBranding_ReturnsNull()
    {
        // Act
        var result = await _repository.GetByClubIdAsync(999);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetByClubIdAsync_MultipleBrandings_ReturnsCorrectOne()
    {
        // Arrange
        var club2 = new Club
        {
            Id = 2,
            Name = "Club 2",
            Tier = "Unlimited",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Clubs.Add(club2);

        var branding1 = new ClubBranding
        {
            ClubId = _testClub.Id,
            PrimaryColor = "#FF0000",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var branding2 = new ClubBranding
        {
            ClubId = club2.Id,
            PrimaryColor = "#0000FF",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ClubBrandings.AddRange(branding1, branding2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.PrimaryColor, Is.EqualTo("#FF0000"));
    }

    #endregion

    #region AddAsync Tests

    [Test]
    public async Task AddAsync_ValidBranding_CreatesAndReturnsBranding()
    {
        // Arrange
        var branding = new ClubBranding
        {
            ClubId = _testClub.Id,
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            LogoUrl = "https://example.com/logo.png",
            FontFamily = "Arial",
            WhiteLabelDomain = "club.example.com",
            HideGatherGroveBranding = true
        };

        // Act
        var result = await _repository.AddAsync(branding);

        // Assert
        Assert.That(result.Id, Is.GreaterThan(0));
        Assert.That(result.PrimaryColor, Is.EqualTo("#FF0000"));
        Assert.That(result.SecondaryColor, Is.EqualTo("#00FF00"));
        Assert.That(result.HideGatherGroveBranding, Is.True);
    }

    [Test]
    public async Task AddAsync_SetsTimestamps()
    {
        // Arrange
        var branding = new ClubBranding
        {
            ClubId = _testClub.Id,
            PrimaryColor = "#FF0000"
        };

        // Act
        var result = await _repository.AddAsync(branding);

        // Assert
        Assert.That(result.CreatedAt, Is.Not.EqualTo(default(DateTime)));
        Assert.That(result.UpdatedAt, Is.Not.EqualTo(default(DateTime)));
        Assert.That(result.CreatedAt, Is.EqualTo(result.UpdatedAt).Within(TimeSpan.FromSeconds(1)));
    }

    [Test]
    public async Task AddAsync_WithSocialMediaUrls_PreservesUrls()
    {
        // Arrange
        var branding = new ClubBranding
        {
            ClubId = _testClub.Id,
            FacebookUrl = "https://facebook.com/testclub",
            TwitterUrl = "https://twitter.com/testclub",
            InstagramUrl = "https://instagram.com/testclub",
            LinkedInUrl = "https://linkedin.com/company/testclub",
            YouTubeUrl = "https://youtube.com/channel/testclub",
            WebsiteUrl = "https://www.testclub.com"
        };

        // Act
        var result = await _repository.AddAsync(branding);

        // Assert
        Assert.That(result.FacebookUrl, Is.EqualTo("https://facebook.com/testclub"));
        Assert.That(result.TwitterUrl, Is.EqualTo("https://twitter.com/testclub"));
        Assert.That(result.InstagramUrl, Is.EqualTo("https://instagram.com/testclub"));
        Assert.That(result.LinkedInUrl, Is.EqualTo("https://linkedin.com/company/testclub"));
        Assert.That(result.YouTubeUrl, Is.EqualTo("https://youtube.com/channel/testclub"));
        Assert.That(result.WebsiteUrl, Is.EqualTo("https://www.testclub.com"));
    }

    #endregion

    #region UpdateAsync Tests

    [Test]
    public async Task UpdateAsync_ExistingBranding_UpdatesAndReturns()
    {
        // Arrange
        var branding = new ClubBranding
        {
            ClubId = _testClub.Id,
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        Context.ClubBrandings.Add(branding);
        await Context.SaveChangesAsync();

        var originalUpdatedAt = branding.UpdatedAt;

        // Modify branding
        branding.PrimaryColor = "#0000FF";
        branding.SecondaryColor = "#FFFF00";

        // Act
        var result = await _repository.UpdateAsync(branding);

        // Assert
        Assert.That(result.PrimaryColor, Is.EqualTo("#0000FF"));
        Assert.That(result.SecondaryColor, Is.EqualTo("#FFFF00"));
        Assert.That(result.UpdatedAt, Is.GreaterThan(originalUpdatedAt));
    }

    [Test]
    public async Task UpdateAsync_UpdatesTimestamp()
    {
        // Arrange
        var branding = new ClubBranding
        {
            ClubId = _testClub.Id,
            PrimaryColor = "#FF0000",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        Context.ClubBrandings.Add(branding);
        await Context.SaveChangesAsync();

        var originalCreatedAt = branding.CreatedAt;
        var originalUpdatedAt = branding.UpdatedAt;

        branding.PrimaryColor = "#0000FF";

        // Act
        var result = await _repository.UpdateAsync(branding);

        // Assert
        Assert.That(result.CreatedAt, Is.EqualTo(originalCreatedAt)); // CreatedAt should not change
        Assert.That(result.UpdatedAt, Is.GreaterThan(originalUpdatedAt)); // UpdatedAt should be newer
    }

    #endregion

    #region DeleteAsync Tests

    [Test]
    public async Task DeleteAsync_ExistingBranding_RemovesBranding()
    {
        // Arrange
        var branding = new ClubBranding
        {
            ClubId = _testClub.Id,
            PrimaryColor = "#FF0000",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ClubBrandings.Add(branding);
        await Context.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(branding);

        // Assert
        var result = await _repository.GetByClubIdAsync(_testClub.Id);
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task DeleteAsync_RemovedFromDatabase()
    {
        // Arrange
        var branding = new ClubBranding
        {
            ClubId = _testClub.Id,
            PrimaryColor = "#FF0000",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ClubBrandings.Add(branding);
        await Context.SaveChangesAsync();

        var brandingId = branding.Id;

        // Act
        await _repository.DeleteAsync(branding);

        // Assert
        var exists = await _repository.ExistsAsync(_testClub.Id);
        Assert.That(exists, Is.False);
    }

    #endregion

    #region ExistsAsync Tests

    [Test]
    public async Task ExistsAsync_BrandingExists_ReturnsTrue()
    {
        // Arrange
        var branding = new ClubBranding
        {
            ClubId = _testClub.Id,
            PrimaryColor = "#FF0000",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ClubBrandings.Add(branding);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.ExistsAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ExistsAsync_BrandingDoesNotExist_ReturnsFalse()
    {
        // Act
        var result = await _repository.ExistsAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task ExistsAsync_AfterDeletion_ReturnsFalse()
    {
        // Arrange
        var branding = new ClubBranding
        {
            ClubId = _testClub.Id,
            PrimaryColor = "#FF0000",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ClubBrandings.Add(branding);
        await Context.SaveChangesAsync();

        await _repository.DeleteAsync(branding);

        // Act
        var result = await _repository.ExistsAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion
}
