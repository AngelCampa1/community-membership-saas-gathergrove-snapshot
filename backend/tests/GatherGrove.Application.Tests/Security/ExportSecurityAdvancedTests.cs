using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System.Security.Claims;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Application.Security;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Tests.Security;

/// <summary>
/// TDD Advanced Security Tests for Export Services - US-005 Data Export & Reporting Engine
/// RED PHASE: Comprehensive failing tests for security, access control, and data protection
/// Tests authorization, data sanitization, audit trails, and compliance requirements
/// Follows RED→GREEN→REFACTOR TDD cycle
/// </summary>
[TestFixture]
public class ExportSecurityAdvancedTests
{
    private Mock<ILogger<ExportSecurityService>> _mockLogger = null!;
    private Mock<IAuthorizationService> _mockAuthorizationService = null!;
    private Mock<IDataSanitizationService> _mockDataSanitizationService = null!;
    private Mock<IAuditTrailService> _mockAuditTrailService = null!;
    private Mock<IEncryptionService> _mockEncryptionService = null!;
    private Mock<IComplianceService> _mockComplianceService = null!;
    private IExportSecurityService _exportSecurityService = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<ExportSecurityService>>();
        _mockAuthorizationService = new Mock<IAuthorizationService>();
        _mockDataSanitizationService = new Mock<IDataSanitizationService>();
        _mockAuditTrailService = new Mock<IAuditTrailService>();
        _mockEncryptionService = new Mock<IEncryptionService>();
        _mockComplianceService = new Mock<IComplianceService>();

        // This will fail until implementation exists - RED PHASE
        _exportSecurityService = new ExportSecurityService(
            _mockLogger.Object,
            _mockAuthorizationService.Object,
            _mockDataSanitizationService.Object,
            _mockAuditTrailService.Object,
            _mockEncryptionService.Object,
            _mockComplianceService.Object);
    }

    #region Authorization & Access Control Tests (RED Phase)

    [Test]
    public async Task ValidateExportPermissions_AdminUser_AllowsFullAccess()
    {
        // Arrange
        var userId = 1;
        var clubId = 100;
        var exportType = "FinancialData";
        var userClaims = CreateAdminUserClaims(userId, clubId);

        var identity = new ClaimsIdentity(userClaims, "mock");
        var principal = new ClaimsPrincipal(identity);
        _mockAuthorizationService.Setup(x => x.GetUserClaimsAsync(userId))
            .ReturnsAsync(principal);

        // Act
        var result = await _exportSecurityService.ValidateExportPermissions(userId, clubId, exportType);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsAuthorized, Is.True);
        Assert.That(result.AccessLevel, Is.EqualTo(ExportAccessLevel.Full));
        Assert.That(result.PermissionGranted.Contains("READ"), Is.True);
        Assert.That(result.PermissionGranted.Contains("EXPORT"), Is.True);
        Assert.That(result.PermissionGranted.Contains("FINANCIAL_DATA"), Is.True);
    }

    [Test]
    public async Task ValidateExportPermissions_RegularMember_RestrictedAccess()
    {
        // Arrange
        var userId = 2;
        var clubId = 100;
        var exportType = "MemberData";
        var userClaims = CreateRegularMemberClaims(userId, clubId);

        var identity = new ClaimsIdentity(userClaims, "mock");
        var principal = new ClaimsPrincipal(identity);
        _mockAuthorizationService.Setup(x => x.GetUserClaimsAsync(userId))
            .ReturnsAsync(principal);

        // Act
        var result = await _exportSecurityService.ValidateExportPermissions(userId, clubId, exportType);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsAuthorized, Is.True);
        Assert.That(result.AccessLevel, Is.EqualTo(ExportAccessLevel.Limited));
        Assert.That(result.PermissionGranted.Contains("READ"), Is.True);
        Assert.That(result.PermissionGranted.Contains("EXPORT"), Is.True);
        Assert.That(result.PermissionGranted.Contains("FINANCIAL_DATA"), Is.False);
        Assert.That(result.DataRestrictionsApply, Is.True);
    }

    [Test]
    public async Task ValidateExportPermissions_UnauthorizedUser_DeniesAccess()
    {
        // Arrange
        var userId = 3;
        var clubId = 200; // Different club
        var exportType = "MemberData";
        var userClaims = CreateRegularMemberClaims(userId, 100); // Member of different club

        var identity = new ClaimsIdentity(userClaims, "mock");
        var principal = new ClaimsPrincipal(identity);
        _mockAuthorizationService.Setup(x => x.GetUserClaimsAsync(userId))
            .ReturnsAsync(principal);

        // Act
        var result = await _exportSecurityService.ValidateExportPermissions(userId, clubId, exportType);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsAuthorized, Is.False);
        Assert.That(result.AccessLevel, Is.EqualTo(ExportAccessLevel.None));
        Assert.That(result.DenialReason, Does.Contain("not a member of the requested club"));
    }

    [Test]
    public async Task ValidateExportPermissions_ExpiredMembership_DeniesAccess()
    {
        // Arrange
        var userId = 4;
        var clubId = 100;
        var exportType = "MemberData";
        var userClaims = CreateExpiredMembershipClaims(userId, clubId);

        var identity = new ClaimsIdentity(userClaims, "mock");
        var principal = new ClaimsPrincipal(identity);
        _mockAuthorizationService.Setup(x => x.GetUserClaimsAsync(userId))
            .ReturnsAsync(principal);

        // Act
        var result = await _exportSecurityService.ValidateExportPermissions(userId, clubId, exportType);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsAuthorized, Is.False);
        Assert.That(result.AccessLevel, Is.EqualTo(ExportAccessLevel.None));
        Assert.That(result.DenialReason, Does.Contain("membership has expired"));
    }

    [Test]
    public async Task ValidateExportPermissions_SuspendedUser_DeniesAccess()
    {
        // Arrange
        var userId = 5;
        var clubId = 100;
        var exportType = "MemberData";
        var userClaims = CreateSuspendedUserClaims(userId, clubId);

        var identity = new ClaimsIdentity(userClaims, "mock");
        var principal = new ClaimsPrincipal(identity);

        // Add membership_status to ensure complete claim set
        userClaims.Add(new Claim("membership_status", "Active"));
        identity = new ClaimsIdentity(userClaims, "mock");
        principal = new ClaimsPrincipal(identity);

        _mockAuthorizationService.Setup(x => x.GetUserClaimsAsync(userId))
            .ReturnsAsync(principal);

        // Act
        var result = await _exportSecurityService.ValidateExportPermissions(userId, clubId, exportType);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsAuthorized, Is.False);
        Assert.That(result.AccessLevel, Is.EqualTo(ExportAccessLevel.None));
        Assert.That(result.DenialReason, Does.Contain("account is suspended"));
    }

    #endregion

    #region Data Sanitization & Privacy Tests (RED Phase)

    [Test]
    public async Task SanitizeExportData_MemberDataWithPII_RedactsSensitiveInformation()
    {
        // Arrange
        var rawData = CreateMockMemberDataWithPII();
        var sanitizationRules = new DataSanitizationRules
        {
            RedactPhoneNumbers = true,
            RedactSSN = true,
            RedactCreditCardNumbers = true,
            RedactEmailDomains = false,
            HashPersonalIdentifiers = true
        };

        _mockDataSanitizationService.Setup(x => x.SanitizeAsync(rawData, sanitizationRules))
            .ReturnsAsync(CreateSanitizedMemberData());

        // Act
        var result = await _exportSecurityService.SanitizeExportData(rawData, sanitizationRules);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.DataSanitized, Is.True);
        Assert.That(result.SanitizedData, Does.Not.Contain("123-45-6789")); // SSN redacted
        Assert.That(result.SanitizedData, Does.Not.Contain("555-123-4567")); // Phone redacted
        Assert.That(result.SanitizedData, Does.Contain("***-**-6789")); // Masked SSN
        Assert.That(result.SanitizedData, Does.Contain("***-***-4567")); // Masked phone
        Assert.That(result.RedactionLog.Count, Is.GreaterThan(0));
    }

    [Test]
    public async Task SanitizeExportData_FinancialDataWithSensitiveInfo_RedactsFinancialDetails()
    {
        // Arrange
        var rawFinancialData = CreateMockFinancialDataWithSensitiveInfo();
        var sanitizationRules = new DataSanitizationRules
        {
            RedactCreditCardNumbers = true,
            RedactBankAccountNumbers = true,
            RedactTaxIdentifiers = true,
            MaskAmountsUnder1000 = true
        };

        _mockDataSanitizationService.Setup(x => x.SanitizeAsync(rawFinancialData, sanitizationRules))
            .ReturnsAsync(CreateSanitizedFinancialData());

        // Act
        var result = await _exportSecurityService.SanitizeExportData(rawFinancialData, sanitizationRules);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.SanitizedData, Does.Not.Contain("4532-1234-5678-9012")); // CC redacted
        Assert.That(result.SanitizedData, Does.Not.Contain("123456789")); // Bank account redacted
        Assert.That(result.SanitizedData, Does.Contain("****-****-****-9012")); // Masked CC
        Assert.That(result.RedactionLog.Any(r => r.FieldName == "CreditCardNumber"), Is.True);
        Assert.That(result.RedactionLog.Any(r => r.FieldName == "BankAccountNumber"), Is.True);
    }

    [Test]
    public async Task SanitizeExportData_ComplianceLevel_GDPR_AppliesGDPRRules()
    {
        // Arrange
        var rawData = CreateMockMemberDataWithPII();
        var complianceLevel = ComplianceLevel.GDPR;

        _mockComplianceService.Setup(x => x.GetSanitizationRulesForCompliance(complianceLevel))
            .Returns(CreateGDPRSanitizationRules());

        _mockDataSanitizationService.Setup(x => x.SanitizeAsync(rawData, It.IsAny<DataSanitizationRules>()))
            .ReturnsAsync(CreateGDPRCompliantData());

        // Act
        var result = await _exportSecurityService.SanitizeForCompliance(rawData, complianceLevel);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ComplianceLevel, Is.EqualTo(ComplianceLevel.GDPR));
        Assert.That(result.IsCompliant, Is.True);
        Assert.That(result.ComplianceViolations.Count, Is.EqualTo(0));
        Assert.That(result.DataMinimizationApplied, Is.True);
        Assert.That(result.ConsentRequiredFields.Count, Is.GreaterThan(0));
    }

    #endregion

    #region Audit Trail & Logging Tests (RED Phase)

    [Test]
    public async Task LogExportActivity_SuccessfulExport_CreatesAuditTrailEntry()
    {
        // Arrange
        var auditInfo = new ExportAuditInfo
        {
            UserId = 1,
            ClubId = 100,
            ExportType = ExportType.Members,
            ExportFormat = ExportFormat.CSV,
            RecordCount = 150,
            FileSizeBytes = 1024000,
            IPAddress = "192.168.1.100",
            UserAgent = "Mozilla/5.0...",
            ExportStartTime = DateTime.UtcNow.AddMinutes(-5),
            ExportEndTime = DateTime.UtcNow
        };

        _mockAuditTrailService.Setup(x => x.LogExportActivityAsync(auditInfo))
            .ReturnsAsync("audit-123");

        // Act
        var auditId = await _exportSecurityService.LogExportActivity(auditInfo);

        // Assert
        Assert.That(auditId, Is.Not.Empty);
        Assert.That(auditId, Is.EqualTo("audit-123"));

        // Verify audit service was called with correct information
        _mockAuditTrailService.Verify(x => x.LogExportActivityAsync(
            It.Is<ExportAuditInfo>(a =>
                a.UserId == auditInfo.UserId &&
                a.ExportType == auditInfo.ExportType &&
                a.RecordCount == auditInfo.RecordCount)), Times.Once);
    }

    [Test]
    public async Task LogExportActivity_FailedExport_CreatesFailureAuditEntry()
    {
        // Arrange
        var auditInfo = new ExportAuditInfo
        {
            UserId = 2,
            ClubId = 100,
            ExportType = ExportType.Financials,
            ExportStatus = ExportStatus.Failed,
            ErrorMessage = "Database connection timeout",
            AttemptedAt = DateTime.UtcNow
        };

        _mockAuditTrailService.Setup(x => x.LogExportActivityAsync(auditInfo))
            .ReturnsAsync("audit-456");

        // Act
        var auditId = await _exportSecurityService.LogExportActivity(auditInfo);

        // Assert
        Assert.That(auditId, Is.Not.Empty);

        _mockAuditTrailService.Verify(x => x.LogExportActivityAsync(
            It.Is<ExportAuditInfo>(a =>
                a.ExportStatus == ExportStatus.Failed &&
                a.ErrorMessage == "Database connection timeout")), Times.Once);
    }

    [Test]
    public async Task LogSecurityEvent_UnauthorizedAccessAttempt_CreatesSecurityLog()
    {
        // Arrange
        var securityEvent = new GatherGrove.Domain.Entities.SecurityEvent
        {
            EventType = SecurityEventType.UnauthorizedExportAttempt,
            UserId = 3,
            ClubId = 200,
            IPAddress = "192.168.1.200",
            Severity = SecurityEventSeverity.High,
            Description = "User attempted to export financial data without permission",
            AdditionalData = new Dictionary<string, string>
            {
                { "RequestedExportType", "FinancialData" },
                { "UserRole", "RegularMember" },
                { "ClubMembership", "None" }
            }
        };

        _mockAuditTrailService.Setup(x => x.LogSecurityEventAsync(securityEvent))
            .Returns(Task.CompletedTask);

        // Act
        await _exportSecurityService.LogSecurityEvent(securityEvent);

        // Assert - Verify the method was called
        _mockAuditTrailService.Verify(x => x.LogSecurityEventAsync(securityEvent), Times.Once);

        _mockAuditTrailService.Verify(x => x.LogSecurityEventAsync(
            It.Is<GatherGrove.Domain.Entities.SecurityEvent>(s =>
                s.EventType == SecurityEventType.UnauthorizedExportAttempt &&
                s.Severity == SecurityEventSeverity.High)), Times.Once);
    }

    #endregion

    #region Encryption & Data Protection Tests (RED Phase)

    [Test]
    public async Task EncryptExportData_SensitiveData_EncryptsDataSecurely()
    {
        // Arrange
        var plainTextData = System.Text.Encoding.UTF8.GetBytes("Sensitive member and financial data content");
        var expectedEncryptedData = System.Text.Encoding.UTF8.GetBytes("encrypted-base64-data-here");

        // PHASE 8 FIX: Mock the single-parameter EncryptAsync overload (used by ExportSecurityService)
        _mockEncryptionService.Setup(x => x.EncryptAsync(plainTextData))
            .ReturnsAsync(expectedEncryptedData);

        // Act
        var result = await _exportSecurityService.EncryptExportData(plainTextData);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.EqualTo(expectedEncryptedData));
        // Verify the data is encrypted (different from original)
        Assert.That(result, Is.Not.EqualTo(plainTextData));
        Assert.That(result.Length, Is.GreaterThan(0));
        // Encrypted data should be non-empty
    }

    [Test]
    public async Task GenerateSecureDownloadLink_ValidExportId_CreatesSecureLink()
    {
        // Arrange
        var exportId = 123;
        var userId = 1;
        var expirationMinutes = 60;
        var expectedSecureUrl = "https://secure.gathergrove.club/downloads/secure-token-abc123";

        _mockEncryptionService.Setup(x => x.GenerateSecureDownloadTokenAsync(exportId.ToString(), userId))
            .ReturnsAsync("secure-token-abc123");

        // Act
        var result = await _exportSecurityService.GenerateSecureDownloadLink(exportId.ToString(), userId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.EqualTo(expectedSecureUrl));
        // Verify the URL contains expected components
        Assert.That(result, Does.Contain("secure"));
    }

    [Test]
    public async Task ValidateSecureDownloadToken_ValidToken_AllowsAccess()
    {
        // Arrange
        var secureToken = "secure-token-abc123";
        var userId = 1;
        var expectedExportId = 123; // Changed from string to int to match ExportId property type

        _mockEncryptionService.Setup(x => x.ValidateSecureDownloadTokenAsync(secureToken, userId))
            .ReturnsAsync(new SecureTokenValidationResult
            {
                IsValid = true,
                ExportId = expectedExportId, // Now properly typed as int
                UserId = userId,
                ExpiresAt = DateTime.UtcNow.AddMinutes(30),
                RemainingDownloads = 1
            });

        // Act
        var result = await _exportSecurityService.ValidateSecureDownloadToken(secureToken);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.ExportId, Is.EqualTo(expectedExportId)); // Now comparing int? with int
        Assert.That(result.RemainingDownloads, Is.EqualTo(1));
        Assert.That(result.ValidationFailureReason, Is.Null);
    }

    [Test]
    public async Task ValidateSecureDownloadToken_ExpiredToken_DeniesAccess()
    {
        // Arrange
        var expiredToken = "expired-token-xyz789";
        var userId = 1;

        _mockEncryptionService.Setup(x => x.ValidateSecureDownloadTokenAsync(expiredToken, userId))
            .ReturnsAsync(new SecureTokenValidationResult
            {
                IsValid = false,
                ExpiresAt = DateTime.UtcNow.AddMinutes(-30),
                RemainingDownloads = 0,
                ValidationFailureReason = "Token has expired"
            });

        // Act
        var result = await _exportSecurityService.ValidateSecureDownloadToken(expiredToken);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationFailureReason, Is.Not.Null);
        Assert.That(result.ValidationFailureReason, Is.EqualTo("Token has expired"));
    }

    [Test]
    public async Task ValidateSecureDownloadToken_NoEncryptionService_DeniesArbitraryToken()
    {
        // Arrange
        var serviceWithoutEncryption = new ExportSecurityService();

        // Act
        var result = await serviceWithoutEncryption.ValidateSecureDownloadToken("secure-token-user=1-anything");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationType, Is.EqualTo(TokenValidationType.Invalid));
        Assert.That(result.ValidationFailureReason, Does.Contain("Encryption service is required"));
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_NoEncryptionService_DeniesArbitraryToken()
    {
        // Arrange
        var serviceWithoutEncryption = new ExportSecurityService();

        // Act
        var result = await serviceWithoutEncryption.ValidateSecureDownloadTokenAsync("secure-token-user=1-anything");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationType, Is.EqualTo(TokenValidationType.Invalid));
    }

    #endregion

    #region Rate Limiting & Abuse Prevention Tests (RED Phase)

    [Test]
    public async Task CheckExportRateLimit_WithinLimits_AllowsExport()
    {
        // Arrange
        var userId = 1;
        var clubId = 100;
        var exportType = "MemberData";

        _mockAuthorizationService.Setup(x => x.GetUserExportQuotaAsync(userId))
            .ReturnsAsync(50); // Max exports per day

        // Act
        var result = await _exportSecurityService.CheckExportRateLimit(userId, exportType, clubId);

        // Assert
        Assert.That(result, Is.True); // Within rate limit
    }

    [Test]
    public async Task CheckExportRateLimit_ExceededHourlyLimit_DeniesExport()
    {
        // Arrange
        var userId = 2;
        var clubId = 100;
        var exportType = "FinancialData";

        _mockAuthorizationService.Setup(x => x.GetUserExportQuotaAsync(userId))
            .ReturnsAsync(50); // Max exports per day

        // Act
        var result = await _exportSecurityService.CheckExportRateLimit(userId, exportType, clubId);

        // Assert
        Assert.That(result, Is.False); // Exceeded rate limit
    }

    [Test]
    public async Task DetectSuspiciousActivity_RapidMultipleRequests_FlagsAsSuspicious()
    {
        // Arrange
        var userId = 3;
        var clubId = 100;
        var requests = CreateMultipleRapidRequests(userId, clubId, 20); // 20 requests in 1 minute

        // Act
        var result = await _exportSecurityService.DetectSuspiciousActivity(userId, "RapidRequests");

        // Assert
        Assert.That(result, Is.EqualTo(SuspicionLevel.High));
    }

    #endregion

    #region Compliance & Regulatory Tests (RED Phase)

    [Test]
    public async Task ValidateComplianceRequirements_GDPR_EnsuresGDPRCompliance()
    {
        // Arrange
        var exportRequest = CreateMockExportRequest();
        var complianceRequirements = ComplianceLevel.GDPR;

        _mockComplianceService.Setup(x => x.ValidateGDPRComplianceAsync(exportRequest))
            .Returns(Task.FromResult(true));

        // Act
        var result = await _exportSecurityService.ValidateComplianceRequirements(exportRequest, complianceRequirements);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsCompliant, Is.True);
        Assert.That(result.RequiredConsents.Contains("DataExport"), Is.True);
        Assert.That(result.RequiredConsents.Contains("DataProcessing"), Is.True);
        Assert.That(result.DataRetentionPeriod, Is.EqualTo(TimeSpan.FromDays(90)));
        Assert.That(result.RequiresDataMinimization, Is.True);
    }

    [Test]
    public async Task ValidateComplianceRequirements_CCPA_EnsuresCCPACompliance()
    {
        // Arrange
        var exportRequest = CreateMockExportRequest();
        var complianceRequirements = ComplianceLevel.CCPA;

        _mockComplianceService.Setup(x => x.ValidateCCPAComplianceAsync(exportRequest))
            .Returns(Task.FromResult(true));

        // Act
        var result = await _exportSecurityService.ValidateComplianceRequirements(exportRequest, complianceRequirements);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsCompliant, Is.True);
        Assert.That(result.RequiredDisclosures.Contains("DataSources"), Is.True);
        Assert.That(result.ConsumerRights.Contains("RightToDelete"), Is.True);
    }

    #endregion

    #region Helper Methods

    private List<Claim> CreateAdminUserClaims(int userId, int clubId)
    {
        return new List<Claim>
        {
            new Claim("user_id", userId.ToString()),
            new Claim("club_id", clubId.ToString()),
            new Claim("role", "Admin"),
            new Claim("permissions", "READ,WRITE,EXPORT,DELETE,FINANCIAL_DATA"),
            new Claim("membership_status", "Active"),
            new Claim("membership_expires", DateTime.UtcNow.AddYears(1).ToString())
        };
    }

    private List<Claim> CreateRegularMemberClaims(int userId, int clubId)
    {
        return new List<Claim>
        {
            new Claim("user_id", userId.ToString()),
            new Claim("club_id", clubId.ToString()),
            new Claim("role", "Member"),
            new Claim("permissions", "READ,EXPORT"),
            new Claim("membership_status", "Active"),
            new Claim("membership_expires", DateTime.UtcNow.AddYears(1).ToString())
        };
    }

    private List<Claim> CreateExpiredMembershipClaims(int userId, int clubId)
    {
        return new List<Claim>
        {
            new Claim("user_id", userId.ToString()),
            new Claim("club_id", clubId.ToString()),
            new Claim("role", "Member"),
            new Claim("membership_status", "Expired"),
            new Claim("membership_expires", DateTime.UtcNow.AddMonths(-1).ToString())
        };
    }

    private List<Claim> CreateSuspendedUserClaims(int userId, int clubId)
    {
        return new List<Claim>
        {
            new Claim("user_id", userId.ToString()),
            new Claim("club_id", clubId.ToString()),
            new Claim("role", "Member"),
            new Claim("account_status", "Suspended"),
            new Claim("suspension_reason", "Policy Violation")
        };
    }

    private string CreateMockMemberDataWithPII()
    {
        return @"MemberId,FirstName,LastName,Email,Phone,SSN
1,John,Doe,john.doe@test.com,555-123-4567,123-45-6789
2,Jane,Smith,jane.smith@test.com,555-987-6543,987-65-4321";
    }

    private string CreateSanitizedMemberData()
    {
        return @"MemberId,FirstName,LastName,Email,Phone,SSN
1,John,Doe,john.doe@test.com,***-***-4567,***-**-6789
2,Jane,Smith,jane.smith@test.com,***-***-6543,***-**-4321";
    }

    private string CreateMockFinancialDataWithSensitiveInfo()
    {
        return @"TransactionId,Amount,CreditCardNumber,BankAccountNumber,TaxId
1,150.00,4532-1234-5678-9012,123456789,12-3456789
2,75.50,5555-4444-3333-2222,987654321,98-7654321";
    }

    private string CreateSanitizedFinancialData()
    {
        return @"TransactionId,Amount,CreditCardNumber,BankAccountNumber,TaxId
1,150.00,****-****-****-9012,*****6789,**-*****789
2,75.50,****-****-****-2222,*****4321,**-*****321";
    }

    private DataSanitizationRules CreateGDPRSanitizationRules()
    {
        return new DataSanitizationRules
        {
            RedactPhoneNumbers = true,
            RedactSSN = true,
            RedactEmailDomains = false,
            HashPersonalIdentifiers = true,
            RequireExplicitConsent = true,
            DataMinimization = true,
            PurposeLimitation = true
        };
    }

    private string CreateGDPRCompliantData()
    {
        return "GDPR compliant sanitized data";
    }

    private List<ExportRequest> CreateMultipleRapidRequests(int userId, int clubId, int count)
    {
        var requests = new List<ExportRequest>();
        var baseTime = DateTime.UtcNow.AddMinutes(-1);

        for (int i = 0; i < count; i++)
        {
            requests.Add(new ExportRequest
            {
                UserId = userId.ToString(),
                ClubId = clubId,
                RequestTime = baseTime.AddSeconds(i * 3), // Every 3 seconds
                ExportType = ExportType.Members,
                IPAddress = "192.168.1.100"
            });
        }

        return requests;
    }

    private ExportRequest CreateMockExportRequest()
    {
        return new ExportRequest
        {
            UserId = "1",
            ClubId = 100,
            ExportType = ExportType.Members,
            Format = ExportFormat.CSV,
            IncludePersonalData = true,
            Purpose = "Monthly reporting",
            DataProcessingLegalBasis = "Legitimate Interest"
        };
    }

    #endregion
}
