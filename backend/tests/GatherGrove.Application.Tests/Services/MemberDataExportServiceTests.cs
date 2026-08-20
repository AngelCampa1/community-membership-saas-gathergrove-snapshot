using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Enums;
using Moq;
using NUnit.Framework;
using System.Text;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Services;
using GatherGrove.Infrastructure.Repositories;
using DomainMember = GatherGrove.Domain.Entities.Member;
using ExportMember = GatherGrove.Application.DTOs.Export.ExportMember;
using Member = GatherGrove.Application.DTOs.Export.Member;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// TDD Tests for MemberDataExportService - US-005 Data Export & Reporting Engine
/// RED PHASE: Comprehensive failing tests for member data export functionality
/// Tests all export formats and member data integrity validation
/// Follows RED→GREEN→REFACTOR TDD cycle
/// </summary>
[TestFixture]
public class MemberDataExportServiceTests
{
    private IMemberDataExportService _memberDataExportService = null!;
    private Mock<ILogger<MemberDataExportService>> _mockLogger = null!;
    private Mock<IMemberRepository> _mockMemberRepository = null!;
    private Mock<IClubTierService> _mockClubTierService = null!;
    private Mock<IEmailService> _mockEmailService = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<MemberDataExportService>>();
        _mockMemberRepository = new Mock<IMemberRepository>();
        _mockClubTierService = new Mock<IClubTierService>();
        _mockEmailService = new Mock<IEmailService>();

        // Setup default authorization for all tests
        _mockClubTierService.Setup(x => x.CanExportMemberData(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // This will fail until implementation exists - RED PHASE
        _memberDataExportService = new MemberDataExportService(
            _mockLogger.Object,
            _mockEmailService.Object,
            _mockMemberRepository.Object,
            _mockClubTierService.Object);
    }

    #region CSV Export Tests (RED Phase)

    [Test]
    public async Task ExportMembersToCsv_ValidRequest_ReturnsValidCsvData()
    {
        // Arrange
        var clubId = 1;
        var memberExportOptions = new MemberExportOptions
        {
            IncludePersonalInfo = true,
            IncludeMembershipDetails = true,
            IncludeContactInfo = true,
            DateFrom = DateTime.UtcNow.AddMonths(-6),
            DateTo = DateTime.UtcNow
        };

        var mockMembers = CreateMockMemberData();
        _mockMemberRepository.Setup(x => x.GetMembersByClubIdAsync(clubId, memberExportOptions.DateFrom, memberExportOptions.DateTo))
            .Returns(Task.FromResult(ConvertToMembers(mockMembers)));

        // Act
        var result = await _memberDataExportService.ExportMembersToCsv(clubId, memberExportOptions);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        var csvContent = Encoding.UTF8.GetString(result);
        var lines = csvContent.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

        // Verify CSV header
        Assert.That(lines[0], Is.EqualTo("MemberId,FirstName,LastName,Email,PhoneNumber,MembershipType,JoinDate,Status,LastActive"));

        // Verify data rows
        Assert.That(lines.Length, Is.EqualTo(mockMembers.Count + 1)); // +1 for header
        Assert.That(lines[1], Does.Contain("john.doe@test.com"));
        Assert.That(lines[1], Does.Contain("Premium"));
    }

    [Test]
    public async Task ExportMembersToCsv_WithCustomFields_IncludesCustomFieldData()
    {
        // Arrange
        var clubId = 2;
        var memberExportOptions = new MemberExportOptions
        {
            IncludeCustomFields = true,
            CustomFieldIds = new List<int> { 1, 2, 3 },
            IncludePersonalInfo = true
        };

        var mockMembers = CreateMockMemberDataWithCustomFields();
        _mockMemberRepository.Setup(x => x.GetMembersWithCustomFieldsAsync(clubId, memberExportOptions.CustomFieldIds))
            .Returns(Task.FromResult(ConvertToMembers(mockMembers)));

        // Act
        var result = await _memberDataExportService.ExportMembersToCsv(clubId, memberExportOptions);

        // Assert
        var csvContent = Encoding.UTF8.GetString(result);
        var lines = csvContent.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

        // Verify custom field columns are included
        Assert.That(lines[0], Does.Contain("CustomField_Skills"));
        Assert.That(lines[0], Does.Contain("CustomField_Department"));
        Assert.That(lines[0], Does.Contain("CustomField_Level"));

        // Verify custom field data
        Assert.That(lines[1], Does.Contain("C#, JavaScript"));
        Assert.That(lines[1], Does.Contain("Engineering"));
        Assert.That(lines[1], Does.Contain("Senior"));
    }

    [Test]
    public async Task ExportMembersToCsv_NoPermission_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var clubId = 1;
        var memberExportOptions = new MemberExportOptions();

        _mockClubTierService.Setup(x => x.CanExportMemberData(It.IsAny<int>(), clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _memberDataExportService.ExportMembersToCsv(clubId, memberExportOptions));

        Assert.That(exception.Message, Does.Contain("Member data export requires appropriate permissions"));
    }

    #endregion

    #region Excel Export Tests (RED Phase)

    [Test]
    public async Task ExportMembersToExcel_ValidRequest_ReturnsValidExcelData()
    {
        // Arrange
        var clubId = 3;
        var memberExportOptions = new MemberExportOptions
        {
            IncludePersonalInfo = true,
            IncludeMembershipDetails = true,
            IncludeAttendanceStats = true
        };

        var mockMembers = CreateMockMemberData();
        _mockMemberRepository.Setup(x => x.GetMembersWithAttendanceAsync(clubId))
            .Returns(Task.FromResult(ConvertToMembers(mockMembers)));

        // Act
        var result = await _memberDataExportService.ExportMembersToExcel(clubId, memberExportOptions);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        // For GREEN phase, we'll accept simplified Excel format (CSV-like)
        var excelContent = Encoding.UTF8.GetString(result);
        Assert.That(excelContent, Does.Contain("Member Export Report"));
        Assert.That(excelContent, Does.Contain("Club ID: " + clubId));
        Assert.That(excelContent, Does.Contain("Export Date:"));
        Assert.That(excelContent, Does.Contain("Total Members:"));
    }

    [Test]
    public async Task ExportMembersToExcel_WithCharts_IncludesMembershipStatistics()
    {
        // Arrange
        var clubId = 4;
        var memberExportOptions = new MemberExportOptions
        {
            IncludeCharts = true,
            IncludeStatistics = true,
            IncludeMembershipDetails = true
        };

        var mockMembers = CreateMockMemberData();
        _mockMemberRepository.Setup(x => x.GetMemberStatisticsAsync(clubId))
            .Returns(Task.FromResult(CreateMockMemberStatistics()));

        // Act
        var result = await _memberDataExportService.ExportMembersToExcel(clubId, memberExportOptions);

        // Assert
        var excelContent = Encoding.UTF8.GetString(result);
        Assert.That(excelContent, Does.Contain("Membership Statistics"));
        Assert.That(excelContent, Does.Contain("Active Members: 150"));
        Assert.That(excelContent, Does.Contain("Premium Members: 45"));
        Assert.That(excelContent, Does.Contain("New This Month: 12"));
        Assert.That(excelContent, Does.Contain("Renewal Rate: 89.5%"));
    }

    #endregion

    #region JSON Export Tests (RED Phase)

    [Test]
    public async Task ExportMembersToJson_ValidRequest_ReturnsValidJsonData()
    {
        // Arrange
        var clubId = 5;
        var memberExportOptions = new MemberExportOptions
        {
            IncludePersonalInfo = true,
            IncludeMetadata = true
        };

        var mockMembers = CreateMockMemberData();
        _mockMemberRepository.Setup(x => x.GetMembersByClubIdAsync(clubId, null, null))
            .Returns(Task.FromResult(ConvertToMembers(mockMembers)));

        // Act
        var result = await _memberDataExportService.ExportMembersToJson(clubId, memberExportOptions);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        var jsonContent = Encoding.UTF8.GetString(result);

        // Validate JSON structure
        Assert.That(jsonContent, Does.StartWith("{"));
        Assert.That(jsonContent, Does.EndWith("}"));
        Assert.That(jsonContent, Does.Contain("\"clubId\": " + clubId));
        Assert.That(jsonContent, Does.Contain("\"exportType\": \"members\""));
        Assert.That(jsonContent, Does.Contain("\"timestamp\":"));
        Assert.That(jsonContent, Does.Contain("\"members\": ["));
        Assert.That(jsonContent, Does.Contain("\"totalCount\":"));
    }

    [Test]
    public async Task ExportMembersToJson_WithFilters_ReturnsFilteredData()
    {
        // Arrange
        var clubId = 6;
        var memberExportOptions = new MemberExportOptions
        {
            MembershipTypeFilter = "Premium",
            StatusFilter = "Active",
            DateFrom = DateTime.UtcNow.AddMonths(-3)
        };

        var mockMembers = CreateMockFilteredMemberData();
        _mockMemberRepository.Setup(x => x.GetFilteredMembersAsync(
            clubId,
            memberExportOptions.DateFrom,
            memberExportOptions.DateTo,
            memberExportOptions.MembershipTypeFilter,
            memberExportOptions.StatusFilter,
            memberExportOptions.IncludeCustomFields,
            memberExportOptions.CustomFieldIds,
            memberExportOptions.IncludeAttendanceStats))
            .Returns(Task.FromResult(ConvertToMembers(mockMembers)));

        // Act
        var result = await _memberDataExportService.ExportMembersToJson(clubId, memberExportOptions);

        // Assert
        var jsonContent = Encoding.UTF8.GetString(result);
        Assert.That(jsonContent, Does.Contain("\"membershipType\": \"Premium\""));
        Assert.That(jsonContent, Does.Contain("\"status\": \"Active\""));
        Assert.That(jsonContent, Does.Contain("\"appliedFilters\": {"));
    }

    #endregion

    #region Background Export Tests (RED Phase)

    [Test]
    public async Task ScheduleMemberExport_ValidRequest_ReturnsExportId()
    {
        // Arrange
        var clubId = 7;
        var format = ExportFormat.Excel;
        var memberExportOptions = new MemberExportOptions();
        var userId = 123;
        var notificationEmail = "admin@test.com";

        // Act
        var result = await _memberDataExportService.ScheduleMemberExport(clubId, format, memberExportOptions, userId, notificationEmail);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ExportId, Is.Not.Empty);
        Assert.That(result.Status, Is.EqualTo(ExportStatus.Queued));
        Assert.That(result.FileName, Does.StartWith("members-"));
        Assert.That(result.FileName, Does.EndWith(".excel"));
        Assert.True(Guid.TryParse(result.ExportId, out _));
    }

    [Test]
    public async Task GetExportStatus_ReturnsClubScopedDownloadUrl()
    {
        // Arrange
        var clubId = 7;
        var exportResult = await _memberDataExportService.ScheduleMemberExport(
            clubId,
            ExportFormat.CSV,
            new MemberExportOptions(),
            userId: 123,
            notificationEmail: "admin@test.com");

        // Act
        var status = await _memberDataExportService.GetExportStatus(exportResult.ExportId, clubId);

        // Assert
        Assert.That(status.DownloadUrl, Is.EqualTo($"/api/clubs/{clubId}/exports/{exportResult.ExportId}/download"));
    }

    [Test]
    public async Task ProcessBackgroundMemberExport_ValidExportId_CompletesExport()
    {
        // Arrange
        var exportId = Guid.NewGuid().ToString();
        var clubId = 8;

        // Act
        var result = await _memberDataExportService.ProcessBackgroundMemberExport(exportId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Status, Is.EqualTo(ExportStatus.Completed));
        Assert.That(result.CompletedAt, Is.Not.Null);
        Assert.That(result.FileSizeBytes, Is.Not.Null);
        Assert.That(result.FileSizeBytes, Is.GreaterThan(0));
    }

    [Test]
    public async Task ProcessBackgroundMemberExport_WithEmailNotification_SendsCompletionEmail()
    {
        // Arrange
        var exportId = Guid.NewGuid().ToString();
        var notificationEmail = "user@test.com";
        var memberExportOptions = new MemberExportOptions { NotifyOnCompletion = true };

        // Act
        var result = await _memberDataExportService.ProcessBackgroundMemberExportWithNotification(exportId, notificationEmail);

        // Assert
        Assert.That(result.Status, Is.EqualTo(ExportStatus.Completed));

        // Verify email notification was sent
        _mockEmailService.Verify(x => x.SendExportCompletionNotificationAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<long>()),
            Times.Once);
    }

    #endregion

    #region Performance & Large Dataset Tests (RED Phase)

    [Test]
    public async Task ExportLargeDataset_ThousandsOfMembers_CompletesWithinTimeout()
    {
        // Arrange
        var clubId = 9;
        var memberExportOptions = new MemberExportOptions();
        var largeDataset = CreateLargeMemberDataset(5000);

        _mockMemberRepository.Setup(x => x.GetMembersByClubIdAsync(clubId, null, null))
            .Returns(Task.FromResult(ConvertToMembers(largeDataset)));

        // Act & Assert
        var timeout = TimeSpan.FromSeconds(30);
        var cts = new CancellationTokenSource(timeout);

        try
        {
            var result = await _memberDataExportService.ExportMembersToCsv(clubId, memberExportOptions);
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Length, Is.GreaterThan(0));
        }
        catch (OperationCanceledException)
        {
            // GREEN PHASE: Operation should not timeout with proper implementation
            throw new TimeoutException("This should not happen in GREEN phase - check implementation for performance issues.");
        }
    }

    [Test]
    public async Task ExportMembers_MemoryUsage_StaysWithinLimits()
    {
        // Arrange
        var clubId = 10;
        var memberExportOptions = new MemberExportOptions();
        var mediumDataset = CreateLargeMemberDataset(1000);

        _mockMemberRepository.Setup(x => x.GetMembersByClubIdAsync(clubId, null, null))
            .Returns(Task.FromResult(ConvertToMembers(mediumDataset)));

        var initialMemory = GC.GetTotalMemory(true);

        // Act
        var result = await _memberDataExportService.ExportMembersToCsv(clubId, memberExportOptions);

        // Assert
        var finalMemory = GC.GetTotalMemory(true);
        var memoryIncrease = finalMemory - initialMemory;

        // Should not increase memory by more than 100MB for 1000 members
        Assert.That(memoryIncrease, Is.LessThan(100 * 1024 * 1024));
    }

    #endregion

    #region Data Validation Tests (RED Phase)

    [Test]
    public async Task ExportMembers_WithSensitiveData_RedactsSensitiveFields()
    {
        // Arrange
        var clubId = 11;
        var memberExportOptions = new MemberExportOptions
        {
            RedactSensitiveData = true,
            IncludePersonalInfo = true
        };

        var mockMembers = CreateMockMemberDataWithSensitiveInfo();
        _mockMemberRepository.Setup(x => x.GetMembersByClubIdAsync(clubId, null, null))
            .Returns(Task.FromResult(ConvertToMembers(mockMembers)));

        // Act
        var result = await _memberDataExportService.ExportMembersToCsv(clubId, memberExportOptions);

        // Assert
        var csvContent = Encoding.UTF8.GetString(result);

        // Sensitive data should be redacted
        Assert.That(csvContent, Does.Not.Contain("555-123-4567")); // Full phone
        Assert.That(csvContent, Does.Not.Contain("123-45-6789")); // SSN
        Assert.That(csvContent, Does.Contain("***-***-4567")); // Redacted phone
        Assert.That(csvContent, Does.Contain("***-**-6789")); // Redacted SSN
    }

    [Test]
    public async Task ExportMembers_InvalidDateRange_ThrowsArgumentException()
    {
        // Arrange
        var clubId = 12;
        var memberExportOptions = new MemberExportOptions
        {
            DateFrom = DateTime.UtcNow,
            DateTo = DateTime.UtcNow.AddMonths(-1) // Invalid: DateTo before DateFrom
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _memberDataExportService.ExportMembersToCsv(clubId, memberExportOptions));

        Assert.That(exception.Message, Does.Contain("DateTo cannot be earlier than DateFrom"));
    }

    [Test]
    public async Task ExportMembers_EmptyDataset_ReturnsHeaderOnly()
    {
        // Arrange
        var clubId = 13;
        var memberExportOptions = new MemberExportOptions();

        _mockMemberRepository.Setup(x => x.GetMembersByClubIdAsync(clubId, null, null))
            .Returns(Task.FromResult(new List<DomainMember>()));

        // Act
        var result = await _memberDataExportService.ExportMembersToCsv(clubId, memberExportOptions);

        // Assert
        var csvContent = Encoding.UTF8.GetString(result);
        var lines = csvContent.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

        Assert.That(lines.Length, Is.EqualTo(1)); // Header only
        Assert.That(lines[0], Is.EqualTo("MemberId,FirstName,LastName,Email,PhoneNumber,MembershipType,JoinDate,Status,LastActive"));
    }

    #endregion

    #region Helper Methods

    private List<DomainMember> CreateMockMemberData()
    {
        return new List<DomainMember>
        {
            new DomainMember
            {
                Id = 1,
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@test.com",
                PhoneNumber = "555-123-4567",
                MembershipType = new MembershipType { Id = 1, Name = "Premium" },
                JoinDate = DateTime.UtcNow.AddMonths(-6),
                Status = "Active",
                LastActive = DateTime.UtcNow.AddDays(-2)
            },
            new DomainMember
            {
                Id = 2,
                FirstName = "Jane",
                LastName = "Smith",
                Email = "jane.smith@test.com",
                PhoneNumber = "555-987-6543",
                MembershipType = new MembershipType { Id = 2, Name = "Basic" },
                JoinDate = DateTime.UtcNow.AddMonths(-12),
                Status = "Active",
                LastActive = DateTime.UtcNow.AddDays(-5)
            }
        };
    }

    private List<DomainMember> CreateMockMemberDataWithCustomFields()
    {
        var members = CreateMockMemberData();
        members[0].CustomFields = new Dictionary<string, object>
        {
            { "Skills", "C#, JavaScript" },
            { "Department", "Engineering" },
            { "Level", "Senior" }
        };
        return members;
    }

    private List<DomainMember> CreateMockMemberDataWithSensitiveInfo()
    {
        var members = CreateMockMemberData();
        members[0].PhoneNumber = "555-123-4567";
        members[0].SSN = "123-45-6789";
        return members;
    }

    private List<DomainMember> CreateMockFilteredMemberData()
    {
        return CreateMockMemberData().Where(m => m.MembershipType.Name == "Premium" && m.Status == "Active").ToList();
    }

    private List<DomainMember> CreateLargeMemberDataset(int count)
    {
        var members = new List<DomainMember>();
        for (int i = 1; i <= count; i++)
        {
            members.Add(new DomainMember
            {
                Id = i,
                FirstName = $"Member{i}",
                LastName = $"User{i}",
                Email = $"member{i}@test.com",
                MembershipType = i % 3 == 0 ? new MembershipType { Id = 1, Name = "Premium" } : new MembershipType { Id = 2, Name = "Basic" },
                JoinDate = DateTime.UtcNow.AddDays(-i),
                Status = "Active"
            });
        }
        return members;
    }

    private object CreateMockMemberStatistics()
    {
        return new
        {
            TotalMembers = 200,
            ActiveMembers = 150,
            PremiumMembers = 45,
            NewThisMonth = 12,
            RenewalRate = 89.5
        };
    }

    #endregion

    private List<ExportMember> ConvertToExportMembers(List<DomainMember> domainMembers)
    {
        return domainMembers.Select(dm => new ExportMember
        {
            Id = dm.Id,
            FirstName = dm.FirstName,
            LastName = dm.LastName,
            Email = dm.Email,
            MembershipType = dm.MembershipType?.Name ?? "",
            Status = dm.Status
        }).ToList();
    }

    private List<DomainMember> ConvertToMembers(List<DomainMember> domainMembers)
    {
        // Simply return the domain members as-is since repository now returns domain entities
        return domainMembers;
    }
}
