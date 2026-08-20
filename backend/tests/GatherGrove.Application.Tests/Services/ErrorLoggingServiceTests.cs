using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class ErrorLoggingServiceTests
{
    private GatherGroveDbContext _context = null!;
    private ErrorLoggingService _service = null!;
    private Mock<ILogger<ErrorLoggingService>> _mockLogger = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<ErrorLoggingService>>();
        _service = new ErrorLoggingService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region LogErrorAsync (string overload) Tests

    [Test]
    public async Task LogErrorAsync_WithMessage_SavesErrorToDatabase()
    {
        // Act
        await _service.LogErrorAsync("Test error message");

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError, Is.Not.Null);
        Assert.That(savedError!.Message, Is.EqualTo("Test error message"));
    }

    [Test]
    public async Task LogErrorAsync_WithAllParameters_SavesCompleteError()
    {
        // Arrange
        var additionalData = new Dictionary<string, object> { { "key", "value" } };

        // Act
        await _service.LogErrorAsync(
            message: "Complete error",
            source: "TestSource",
            stackTrace: "at Test.Method()",
            level: "Critical",
            requestMethod: "POST",
            requestPath: "/api/test",
            userId: "user123",
            userAgent: "TestAgent",
            ipAddress: "192.168.1.1",
            clubId: 42,
            additionalData: additionalData
        );

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError, Is.Not.Null);
        Assert.That(savedError!.Source, Is.EqualTo("TestSource"));
        Assert.That(savedError.Level, Is.EqualTo("Critical"));
        Assert.That(savedError.RequestMethod, Is.EqualTo("POST"));
        Assert.That(savedError.RequestPath, Is.EqualTo("/api/test"));
        Assert.That(savedError.UserId, Is.EqualTo("user123"));
        Assert.That(savedError.UserAgent, Is.EqualTo("TestAgent"));
        Assert.That(savedError.IpAddress, Is.EqualTo("192.168.1.1"));
        Assert.That(savedError.ClubId, Is.EqualTo(42));
        Assert.That(savedError.AdditionalData, Does.Contain("key"));
    }

    [Test]
    public async Task LogErrorAsync_LongMessage_TruncatesTo500Chars()
    {
        // Arrange
        var longMessage = new string('x', 600);

        // Act
        await _service.LogErrorAsync(longMessage);

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError, Is.Not.Null);
        Assert.That(savedError!.Message.Length, Is.EqualTo(500));
        Assert.That(savedError.Message, Does.EndWith("..."));
    }

    [Test]
    public async Task LogErrorAsync_LongSource_TruncatesTo100Chars()
    {
        // Arrange
        var longSource = new string('x', 150);

        // Act
        await _service.LogErrorAsync("Test", source: longSource);

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError, Is.Not.Null);
        Assert.That(savedError!.Source.Length, Is.EqualTo(100));
    }

    [Test]
    public async Task LogErrorAsync_LongUserAgent_TruncatesTo50Chars()
    {
        // Arrange
        var longUserAgent = new string('x', 100);

        // Act
        await _service.LogErrorAsync("Test", userAgent: longUserAgent);

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError, Is.Not.Null);
        Assert.That(savedError!.UserAgent!.Length, Is.EqualTo(50));
    }

    [Test]
    public async Task LogErrorAsync_SetsCreatedAtToNow()
    {
        // Arrange
        var before = DateTime.UtcNow;

        // Act
        await _service.LogErrorAsync("Test error");

        var after = DateTime.UtcNow;

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError!.CreatedAt, Is.InRange(before, after));
    }

    [Test]
    public async Task LogErrorAsync_DefaultSource_UsesApplication()
    {
        // Act
        await _service.LogErrorAsync("Test error");

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError!.Source, Is.EqualTo("Application"));
    }

    [Test]
    public async Task LogErrorAsync_DefaultLevel_UsesError()
    {
        // Act
        await _service.LogErrorAsync("Test error");

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError!.Level, Is.EqualTo("Error"));
    }

    [Test]
    public async Task LogErrorAsync_WithNullOptionalParams_SavesSuccessfully()
    {
        // Act
        await _service.LogErrorAsync(
            message: "Test error",
            stackTrace: null,
            requestMethod: null,
            requestPath: null,
            userId: null,
            userAgent: null,
            ipAddress: null,
            clubId: null,
            additionalData: null
        );

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError, Is.Not.Null);
        Assert.That(savedError!.StackTrace, Is.Null);
        Assert.That(savedError.AdditionalData, Is.Null);
    }

    #endregion

    #region LogErrorAsync (Exception overload) Tests

    [Test]
    public async Task LogErrorAsync_WithException_SavesExceptionDetails()
    {
        // Arrange
        var exception = new InvalidOperationException("Test exception message");

        // Act
        await _service.LogErrorAsync(exception);

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError, Is.Not.Null);
        Assert.That(savedError!.Message, Is.EqualTo("Test exception message"));
        Assert.That(savedError.AdditionalData, Does.Contain("InvalidOperationException"));
    }

    [Test]
    public async Task LogErrorAsync_WithInnerException_SavesInnerExceptionDetails()
    {
        // Arrange
        var innerException = new ArgumentNullException("parameter");
        var exception = new InvalidOperationException("Outer message", innerException);

        // Act
        await _service.LogErrorAsync(exception);

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError, Is.Not.Null);
        Assert.That(savedError!.AdditionalData, Does.Contain("InnerException"));
        Assert.That(savedError.AdditionalData, Does.Contain("ArgumentNullException"));
    }

    [Test]
    public async Task LogErrorAsync_WithException_SavesStackTrace()
    {
        // Arrange
        Exception exception;
        try
        {
            throw new InvalidOperationException("Test");
        }
        catch (Exception ex)
        {
            exception = ex;
        }

        // Act
        await _service.LogErrorAsync(exception);

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError, Is.Not.Null);
        Assert.That(savedError!.StackTrace, Is.Not.Null);
    }

    [Test]
    public async Task LogErrorAsync_WithException_AllowsAdditionalData()
    {
        // Arrange
        var exception = new InvalidOperationException("Test");
        var additionalData = new Dictionary<string, object> { { "CustomKey", "CustomValue" } };

        // Act
        await _service.LogErrorAsync(exception, additionalData: additionalData);

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError, Is.Not.Null);
        Assert.That(savedError!.AdditionalData, Does.Contain("CustomKey"));
        Assert.That(savedError.AdditionalData, Does.Contain("CustomValue"));
    }

    [Test]
    public async Task LogErrorAsync_WithException_UsesErrorLevel()
    {
        // Arrange
        var exception = new InvalidOperationException("Test");

        // Act
        await _service.LogErrorAsync(exception);

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError!.Level, Is.EqualTo("Error"));
    }

    #endregion

    #region GetErrorLogsAsync Tests

    [Test]
    public async Task GetErrorLogsAsync_ReturnsLogsOrderedByDateDescending()
    {
        // Arrange
        await CreateTestErrorLogs();

        // Act
        var results = await _service.GetErrorLogsAsync();

        // Assert
        Assert.That(results.Count, Is.GreaterThan(0));
        Assert.That(results[0].CreatedAt, Is.GreaterThan(results[1].CreatedAt));
    }

    [Test]
    public async Task GetErrorLogsAsync_WithPageSize_LimitsResults()
    {
        // Arrange
        await CreateTestErrorLogs(10);

        // Act
        var results = await _service.GetErrorLogsAsync(pageSize: 5);

        // Assert
        Assert.That(results.Count, Is.EqualTo(5));
    }

    [Test]
    public async Task GetErrorLogsAsync_WithPageNumber_SkipsResults()
    {
        // Arrange
        await CreateTestErrorLogs(10);

        // Act
        var page1 = await _service.GetErrorLogsAsync(pageSize: 5, pageNumber: 1);
        var page2 = await _service.GetErrorLogsAsync(pageSize: 5, pageNumber: 2);

        // Assert
        Assert.That(page1.Count, Is.EqualTo(5));
        Assert.That(page2.Count, Is.EqualTo(5));
        Assert.That(page1[0].Id, Is.Not.EqualTo(page2[0].Id));
    }

    [Test]
    public async Task GetErrorLogsAsync_WithLevelFilter_ReturnsMatchingLogs()
    {
        // Arrange
        await _service.LogErrorAsync("Error 1", level: "Error");
        await _service.LogErrorAsync("Warning 1", level: "Warning");
        await _service.LogErrorAsync("Error 2", level: "Error");

        // Act
        var results = await _service.GetErrorLogsAsync(level: "Error");

        // Assert
        Assert.That(results.Count, Is.EqualTo(2));
        Assert.That(results.All(e => e.Level == "Error"), Is.True);
    }

    [Test]
    public async Task GetErrorLogsAsync_WithStartDate_ReturnsLogsAfterDate()
    {
        // Arrange
        var oldError = new ErrorLog
        {
            Message = "Old error",
            Source = "Test",
            Level = "Error",
            CreatedAt = DateTime.UtcNow.AddDays(-7)
        };
        _context.ErrorLogs.Add(oldError);
        await _context.SaveChangesAsync();

        await _service.LogErrorAsync("New error");

        var startDate = DateTime.UtcNow.AddDays(-1);

        // Act
        var results = await _service.GetErrorLogsAsync(startDate: startDate);

        // Assert
        Assert.That(results.Count, Is.EqualTo(1));
        Assert.That(results[0].Message, Is.EqualTo("New error"));
    }

    [Test]
    public async Task GetErrorLogsAsync_WithEndDate_ReturnsLogsBeforeDate()
    {
        // Arrange
        var oldError = new ErrorLog
        {
            Message = "Old error",
            Source = "Test",
            Level = "Error",
            CreatedAt = DateTime.UtcNow.AddDays(-7)
        };
        _context.ErrorLogs.Add(oldError);
        await _context.SaveChangesAsync();

        await _service.LogErrorAsync("New error");

        var endDate = DateTime.UtcNow.AddDays(-1);

        // Act
        var results = await _service.GetErrorLogsAsync(endDate: endDate);

        // Assert
        Assert.That(results.Count, Is.EqualTo(1));
        Assert.That(results[0].Message, Is.EqualTo("Old error"));
    }

    [Test]
    public async Task GetErrorLogsAsync_NoLogs_ReturnsEmptyList()
    {
        // Act
        var results = await _service.GetErrorLogsAsync();

        // Assert
        Assert.That(results, Is.Empty);
    }

    #endregion

    #region CleanupOldLogsAsync Tests

    [Test]
    public async Task CleanupOldLogsAsync_RemovesOldLogs()
    {
        // Arrange
        var oldLog = new ErrorLog
        {
            Message = "Old error",
            Source = "Test",
            Level = "Error",
            CreatedAt = DateTime.UtcNow.AddDays(-60)
        };
        _context.ErrorLogs.Add(oldLog);
        await _context.SaveChangesAsync();

        await _service.LogErrorAsync("New error");

        // Act
        await _service.CleanupOldLogsAsync(daysToKeep: 30);

        // Assert
        var remainingLogs = await _context.ErrorLogs.ToListAsync();
        Assert.That(remainingLogs.Count, Is.EqualTo(1));
        Assert.That(remainingLogs[0].Message, Is.EqualTo("New error"));
    }

    [Test]
    public async Task CleanupOldLogsAsync_KeepsRecentLogs()
    {
        // Arrange
        await _service.LogErrorAsync("Recent error 1");
        await _service.LogErrorAsync("Recent error 2");

        // Act
        await _service.CleanupOldLogsAsync(daysToKeep: 30);

        // Assert
        var remainingLogs = await _context.ErrorLogs.ToListAsync();
        Assert.That(remainingLogs.Count, Is.EqualTo(2));
    }

    [Test]
    public async Task CleanupOldLogsAsync_LogsCleanupCount()
    {
        // Arrange
        var oldLog = new ErrorLog
        {
            Message = "Old error",
            Source = "Test",
            Level = "Error",
            CreatedAt = DateTime.UtcNow.AddDays(-60)
        };
        _context.ErrorLogs.Add(oldLog);
        await _context.SaveChangesAsync();

        // Act
        await _service.CleanupOldLogsAsync(daysToKeep: 30);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Cleaned up")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task CleanupOldLogsAsync_NoOldLogs_DoesNotFail()
    {
        // Act & Assert - should not throw
        await _service.CleanupOldLogsAsync(daysToKeep: 30);
    }

    [Test]
    public async Task CleanupOldLogsAsync_CustomDaysToKeep_UsesCorrectCutoff()
    {
        // Arrange
        var log5DaysOld = new ErrorLog
        {
            Message = "5 days old",
            Source = "Test",
            Level = "Error",
            CreatedAt = DateTime.UtcNow.AddDays(-5)
        };
        var log15DaysOld = new ErrorLog
        {
            Message = "15 days old",
            Source = "Test",
            Level = "Error",
            CreatedAt = DateTime.UtcNow.AddDays(-15)
        };
        _context.ErrorLogs.AddRange(log5DaysOld, log15DaysOld);
        await _context.SaveChangesAsync();

        // Act
        await _service.CleanupOldLogsAsync(daysToKeep: 10);

        // Assert
        var remainingLogs = await _context.ErrorLogs.ToListAsync();
        Assert.That(remainingLogs.Count, Is.EqualTo(1));
        Assert.That(remainingLogs[0].Message, Is.EqualTo("5 days old"));
    }

    #endregion

    #region Edge Cases

    [Test]
    public async Task LogErrorAsync_MultipleErrors_AllSavedCorrectly()
    {
        // Act
        for (int i = 0; i < 10; i++)
        {
            await _service.LogErrorAsync($"Error {i}");
        }

        // Assert
        var count = await _context.ErrorLogs.CountAsync();
        Assert.That(count, Is.EqualTo(10));
    }

    [Test]
    public async Task LogErrorAsync_EmptyMessage_SavesSuccessfully()
    {
        // Act
        await _service.LogErrorAsync("");

        // Assert
        var savedError = await _context.ErrorLogs.FirstOrDefaultAsync();
        Assert.That(savedError, Is.Not.Null);
        Assert.That(savedError!.Message, Is.EqualTo(""));
    }

    [Test]
    public async Task LogErrorAsync_DifferentLevels_AllSavedCorrectly()
    {
        // Arrange
        var levels = new[] { "Error", "Warning", "Critical", "Info", "Debug" };

        // Act
        foreach (var level in levels)
        {
            await _service.LogErrorAsync($"{level} message", level: level);
        }

        // Assert
        var count = await _context.ErrorLogs.CountAsync();
        Assert.That(count, Is.EqualTo(5));
    }

    #endregion

    #region Helper Methods

    private async Task CreateTestErrorLogs(int count = 5)
    {
        for (int i = 0; i < count; i++)
        {
            var error = new ErrorLog
            {
                Message = $"Test error {i}",
                Source = "Test",
                Level = "Error",
                CreatedAt = DateTime.UtcNow.AddMinutes(-i)
            };
            _context.ErrorLogs.Add(error);
        }
        await _context.SaveChangesAsync();
    }

    #endregion
}
