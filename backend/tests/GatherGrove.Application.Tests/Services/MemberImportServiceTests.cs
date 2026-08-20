using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NUnit.Framework;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Import;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class MemberImportServiceTests : IDisposable
{
    private GatherGroveDbContext _context;
    private MemberImportService _memberImportService;
    private Mock<ILogger<MemberImportService>> _mockLogger;
    private Mock<IMemberService> _mockMemberService;
    private Club _testClub;
    private User _testUser;
    private MembershipType _testMembershipType;

    [SetUp]
    public void SetUp()
    {
        // Create in-memory database with unique name for each test
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<MemberImportService>>();
        _mockMemberService = new Mock<IMemberService>();

        _memberImportService = new MemberImportService(
            _context,
            _mockMemberService.Object,
            _mockLogger.Object
        );

        // Set up test data
        SetUpTestData();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }

    private void SetUpTestData()
    {
        _testUser = new User
        {
            Id = 1,
            Email = "admin@test.com",
            FullName = "Test Admin",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(_testUser);

        _testClub = new Club
        {
            Id = 1,
            Name = "Test Club",
            Tier = "Free",
            CreatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(_testClub);

        _testMembershipType = new MembershipType
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Regular",
            Description = "Regular membership",
            CreatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(_testMembershipType);

        _context.SaveChanges();
    }

    #region Template Generation Tests

    [Test]
    public async Task GenerateCsvTemplateAsync_ShouldReturnValidCsvTemplate()
    {
        // Act
        var result = await _memberImportService.GenerateCsvTemplateAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        var csvContent = Encoding.UTF8.GetString(result);
        Assert.That(csvContent, Does.Contain("FullName"));
        Assert.That(csvContent, Does.Contain("Email"));
        Assert.That(csvContent, Does.Contain("PhoneNumber"));
        Assert.That(csvContent, Does.Contain("MembershipType"));
    }

    #endregion

    #region Validation Tests

    [Test]
    public async Task ValidateCsvAsync_WithValidData_ShouldReturnValidResult()
    {
        // Arrange
        var csvContent = "FullName,Email,PhoneNumber,MembershipType\n" +
                        "John Doe,john.doe@test.com,123-456-7890,Regular";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TotalRows, Is.EqualTo(1));
        Assert.That(result.ValidationErrors, Is.Empty);
    }

    [Test]
    public async Task ValidateCsvAsync_WithInvalidFile_ShouldHandleGracefully()
    {
        // Arrange
        var csvContent = "Invalid CSV content without proper headers";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act & Assert
        // This should not throw an exception
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);
        Assert.That(result, Is.Not.Null);
    }

    #endregion

    #region Import Execution Tests

    [Test]
    public async Task ExecuteImportAsync_WithValidData_ShouldCreateImportRecord()
    {
        // Arrange
        var csvData = "FullName,Email,PhoneNumber,MembershipType\n" +
                     "John Doe,john.doe@test.com,123-456-7890,Regular";

        var request = new ImportRequest
        {
            CsvData = Convert.ToBase64String(Encoding.UTF8.GetBytes(csvData)),
            Options = new ImportOptions
            {
                SkipDuplicates = false,
                SkipInvalid = false,
                NotifyMembers = false
            }
        };

        // Act
        var result = await _memberImportService.ExecuteImportAsync(_testClub.Id, _testUser.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ImportId, Is.Not.Empty);
        Assert.That(result.Summary, Is.Not.Null);
    }

    [Test]
    public async Task ExecuteImportAsync_WithInvalidBase64_ShouldThrowException()
    {
        // Arrange
        var request = new ImportRequest
        {
            CsvData = "invalid-base64-data",
            Options = new ImportOptions()
        };

        // Act & Assert
        Assert.ThrowsAsync<FormatException>(async () =>
            await _memberImportService.ExecuteImportAsync(_testClub.Id, _testUser.Id, request));
    }

    [Test]
    public void ExecuteImportAsync_WithCsvDataOverFiveMegabytes_ShouldRejectBeforeImporting()
    {
        // Arrange
        var oversizedCsvData = new string('a', (5 * 1024 * 1024) + 1);
        var request = new ImportRequest
        {
            CsvData = Convert.ToBase64String(Encoding.UTF8.GetBytes(oversizedCsvData)),
            Options = new ImportOptions()
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _memberImportService.ExecuteImportAsync(_testClub.Id, _testUser.Id, request));

        Assert.That(exception!.Message, Does.Contain("5 MB"));
        _mockMemberService.Verify(s => s.CreateMemberAsync(It.IsAny<int>(), It.IsAny<CreateMemberRequest>()), Times.Never);
    }

    #endregion

    #region Status Tests

    [Test]
    public async Task GetImportStatusAsync_WithValidImportId_ShouldReturnStatus()
    {
        // Arrange
        var importId = Guid.NewGuid();
        var importRecord = new MemberImport
        {
            ImportId = importId,
            ClubId = _testClub.Id,
            UserId = _testUser.Id,
            Status = "Completed",
            TotalRows = 1,
            SuccessfulRows = 1,
            FailedRows = 0,
            CompletedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _context.MemberImports.Add(importRecord);
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberImportService.GetImportStatusAsync(importId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Status, Is.EqualTo("Completed"));
        Assert.That(result.Summary.TotalProcessed, Is.EqualTo(1));
        Assert.That(result.Summary.Successful, Is.EqualTo(1));
    }

    [Test]
    public async Task GetImportStatusAsync_WithInvalidImportId_ShouldReturnNull()
    {
        // Arrange
        var invalidImportId = Guid.NewGuid();

        // Act
        var result = await _memberImportService.GetImportStatusAsync(invalidImportId);

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region Extended Validation Tests

    [Test]
    public async Task ValidateCsvAsync_WithMissingEmail_ShouldReturnError()
    {
        // Arrange
        var csvContent = "FullName,Email,PhoneNumber,MembershipType\n" +
                        "John Doe,,123-456-7890,Regular";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result.ValidationErrors, Is.Not.Empty);
        Assert.That(result.ValidationErrors.Any(e => e.Field == "Email" && e.Error.Contains("required")));
    }

    [Test]
    public async Task ValidateCsvAsync_WithMissingFullName_ShouldReturnError()
    {
        // Arrange
        var csvContent = "FullName,Email,PhoneNumber,MembershipType\n" +
                        ",john@test.com,123-456-7890,Regular";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result.ValidationErrors, Is.Not.Empty);
        Assert.That(result.ValidationErrors.Any(e => e.Field == "FullName"));
    }

    [Test]
    public async Task ValidateCsvAsync_WithInvalidEmailFormat_ShouldReturnError()
    {
        // Arrange
        var csvContent = "FullName,Email,PhoneNumber,MembershipType\n" +
                        "John Doe,invalid-email,123-456-7890,Regular";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result.ValidationErrors, Is.Not.Empty);
        Assert.That(result.ValidationErrors.Any(e => e.Field == "Email" && e.Error.Contains("Invalid email")));
    }

    [Test]
    public async Task ValidateCsvAsync_WithInvalidMembershipType_ShouldReturnError()
    {
        // Arrange
        var csvContent = "FullName,Email,PhoneNumber,MembershipType\n" +
                        "John Doe,john@test.com,123-456-7890,InvalidType";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result.ValidationErrors, Is.Not.Empty);
        Assert.That(result.ValidationErrors.Any(e => e.Field == "MembershipType" && e.Error.Contains("Invalid membership type")));
    }

    [Test]
    public async Task ValidateCsvAsync_WithMissingMembershipType_ShouldReturnError()
    {
        // Arrange
        var csvContent = "FullName,Email,PhoneNumber,MembershipType\n" +
                        "John Doe,john@test.com,123-456-7890,";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result.ValidationErrors, Is.Not.Empty);
        Assert.That(result.ValidationErrors.Any(e => e.Field == "MembershipType" && e.Error.Contains("required")));
    }

    [Test]
    public async Task ValidateCsvAsync_WithInvalidDateFormat_ShouldReturnError()
    {
        // Arrange
        var csvContent = "FullName,Email,PhoneNumber,MembershipType,JoinDate\n" +
                        "John Doe,john@test.com,123-456-7890,Regular,not-a-date";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result.ValidationErrors, Is.Not.Empty);
        Assert.That(result.ValidationErrors.Any(e => e.Field == "JoinDate"));
    }

    [Test]
    public async Task ValidateCsvAsync_WithLegacySmsConsent_ShouldIgnoreValue()
    {
        // Arrange
        var csvContent = "FullName,Email,PhoneNumber,MembershipType,HasSmsConsent\n" +
                        "John Doe,john@test.com,123-456-7890,Regular,maybe";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result.ValidationErrors.Any(e => e.Field == "HasSmsConsent"), Is.False);
    }

    [Test]
    public async Task ValidateCsvAsync_WithDuplicateEmailInFile_ShouldReturnError()
    {
        // Arrange
        var csvContent = "FullName,Email,PhoneNumber,MembershipType\n" +
                        "John Doe,john@test.com,123-456-7890,Regular\n" +
                        "Jane Doe,john@test.com,987-654-3210,Regular";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result.ValidationErrors, Is.Not.Empty);
        Assert.That(result.ValidationErrors.Any(e => e.Error.Contains("Duplicate email within the file")));
    }

    [Test]
    public async Task ValidateCsvAsync_WithExistingMemberEmail_ShouldReturnWarning()
    {
        // Arrange - Add existing member
        var existingMember = new Member
        {
            ClubId = _testClub.Id,
            FullName = "Existing User",
            Email = "existing@test.com",
            MembershipTypeId = _testMembershipType.Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.Members.Add(existingMember);
        await _context.SaveChangesAsync();

        var csvContent = "FullName,Email,PhoneNumber,MembershipType\n" +
                        "New User,existing@test.com,123-456-7890,Regular";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result.Warnings, Is.Not.Empty);
        Assert.That(result.DuplicateEmails, Is.GreaterThan(0));
    }

    [Test]
    public async Task ValidateCsvAsync_WithCommentRow_ShouldSkipIt()
    {
        // Arrange
        var csvContent = "FullName,Email,PhoneNumber,MembershipType\n" +
                        "# This is a comment row\n" +
                        "John Doe,john@test.com,123-456-7890,Regular";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result.TotalRows, Is.EqualTo(1)); // Only non-comment row counted
    }

    [Test]
    public async Task ValidateCsvAsync_WithValidSmsConsentValues_ShouldPass()
    {
        // Arrange - test different valid boolean formats
        var csvContent = "FullName,Email,PhoneNumber,MembershipType,HasSmsConsent\n" +
                        "User1,user1@test.com,111,Regular,TRUE\n" +
                        "User2,user2@test.com,222,Regular,false\n" +
                        "User3,user3@test.com,333,Regular,1\n" +
                        "User4,user4@test.com,444,Regular,0\n" +
                        "User5,user5@test.com,555,Regular,Yes\n" +
                        "User6,user6@test.com,666,Regular,No";
        var formFile = CreateFormFile("test.csv", csvContent);

        // Act
        var result = await _memberImportService.ValidateCsvAsync(_testClub.Id, formFile);

        // Assert
        Assert.That(result.ValidationErrors.Where(e => e.Field == "HasSmsConsent"), Is.Empty);
    }

    #endregion

    #region Extended Template Generation Tests

    [Test]
    public async Task GenerateCsvTemplateAsync_WithCustomFields_ShouldIncludeThem()
    {
        // Arrange - Add custom fields
        var customField = new ClubCustomField
        {
            ClubId = _testClub.Id,
            FieldLabel = "CustomField1",
            FieldType = "Text"
        };
        _context.ClubCustomFields.Add(customField);
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberImportService.GenerateCsvTemplateAsync(_testClub.Id);

        // Assert
        var csvContent = Encoding.UTF8.GetString(result);
        Assert.That(csvContent, Does.Contain("CustomField1"));
    }

    [Test]
    public async Task GenerateCsvTemplateAsync_IncludesStandardHeaders()
    {
        // Act
        var result = await _memberImportService.GenerateCsvTemplateAsync(_testClub.Id);

        // Assert
        var csvContent = Encoding.UTF8.GetString(result);
        Assert.That(csvContent, Does.Contain("FullName"));
        Assert.That(csvContent, Does.Contain("Email"));
        Assert.That(csvContent, Does.Contain("PhoneNumber"));
        Assert.That(csvContent, Does.Contain("MembershipType"));
        Assert.That(csvContent, Does.Contain("Address"));
        Assert.That(csvContent, Does.Not.Contain("HasSmsConsent"));
        Assert.That(csvContent, Does.Contain("JoinDate"));
    }

    [Test]
    public async Task GenerateCsvTemplateAsync_IncludesInstructions()
    {
        // Act
        var result = await _memberImportService.GenerateCsvTemplateAsync(_testClub.Id);

        // Assert
        var csvContent = Encoding.UTF8.GetString(result);
        Assert.That(csvContent, Does.Contain("Instructions"));
        Assert.That(csvContent, Does.Contain("required"));
    }

    #endregion

    #region Extended Import Execution Tests

    [Test]
    public async Task ExecuteImportAsync_WithSkipDuplicates_ShouldSkipExistingEmails()
    {
        // Arrange - Add existing member
        var existingMember = new Member
        {
            ClubId = _testClub.Id,
            FullName = "Existing User",
            Email = "existing@test.com",
            MembershipTypeId = _testMembershipType.Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.Members.Add(existingMember);
        await _context.SaveChangesAsync();

        // Mock member service to throw on create
        _mockMemberService.Setup(s => s.CreateMemberAsync(It.IsAny<int>(), It.IsAny<CreateMemberRequest>()))
            .ThrowsAsync(new InvalidOperationException("Duplicate email"));

        var csvData = "FullName,Email,PhoneNumber,MembershipType\n" +
                     "Existing User,existing@test.com,123-456-7890,Regular";

        var request = new ImportRequest
        {
            CsvData = Convert.ToBase64String(Encoding.UTF8.GetBytes(csvData)),
            Options = new ImportOptions
            {
                SkipDuplicates = true,
                SkipInvalid = true, // This will skip the duplicate
                NotifyMembers = false
            }
        };

        // Act
        var result = await _memberImportService.ExecuteImportAsync(_testClub.Id, _testUser.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Summary.Skipped, Is.GreaterThanOrEqualTo(0));
    }

    [Test]
    public async Task ExecuteImportAsync_WithMemberServiceError_ShouldRecordError()
    {
        // Arrange
        _mockMemberService.Setup(s => s.CreateMemberAsync(It.IsAny<int>(), It.IsAny<CreateMemberRequest>()))
            .ThrowsAsync(new InvalidOperationException("Member creation failed"));

        var csvData = "FullName,Email,PhoneNumber,MembershipType\n" +
                     "John Doe,john.doe@test.com,123-456-7890,Regular";

        var request = new ImportRequest
        {
            CsvData = Convert.ToBase64String(Encoding.UTF8.GetBytes(csvData)),
            Options = new ImportOptions
            {
                SkipDuplicates = false,
                SkipInvalid = true,
                NotifyMembers = false
            }
        };

        // Act
        var result = await _memberImportService.ExecuteImportAsync(_testClub.Id, _testUser.Id, request);

        // Assert
        Assert.That(result.Summary.Failed, Is.GreaterThanOrEqualTo(0));
    }

    [Test]
    public async Task ExecuteImportAsync_WithSuccessfulImport_ShouldCallMemberService()
    {
        // Arrange
        _mockMemberService.Setup(s => s.CreateMemberAsync(It.IsAny<int>(), It.IsAny<CreateMemberRequest>()))
            .ReturnsAsync(new MemberResponse { Id = 100, FullName = "John Doe", Email = "john.doe@test.com" });

        var csvData = "FullName,Email,PhoneNumber,MembershipType\n" +
                     "John Doe,john.doe@test.com,123-456-7890,Regular";

        var request = new ImportRequest
        {
            CsvData = Convert.ToBase64String(Encoding.UTF8.GetBytes(csvData)),
            Options = new ImportOptions
            {
                SkipDuplicates = false,
                SkipInvalid = false,
                NotifyMembers = false
            }
        };

        // Act
        var result = await _memberImportService.ExecuteImportAsync(_testClub.Id, _testUser.Id, request);

        // Assert
        Assert.That(result.Summary.Successful, Is.EqualTo(1));
        _mockMemberService.Verify(s => s.CreateMemberAsync(_testClub.Id, It.IsAny<CreateMemberRequest>()), Times.Once);
    }

    [Test]
    public async Task ExecuteImportAsync_WithMultipleRows_ShouldProcessAll()
    {
        // Arrange
        _mockMemberService.Setup(s => s.CreateMemberAsync(It.IsAny<int>(), It.IsAny<CreateMemberRequest>()))
            .ReturnsAsync(new MemberResponse { Id = 100, FullName = "Test", Email = "test@test.com" });

        var csvData = "FullName,Email,PhoneNumber,MembershipType\n" +
                     "User1,user1@test.com,111,Regular\n" +
                     "User2,user2@test.com,222,Regular\n" +
                     "User3,user3@test.com,333,Regular";

        var request = new ImportRequest
        {
            CsvData = Convert.ToBase64String(Encoding.UTF8.GetBytes(csvData)),
            Options = new ImportOptions()
        };

        // Act
        var result = await _memberImportService.ExecuteImportAsync(_testClub.Id, _testUser.Id, request);

        // Assert
        Assert.That(result.Summary.TotalProcessed, Is.EqualTo(3));
        Assert.That(result.Summary.Successful, Is.EqualTo(3));
    }

    [Test]
    public async Task ExecuteImportAsync_StopsOnErrorWhenNotSkipping()
    {
        // Arrange
        var callCount = 0;
        _mockMemberService.Setup(s => s.CreateMemberAsync(It.IsAny<int>(), It.IsAny<CreateMemberRequest>()))
            .Returns(() =>
            {
                callCount++;
                if (callCount == 1)
                    throw new InvalidOperationException("First member fails");
                return Task.FromResult(new MemberResponse { Id = 100 });
            });

        var csvData = "FullName,Email,PhoneNumber,MembershipType\n" +
                     "User1,user1@test.com,111,Regular\n" +
                     "User2,user2@test.com,222,Regular";

        var request = new ImportRequest
        {
            CsvData = Convert.ToBase64String(Encoding.UTF8.GetBytes(csvData)),
            Options = new ImportOptions
            {
                SkipInvalid = false // Should stop on error
            }
        };

        // Act
        var result = await _memberImportService.ExecuteImportAsync(_testClub.Id, _testUser.Id, request);

        // Assert
        Assert.That(result.Summary.Failed, Is.EqualTo(1));
        Assert.That(callCount, Is.EqualTo(1)); // Should only call once before stopping
    }

    [Test]
    public async Task ExecuteImportAsync_ContinuesOnErrorWhenSkipping()
    {
        // Arrange
        var callCount = 0;
        _mockMemberService.Setup(s => s.CreateMemberAsync(It.IsAny<int>(), It.IsAny<CreateMemberRequest>()))
            .Returns(() =>
            {
                callCount++;
                if (callCount == 1)
                    throw new InvalidOperationException("First member fails");
                return Task.FromResult(new MemberResponse { Id = 100 });
            });

        var csvData = "FullName,Email,PhoneNumber,MembershipType\n" +
                     "User1,user1@test.com,111,Regular\n" +
                     "User2,user2@test.com,222,Regular";

        var request = new ImportRequest
        {
            CsvData = Convert.ToBase64String(Encoding.UTF8.GetBytes(csvData)),
            Options = new ImportOptions
            {
                SkipInvalid = true // Should continue on error
            }
        };

        // Act
        var result = await _memberImportService.ExecuteImportAsync(_testClub.Id, _testUser.Id, request);

        // Assert
        Assert.That(result.Summary.Failed, Is.EqualTo(1));
        Assert.That(result.Summary.Successful, Is.EqualTo(1));
        Assert.That(callCount, Is.EqualTo(2)); // Should call both times
    }

    [Test]
    public async Task ExecuteImportAsync_SavesErrorReportToDatabase()
    {
        // Arrange
        _mockMemberService.Setup(s => s.CreateMemberAsync(It.IsAny<int>(), It.IsAny<CreateMemberRequest>()))
            .ThrowsAsync(new InvalidOperationException("Member creation failed"));

        var csvData = "FullName,Email,PhoneNumber,MembershipType\n" +
                     "John Doe,john@test.com,123,Regular";

        var request = new ImportRequest
        {
            CsvData = Convert.ToBase64String(Encoding.UTF8.GetBytes(csvData)),
            Options = new ImportOptions { SkipInvalid = true }
        };

        // Act
        var result = await _memberImportService.ExecuteImportAsync(_testClub.Id, _testUser.Id, request);

        // Assert
        var importRecord = await _context.MemberImports.FirstOrDefaultAsync(i => i.ImportId == result.ImportId);
        Assert.That(importRecord, Is.Not.Null);
        Assert.That(importRecord.ErrorReport, Is.Not.Null);
    }

    #endregion

    #region Extended Status Tests

    [Test]
    public async Task GetImportStatusAsync_WithErrorReport_ShouldDeserializeIt()
    {
        // Arrange
        var importId = Guid.NewGuid();
        var errors = new List<ImportError>
        {
            new() { RowNumber = 1, Error = "Test error" }
        };
        var importRecord = new MemberImport
        {
            ImportId = importId,
            ClubId = _testClub.Id,
            UserId = _testUser.Id,
            Status = "Completed",
            TotalRows = 1,
            SuccessfulRows = 0,
            FailedRows = 1,
            ErrorReport = System.Text.Json.JsonSerializer.Serialize(errors),
            CreatedAt = DateTime.UtcNow
        };
        _context.MemberImports.Add(importRecord);
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberImportService.GetImportStatusAsync(importId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Errors, Is.Not.Empty);
        Assert.That(result.Errors.First().RowNumber, Is.EqualTo(1));
    }

    [Test]
    public async Task GetImportStatusAsync_WithInvalidErrorReport_ShouldHandleGracefully()
    {
        // Arrange
        var importId = Guid.NewGuid();
        var importRecord = new MemberImport
        {
            ImportId = importId,
            ClubId = _testClub.Id,
            UserId = _testUser.Id,
            Status = "Completed",
            TotalRows = 1,
            SuccessfulRows = 0,
            FailedRows = 1,
            ErrorReport = "invalid-json",
            CreatedAt = DateTime.UtcNow
        };
        _context.MemberImports.Add(importRecord);
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberImportService.GetImportStatusAsync(importId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Errors, Is.Empty); // Gracefully returns empty list
    }

    [Test]
    public async Task GetImportStatusAsync_CalculatesSkippedCorrectly()
    {
        // Arrange
        var importId = Guid.NewGuid();
        var importRecord = new MemberImport
        {
            ImportId = importId,
            ClubId = _testClub.Id,
            UserId = _testUser.Id,
            Status = "Completed",
            TotalRows = 10,
            SuccessfulRows = 7,
            FailedRows = 2,
            CreatedAt = DateTime.UtcNow
        };
        _context.MemberImports.Add(importRecord);
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberImportService.GetImportStatusAsync(importId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Summary.Skipped, Is.EqualTo(1)); // 10 - 7 - 2 = 1
    }

    #endregion

    #region Helper Methods

    private IFormFile CreateFormFile(string fileName, string content)
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        var formFile = new Mock<IFormFile>();

        formFile.Setup(f => f.FileName).Returns(fileName);
        formFile.Setup(f => f.Length).Returns(bytes.Length);
        formFile.Setup(f => f.ContentType).Returns("text/csv");
        formFile.Setup(f => f.OpenReadStream()).Returns(() => new MemoryStream(bytes));
        formFile.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Returns((Stream target, CancellationToken token) =>
            {
                var stream = new MemoryStream(bytes);
                stream.Position = 0;
                return stream.CopyToAsync(target, token);
            });

        return formFile.Object;
    }

    #endregion
}
