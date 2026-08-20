using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Tests.TestUtilities;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;

namespace GatherGrove.Infrastructure.Tests.Repositories;

[TestFixture]
public class ScheduledReportRepositoryTests : RepositoryTestBase
{
    private ScheduledReportRepository _repository = null!;
    private Club _testClub = null!;

    [SetUp]
    public void SetUp()
    {
        CreateContext();
        _repository = new ScheduledReportRepository(Context, NullLogger<ScheduledReportRepository>.Instance);

        _testClub = new Club
        {
            Id = 1,
            Name = "Test Club",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Clubs.Add(_testClub);
        Context.SaveChanges();
    }

    #region CreateScheduledReportAsync Tests

    [Test]
    public async Task CreateScheduledReportAsync_ValidReport_CreatesAndReturnsId()
    {
        // Arrange
        var report = new ScheduledReport
        {
            Id = Guid.NewGuid().ToString(),
            ClubId = _testClub.Id,
            ReportName = "Weekly Membership Report",
            ReportType = "MembershipSummary",
            Frequency = ReportFrequency.Weekly,
            IsActive = true,
            NextRunDate = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        var result = await _repository.CreateScheduledReportAsync(report);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.EqualTo(report.Id));
    }

    [Test]
    public async Task CreateScheduledReportAsync_SavesInDatabase()
    {
        // Arrange
        var reportId = Guid.NewGuid().ToString();
        var report = new ScheduledReport
        {
            Id = reportId,
            ClubId = _testClub.Id,
            ReportName = "Monthly Financial Report",
            ReportType = "FinancialSummary",
            Frequency = ReportFrequency.Monthly,
            IsActive = true,
            NextRunDate = DateTime.UtcNow.AddMonths(1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        await _repository.CreateScheduledReportAsync(report);

        // Assert
        var saved = await _repository.GetScheduledReportByIdAsync(reportId);
        Assert.That(saved, Is.Not.Null);
        Assert.That(saved.ReportName, Is.EqualTo("Monthly Financial Report"));
    }

    #endregion

    #region GetScheduledReportsByClubIdAsync Tests

    [Test]
    public async Task GetScheduledReportsByClubIdAsync_MultipleReports_ReturnsAllForClub()
    {
        // Arrange
        var report1 = new ScheduledReport
        {
            Id = Guid.NewGuid().ToString(),
            ClubId = _testClub.Id,
            ReportName = "Report A",
            ReportType = "MembershipSummary",
            Frequency = ReportFrequency.Weekly,
            IsActive = true,
            NextRunDate = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var report2 = new ScheduledReport
        {
            Id = Guid.NewGuid().ToString(),
            ClubId = _testClub.Id,
            ReportName = "Report B",
            ReportType = "FinancialSummary",
            Frequency = ReportFrequency.Monthly,
            IsActive = true,
            NextRunDate = DateTime.UtcNow.AddMonths(1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ScheduledReports.AddRange(report1, report2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetScheduledReportsByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result[0].ReportName, Is.EqualTo("Report A")); // Ordered alphabetically
        Assert.That(result[1].ReportName, Is.EqualTo("Report B"));
    }

    [Test]
    public async Task GetScheduledReportsByClubIdAsync_NoReports_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetScheduledReportsByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region GetScheduledReportByIdAsync Tests

    [Test]
    public async Task GetScheduledReportByIdAsync_ExistingReport_ReturnsReport()
    {
        // Arrange
        var reportId = Guid.NewGuid().ToString();
        var report = new ScheduledReport
        {
            Id = reportId,
            ClubId = _testClub.Id,
            ReportName = "Test Report",
            ReportType = "Custom",
            Frequency = ReportFrequency.Daily,
            IsActive = true,
            NextRunDate = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ScheduledReports.Add(report);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetScheduledReportByIdAsync(reportId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ReportName, Is.EqualTo("Test Report"));
        Assert.That(result.Frequency, Is.EqualTo(ReportFrequency.Daily));
    }

    [Test]
    public async Task GetScheduledReportByIdAsync_NonExistentReport_ReturnsNull()
    {
        // Act
        var result = await _repository.GetScheduledReportByIdAsync("non-existent-id");

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region UpdateScheduledReportAsync Tests

    [Test]
    public async Task UpdateScheduledReportAsync_ExistingReport_UpdatesSuccessfully()
    {
        // Arrange
        var reportId = Guid.NewGuid().ToString();
        var report = new ScheduledReport
        {
            Id = reportId,
            ClubId = _testClub.Id,
            ReportName = "Original Name",
            ReportType = "Custom",
            Frequency = ReportFrequency.Weekly,
            IsActive = true,
            NextRunDate = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ScheduledReports.Add(report);
        await Context.SaveChangesAsync();

        report.ReportName = "Updated Name";
        report.Frequency = ReportFrequency.Monthly;

        // Act
        await _repository.UpdateScheduledReportAsync(report);

        // Assert
        var updated = await _repository.GetScheduledReportByIdAsync(reportId);
        Assert.That(updated, Is.Not.Null);
        Assert.That(updated.ReportName, Is.EqualTo("Updated Name"));
        Assert.That(updated.Frequency, Is.EqualTo(ReportFrequency.Monthly));
    }

    #endregion

    #region DeleteScheduledReportAsync Tests

    [Test]
    public async Task DeleteScheduledReportAsync_ExistingReport_DeletesAndReturnsTrue()
    {
        // Arrange
        var reportId = Guid.NewGuid().ToString();
        var report = new ScheduledReport
        {
            Id = reportId,
            ClubId = _testClub.Id,
            ReportName = "To Delete",
            ReportType = "Custom",
            Frequency = ReportFrequency.Weekly,
            IsActive = true,
            NextRunDate = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ScheduledReports.Add(report);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.DeleteScheduledReportAsync(reportId);

        // Assert
        Assert.That(result, Is.True);
        var deleted = await _repository.GetScheduledReportByIdAsync(reportId);
        Assert.That(deleted, Is.Null);
    }

    [Test]
    public async Task DeleteScheduledReportAsync_NonExistentReport_ReturnsFalse()
    {
        // Act
        var result = await _repository.DeleteScheduledReportAsync("non-existent-id");

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region GetDueScheduledReportsAsync Tests

    [Test]
    public async Task GetDueScheduledReportsAsync_DueReportsExist_ReturnsOnlyDue()
    {
        // Arrange
        var dueReport = new ScheduledReport
        {
            Id = Guid.NewGuid().ToString(),
            ClubId = _testClub.Id,
            ReportName = "Due Report",
            ReportType = "Custom",
            Frequency = ReportFrequency.Daily,
            IsActive = true,
            NextRunDate = DateTime.UtcNow.AddHours(-1), // Past due
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var futureReport = new ScheduledReport
        {
            Id = Guid.NewGuid().ToString(),
            ClubId = _testClub.Id,
            ReportName = "Future Report",
            ReportType = "Custom",
            Frequency = ReportFrequency.Weekly,
            IsActive = true,
            NextRunDate = DateTime.UtcNow.AddDays(7), // Not due yet
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ScheduledReports.AddRange(dueReport, futureReport);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetDueScheduledReportsAsync();

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].ReportName, Is.EqualTo("Due Report"));
    }

    [Test]
    public async Task GetDueScheduledReportsAsync_InactiveReports_ExcludesInactive()
    {
        // Arrange
        var inactiveReport = new ScheduledReport
        {
            Id = Guid.NewGuid().ToString(),
            ClubId = _testClub.Id,
            ReportName = "Inactive Report",
            ReportType = "Custom",
            Frequency = ReportFrequency.Daily,
            IsActive = false, // Inactive
            NextRunDate = DateTime.UtcNow.AddHours(-1), // Past due
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ScheduledReports.Add(inactiveReport);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetDueScheduledReportsAsync();

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetDueScheduledReportsAsync_NoDueReports_ReturnsEmpty()
    {
        // Arrange
        var futureReport = new ScheduledReport
        {
            Id = Guid.NewGuid().ToString(),
            ClubId = _testClub.Id,
            ReportName = "Future Report",
            ReportType = "Custom",
            Frequency = ReportFrequency.Weekly,
            IsActive = true,
            NextRunDate = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ScheduledReports.Add(futureReport);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetDueScheduledReportsAsync();

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region UpdateLastExecutionAsync Tests

    [Test]
    public async Task UpdateLastExecutionAsync_UpdatesDatesCorrectly()
    {
        // Arrange
        var reportId = Guid.NewGuid().ToString();
        var originalNextRun = DateTime.UtcNow.AddDays(7);
        var report = new ScheduledReport
        {
            Id = reportId,
            ClubId = _testClub.Id,
            ReportName = "Test Report",
            ReportType = "Custom",
            Frequency = ReportFrequency.Weekly,
            IsActive = true,
            NextRunDate = originalNextRun,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.ScheduledReports.Add(report);
        await Context.SaveChangesAsync();

        var lastExecuted = DateTime.UtcNow;
        var newNextRun = DateTime.UtcNow.AddDays(14);

        // Act
        await _repository.UpdateLastExecutionAsync(reportId, lastExecuted, newNextRun);

        // Assert
        var updated = await _repository.GetScheduledReportByIdAsync(reportId);
        Assert.That(updated, Is.Not.Null);
        Assert.That(updated.LastExecuted, Is.EqualTo(lastExecuted).Within(TimeSpan.FromSeconds(1)));
        Assert.That(updated.NextRunDate, Is.EqualTo(newNextRun).Within(TimeSpan.FromSeconds(1)));
    }

    #endregion
}
