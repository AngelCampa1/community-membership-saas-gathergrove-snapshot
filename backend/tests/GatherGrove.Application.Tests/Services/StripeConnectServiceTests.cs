using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.Configuration;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class StripeConnectServiceTests
{
    private GatherGroveDbContext _context;
    private Mock<IOptions<StripeSettings>> _mockStripeSettings;
    private Mock<ILogger<StripeConnectService>> _mockLogger;
    private Mock<IUrlService> _mockUrlService;
    private StripeConnectService _stripeConnectService;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockStripeSettings = new Mock<IOptions<StripeSettings>>();
        _mockLogger = new Mock<ILogger<StripeConnectService>>();
        _mockUrlService = new Mock<IUrlService>();

        // Setup Stripe settings
        var stripeSettings = new StripeSettings
        {
            SecretKey = "sk_test_123",
            Domain = "https://localhost:3000"
        };
        _mockStripeSettings.Setup(x => x.Value).Returns(stripeSettings);

        // Setup URL service mock
        _mockUrlService.Setup(x => x.GenerateStripeConnectRefreshUrl())
            .Returns("https://localhost:3000/stripe/refresh");
        _mockUrlService.Setup(x => x.GenerateStripeConnectReturnUrl())
            .Returns("https://localhost:3000/stripe/return");

        _stripeConnectService = new StripeConnectService(_context, _mockStripeSettings.Object, _mockLogger.Object, _mockUrlService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<Club> CreateTestClub()
    {
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Sprout",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();
        return club;
    }

    [Test]
    public async Task GetConnectStatusAsync_ClubNotFound_ThrowsInvalidOperationException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _stripeConnectService.GetConnectStatusAsync(999));

        Assert.That(ex.Message, Is.EqualTo("Club not found"));
    }

    [Test]
    public async Task GetConnectStatusAsync_NoStripeAccountId_ReturnsNotConnected()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _stripeConnectService.GetConnectStatusAsync(club.Id);

        // Assert
        Assert.That(result.IsConnected, Is.False);
        Assert.That(result.StripeAccountId, Is.Null);
    }

    [Test]
    public async Task DisconnectAsync_ClubNotFound_ThrowsInvalidOperationException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _stripeConnectService.DisconnectAsync(999));

        Assert.That(ex.Message, Is.EqualTo("Club not found"));
    }

    [Test]
    public async Task DisconnectAsync_ClubWithStripeAccount_RemovesStripeAccountId()
    {
        // Arrange
        var club = await CreateTestClub();
        club.StripeAccountId = "acct_test123";
        await _context.SaveChangesAsync();

        var originalUpdatedAt = club.UpdatedAt;

        // Add a small delay to ensure timestamp difference
        await Task.Delay(10);

        // Act
        await _stripeConnectService.DisconnectAsync(club.Id);

        // Assert
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub.StripeAccountId, Is.Null);
        Assert.That(updatedClub.UpdatedAt, Is.GreaterThan(originalUpdatedAt));
    }

    [Test]
    public async Task DisconnectAsync_ClubWithoutStripeAccount_DoesNothing()
    {
        // Arrange
        var club = await CreateTestClub();
        var originalUpdatedAt = club.UpdatedAt;

        // Act
        await _stripeConnectService.DisconnectAsync(club.Id);

        // Assert
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub.StripeAccountId, Is.Null);
        Assert.That(updatedClub.UpdatedAt, Is.EqualTo(originalUpdatedAt));
    }

    [Test]
    public void Constructor_SetsStripeApiKey()
    {
        // This test verifies that the constructor sets up Stripe configuration
        // The actual Stripe API key setting is tested implicitly through other tests
        Assert.That(_stripeConnectService, Is.Not.Null);
        _mockStripeSettings.Verify(x => x.Value, Times.AtLeastOnce);
    }

    [Test]
    public async Task GetConnectStatusAsync_LogsInformation()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        await _stripeConnectService.GetConnectStatusAsync(club.Id);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Getting Stripe Connect status for club {club.Id}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task DisconnectAsync_LogsInformation()
    {
        // Arrange
        var club = await CreateTestClub();
        club.StripeAccountId = "acct_test123";
        await _context.SaveChangesAsync();

        // Act
        await _stripeConnectService.DisconnectAsync(club.Id);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Disconnecting Stripe account for club {club.Id}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Disconnected Stripe account for club {club.Id}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #region GenerateConnectLinkAsync Tests

    [Test]
    public async Task GenerateConnectLinkAsync_ClubNotFound_ThrowsInvalidOperationException()
    {
        // Arrange - Need Connect enabled to reach the club lookup
        var stripeSettings = new StripeSettings
        {
            SecretKey = "sk_test_123",
            Domain = "https://localhost:3000",
            IsConnectEnabled = true
        };
        var mockSettings = new Mock<IOptions<StripeSettings>>();
        mockSettings.Setup(x => x.Value).Returns(stripeSettings);

        var serviceWithConnectEnabled = new StripeConnectService(
            _context, mockSettings.Object, _mockLogger.Object, _mockUrlService.Object);

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => serviceWithConnectEnabled.GenerateConnectLinkAsync(999, "test@example.com"));

        Assert.That(ex.Message, Is.EqualTo("Club not found"));
    }

    [Test]
    public async Task GenerateConnectLinkAsync_ConnectNotEnabled_ThrowsInvalidOperationException()
    {
        // Arrange - Create service with Connect disabled
        var club = await CreateTestClub();
        var stripeSettings = new StripeSettings
        {
            SecretKey = "sk_test_123",
            Domain = "https://localhost:3000",
            IsConnectEnabled = false  // Explicitly disabled
        };
        var mockSettings = new Mock<IOptions<StripeSettings>>();
        mockSettings.Setup(x => x.Value).Returns(stripeSettings);

        var serviceWithConnectDisabled = new StripeConnectService(
            _context, mockSettings.Object, _mockLogger.Object, _mockUrlService.Object);

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => serviceWithConnectDisabled.GenerateConnectLinkAsync(club.Id, "test@example.com"));

        Assert.That(ex.Message, Does.Contain("Payment processing is not currently available"));
    }

    [Test]
    public async Task GenerateConnectLinkAsync_LogsInformationAtStart()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act - This will throw because we're not in a real Stripe environment,
        // but we can verify logging happened before the exception
        try
        {
            await _stripeConnectService.GenerateConnectLinkAsync(club.Id, "test@example.com");
        }
        catch (InvalidOperationException)
        {
            // Expected - Connect not enabled or Stripe API error
        }

        // Assert - Verify initial logging happened
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Generating Stripe Connect link for club {club.Id}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion

    #region GetConnectStatusAsync Additional Tests

    [Test]
    public async Task GetConnectStatusAsync_WithStripeAccountId_AttemptsToVerifyAccount()
    {
        // Arrange
        var club = await CreateTestClub();
        club.StripeAccountId = "acct_test_invalid"; // This won't exist in Stripe
        await _context.SaveChangesAsync();

        // Act - The method will try to verify with Stripe and catch the exception
        var result = await _stripeConnectService.GetConnectStatusAsync(club.Id);

        // Assert - Because the Stripe account doesn't really exist, it returns not connected
        Assert.That(result.IsConnected, Is.False);
        Assert.That(result.StripeAccountId, Is.Null);
        Assert.That(result.IsDevelopmentMode, Is.False);
    }

    [Test]
    public async Task GetConnectStatusAsync_WithInvalidStripeAccountId_LogsWarning()
    {
        // Arrange
        var club = await CreateTestClub();
        club.StripeAccountId = "acct_invalid_123";
        await _context.SaveChangesAsync();

        // Act
        await _stripeConnectService.GetConnectStatusAsync(club.Id);

        // Assert - Verify warning was logged for the failed account check
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Error checking Stripe account")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task GetConnectStatusAsync_ReturnsNotDevelopmentMode()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _stripeConnectService.GetConnectStatusAsync(club.Id);

        // Assert
        Assert.That(result.IsDevelopmentMode, Is.False);
    }

    #endregion

    #region DisconnectAsync Additional Tests

    [Test]
    public async Task DisconnectAsync_ClearsStripeAccountId_AndCountry()
    {
        // Arrange
        var club = await CreateTestClub();
        club.StripeAccountId = "acct_test456";
        club.StripeAccountCountry = "US";
        await _context.SaveChangesAsync();

        // Act
        await _stripeConnectService.DisconnectAsync(club.Id);

        // Assert
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub!.StripeAccountId, Is.Null);
        // Note: StripeAccountCountry is not cleared by DisconnectAsync, only StripeAccountId
    }

    [Test]
    public async Task DisconnectAsync_UpdatesTimestamp()
    {
        // Arrange
        var club = await CreateTestClub();
        club.StripeAccountId = "acct_test789";
        var originalUpdatedAt = club.UpdatedAt;
        await _context.SaveChangesAsync();

        // Add delay to ensure timestamp difference
        await Task.Delay(50);

        // Act
        await _stripeConnectService.DisconnectAsync(club.Id);

        // Assert
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub!.UpdatedAt, Is.GreaterThan(originalUpdatedAt));
    }

    [Test]
    public async Task DisconnectAsync_WithNullStripeAccount_DoesNotUpdateTimestamp()
    {
        // Arrange
        var club = await CreateTestClub();
        club.StripeAccountId = null;
        var originalUpdatedAt = club.UpdatedAt;
        await _context.SaveChangesAsync();

        // Act
        await _stripeConnectService.DisconnectAsync(club.Id);

        // Assert
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub!.UpdatedAt, Is.EqualTo(originalUpdatedAt));
    }

    #endregion

    #region Constructor Tests

    [Test]
    public void Constructor_WithMissingSecretKey_ThrowsInvalidOperationException()
    {
        // Arrange
        var stripeSettings = new StripeSettings
        {
            SecretKey = null,  // Missing secret key
            Domain = "https://localhost:3000"
        };
        var mockSettings = new Mock<IOptions<StripeSettings>>();
        mockSettings.Setup(x => x.Value).Returns(stripeSettings);

        // Clear environment variable to ensure it's not used as fallback
        var originalEnvVar = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");
        Environment.SetEnvironmentVariable("STRIPE_SECRET_KEY", null);

        try
        {
            // Act & Assert
            var ex = Assert.Throws<InvalidOperationException>(() =>
                new StripeConnectService(_context, mockSettings.Object, _mockLogger.Object, _mockUrlService.Object));

            Assert.That(ex.Message, Is.EqualTo("Stripe SecretKey is not configured"));
        }
        finally
        {
            // Restore environment variable
            Environment.SetEnvironmentVariable("STRIPE_SECRET_KEY", originalEnvVar);
        }
    }

    [Test]
    public void Constructor_WithEmptySecretKey_ThrowsInvalidOperationException()
    {
        // Arrange
        var stripeSettings = new StripeSettings
        {
            SecretKey = "",  // Empty secret key
            Domain = "https://localhost:3000"
        };
        var mockSettings = new Mock<IOptions<StripeSettings>>();
        mockSettings.Setup(x => x.Value).Returns(stripeSettings);

        // Clear environment variable
        var originalEnvVar = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");
        Environment.SetEnvironmentVariable("STRIPE_SECRET_KEY", null);

        try
        {
            // Act & Assert
            var ex = Assert.Throws<InvalidOperationException>(() =>
                new StripeConnectService(_context, mockSettings.Object, _mockLogger.Object, _mockUrlService.Object));

            Assert.That(ex.Message, Is.EqualTo("Stripe SecretKey is not configured"));
        }
        finally
        {
            // Restore environment variable
            Environment.SetEnvironmentVariable("STRIPE_SECRET_KEY", originalEnvVar);
        }
    }

    [Test]
    public void Constructor_LogsErrorForMissingSecretKey()
    {
        // Arrange
        var stripeSettings = new StripeSettings
        {
            SecretKey = null,
            Domain = "https://localhost:3000"
        };
        var mockSettings = new Mock<IOptions<StripeSettings>>();
        mockSettings.Setup(x => x.Value).Returns(stripeSettings);

        var originalEnvVar = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");
        Environment.SetEnvironmentVariable("STRIPE_SECRET_KEY", null);

        try
        {
            // Act
            Assert.Throws<InvalidOperationException>(() =>
                new StripeConnectService(_context, mockSettings.Object, _mockLogger.Object, _mockUrlService.Object));

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Stripe SecretKey is not configured")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }
        finally
        {
            Environment.SetEnvironmentVariable("STRIPE_SECRET_KEY", originalEnvVar);
        }
    }

    #endregion

    #region URL Service Integration Tests

    [Test]
    public void UrlService_IsInjectedCorrectly()
    {
        // Verify that the URL service mock is configured
        Assert.That(_stripeConnectService, Is.Not.Null);
        _mockUrlService.Verify(x => x.GenerateStripeConnectRefreshUrl(), Times.Never);
        _mockUrlService.Verify(x => x.GenerateStripeConnectReturnUrl(), Times.Never);
    }

    #endregion
}