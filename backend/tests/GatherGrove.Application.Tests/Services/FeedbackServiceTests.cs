using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class FeedbackServiceTests
{
    private GatherGroveDbContext _context = null!;
    private Mock<IEmailService> _mockEmailService = null!;
    private Mock<ILogger<FeedbackService>> _mockLogger = null!;
    private FeedbackService _service = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockEmailService = new Mock<IEmailService>();
        _mockLogger = new Mock<ILogger<FeedbackService>>();

        _service = new FeedbackService(
            _context,
            _mockEmailService.Object,
            _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    #region SubmitFeedbackAsync Tests

    [Test]
    public async Task SubmitFeedbackAsync_ValidRequest_SavesFeedbackToDatabase()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "Feature Request",
            Message = "Would love to see a mobile app!",
            Name = "John Doe",
            Email = "john@example.com",
            Platform = "web",
            PageUrl = "https://gathergrove.club/dashboard"
        };

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.SubmitFeedbackAsync(request, null, "127.0.0.1", "TestBrowser/1.0");

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.FeedbackId, Is.Not.Null);
        Assert.That(result.Message, Does.Contain("Thank you"));

        // Verify database entry
        var savedFeedback = await _context.AppFeedback.FirstOrDefaultAsync();
        Assert.That(savedFeedback, Is.Not.Null);
        Assert.That(savedFeedback!.Rating, Is.EqualTo(5));
        Assert.That(savedFeedback.Subject, Is.EqualTo("Feature Request"));
        Assert.That(savedFeedback.Message, Does.Contain("mobile app"));
        Assert.That(savedFeedback.Name, Is.EqualTo("John Doe"));
        Assert.That(savedFeedback.Email, Is.EqualTo("john@example.com"));
        Assert.That(savedFeedback.Platform, Is.EqualTo("web"));
        Assert.That(savedFeedback.IpAddress, Is.EqualTo("127.0.0.1"));
    }

    [Test]
    public async Task SubmitFeedbackAsync_AuthenticatedUser_UsesUserInfo()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Jane Smith",
            Email = "jane@example.com",
            PasswordHash = "hash"
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new SubmitAppFeedbackRequest
        {
            Rating = 4,
            Subject = "Bug Report",
            Message = "Found a bug in the event calendar",
            Platform = "web"
        };

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.SubmitFeedbackAsync(request, 1, "192.168.1.1", "Chrome/91.0");

        // Assert
        Assert.That(result.Success, Is.True);

        var savedFeedback = await _context.AppFeedback.FirstOrDefaultAsync();
        Assert.That(savedFeedback, Is.Not.Null);
        Assert.That(savedFeedback!.UserId, Is.EqualTo(1));
        Assert.That(savedFeedback.Name, Is.EqualTo("Jane Smith"));
        Assert.That(savedFeedback.Email, Is.EqualTo("jane@example.com"));
    }

    [Test]
    public async Task SubmitFeedbackAsync_SendsEmailNotification()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 3,
            Subject = "General Feedback",
            Message = "Just wanted to say hello!",
            Platform = "mobile"
        };

        string? capturedRecipient = null;
        string? capturedSubject = null;
        string? capturedBody = null;

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .Callback<string, string, string, string?>((to, subj, body, _) =>
            {
                capturedRecipient = to;
                capturedSubject = subj;
                capturedBody = body;
            })
            .ReturnsAsync(true);

        // Act
        var result = await _service.SubmitFeedbackAsync(request, null, "10.0.0.1", "Safari/14.0");

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(capturedRecipient, Is.EqualTo("support@gathergrove.club"));
        Assert.That(capturedSubject, Does.Contain("[GatherGrove Feedback]"));
        Assert.That(capturedSubject, Does.Contain("General Feedback"));
        Assert.That(capturedBody, Does.Contain("★★★"));
        Assert.That(capturedBody, Does.Contain("Just wanted to say hello"));
    }

    [Test]
    public async Task SubmitFeedbackAsync_EmailFails_StillSavesToDatabase()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "Feature Request",
            Message = "Please add Light-Only Mode!",
            Platform = "web"
        };

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.SubmitFeedbackAsync(request, null, "127.0.0.1", "TestBrowser");

        // Assert
        Assert.That(result.Success, Is.True);

        var savedFeedback = await _context.AppFeedback.FirstOrDefaultAsync();
        Assert.That(savedFeedback, Is.Not.Null);
        Assert.That(savedFeedback!.EmailSent, Is.False);
    }

    [Test]
    public async Task SubmitFeedbackAsync_TruncatesLongUserAgent()
    {
        // Arrange
        var longUserAgent = new string('x', 600); // Exceeds 500 character limit

        var request = new SubmitAppFeedbackRequest
        {
            Rating = 4,
            Subject = "Test",
            Message = "Testing long user agent",
            Platform = "web"
        };

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.SubmitFeedbackAsync(request, null, "127.0.0.1", longUserAgent);

        // Assert
        Assert.That(result.Success, Is.True);

        var savedFeedback = await _context.AppFeedback.FirstOrDefaultAsync();
        Assert.That(savedFeedback, Is.Not.Null);
        Assert.That(savedFeedback!.UserAgent?.Length, Is.EqualTo(500));
    }

    #endregion

    #region Rating Tests

    [Test]
    [TestCase(1)]
    [TestCase(2)]
    [TestCase(3)]
    [TestCase(4)]
    [TestCase(5)]
    public async Task SubmitFeedbackAsync_AllRatings_Succeed(int rating)
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = rating,
            Subject = "Test",
            Message = $"Testing rating {rating}",
            Platform = "web"
        };

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.SubmitFeedbackAsync(request, null, "127.0.0.1", "TestBrowser");

        // Assert
        Assert.That(result.Success, Is.True);

        var savedFeedback = await _context.AppFeedback.FirstOrDefaultAsync();
        Assert.That(savedFeedback?.Rating, Is.EqualTo(rating));

        // Clean up for parameterized test
        _context.AppFeedback.RemoveRange(_context.AppFeedback);
        await _context.SaveChangesAsync();
    }

    #endregion

    #region Email Content Tests

    [Test]
    public async Task SubmitFeedbackAsync_EmailContainsStarRating()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 4,
            Subject = "Test",
            Message = "Testing email format",
            Platform = "web"
        };

        string? capturedEmailBody = null;
        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .Callback<string, string, string, string?>((_, _, body, _) => capturedEmailBody = body)
            .ReturnsAsync(true);

        // Act
        await _service.SubmitFeedbackAsync(request, null, "127.0.0.1", "TestBrowser");

        // Assert
        Assert.That(capturedEmailBody, Is.Not.Null);
        Assert.That(capturedEmailBody, Does.Contain("★★★★")); // 4 filled stars
        Assert.That(capturedEmailBody, Does.Contain("☆")); // 1 empty star
    }

    [Test]
    public async Task SubmitFeedbackAsync_EmailSubjectContainsCategory()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "Bug Report",
            Message = "Testing email subject",
            Platform = "web"
        };

        string? capturedSubject = null;
        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .Callback<string, string, string, string?>((_, subject, _, _) => capturedSubject = subject)
            .ReturnsAsync(true);

        // Act
        await _service.SubmitFeedbackAsync(request, null, "127.0.0.1", "TestBrowser");

        // Assert
        Assert.That(capturedSubject, Does.Contain("[GatherGrove Feedback]"));
        Assert.That(capturedSubject, Does.Contain("Bug Report"));
    }

    #endregion

    #region Anonymous vs Authenticated User Tests

    [Test]
    public async Task SubmitFeedbackAsync_AnonymousUser_UsesProvidedNameAndEmail()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "Test",
            Message = "Anonymous feedback test",
            Name = "Anonymous User",
            Email = "anon@example.com",
            Platform = "web"
        };

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.SubmitFeedbackAsync(request, null, "127.0.0.1", "TestBrowser");

        // Assert
        Assert.That(result.Success, Is.True);

        var savedFeedback = await _context.AppFeedback.FirstOrDefaultAsync();
        Assert.That(savedFeedback?.UserId, Is.Null);
        Assert.That(savedFeedback?.Name, Is.EqualTo("Anonymous User"));
        Assert.That(savedFeedback?.Email, Is.EqualTo("anon@example.com"));
    }

    [Test]
    public async Task SubmitFeedbackAsync_AnonymousUser_OptionalFieldsCanBeNull()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 3,
            Subject = "Test",
            Message = "Anonymous without contact info",
            Platform = "web"
        };

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.SubmitFeedbackAsync(request, null, "127.0.0.1", "TestBrowser");

        // Assert
        Assert.That(result.Success, Is.True);

        var savedFeedback = await _context.AppFeedback.FirstOrDefaultAsync();
        Assert.That(savedFeedback?.Name, Is.Null);
        Assert.That(savedFeedback?.Email, Is.Null);
    }

    #endregion

    #region Platform Tests

    [Test]
    [TestCase("web")]
    [TestCase("mobile")]
    public async Task SubmitFeedbackAsync_AllPlatforms_SaveCorrectly(string platform)
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "Test",
            Message = $"Testing {platform} platform",
            Platform = platform
        };

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.SubmitFeedbackAsync(request, null, "127.0.0.1", "TestBrowser");

        // Assert
        Assert.That(result.Success, Is.True);

        var savedFeedback = await _context.AppFeedback.FirstOrDefaultAsync();
        Assert.That(savedFeedback?.Platform, Is.EqualTo(platform));

        // Clean up for parameterized test
        _context.AppFeedback.RemoveRange(_context.AppFeedback);
        await _context.SaveChangesAsync();
    }

    #endregion
}
