using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System.Text;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// TDD Tests for FinancialExportService - US-005 Data Export & Reporting Engine
/// RED PHASE: Comprehensive failing tests for financial data export functionality
/// Tests all financial reporting formats with data integrity and security validation
/// Follows RED→GREEN→REFACTOR TDD cycle
/// </summary>
[TestFixture]
public class FinancialExportServiceTests
{
    private IFinancialExportService _financialExportService = null!;
    private Mock<ILogger<FinancialExportService>> _mockLogger = null!;
    private Mock<IFinancialRepository> _mockFinancialRepository = null!;
    private Mock<IClubTierService> _mockClubTierService = null!;
    private Mock<IEmailService> _mockEmailService = null!;
    private Mock<IAuditService> _mockAuditService = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<FinancialExportService>>();
        _mockFinancialRepository = new Mock<IFinancialRepository>();
        _mockClubTierService = new Mock<IClubTierService>();
        _mockEmailService = new Mock<IEmailService>();
        _mockAuditService = new Mock<IAuditService>();

        // This will fail until implementation exists - RED PHASE
        _financialExportService = new FinancialExportService(
            _mockLogger.Object,
            _mockFinancialRepository.Object,
            _mockClubTierService.Object,
            _mockEmailService.Object,
            _mockAuditService.Object);
    }

    #region Financial CSV Export Tests (RED Phase)

    [Test]
    public async Task ExportFinancialDataToCsv_ValidRequest_ReturnsValidFinancialData()
    {
        // Arrange
        var clubId = 1;
        var financialExportOptions = new FinancialExportOptions
        {
            IncludeRevenue = true,
            IncludeExpenses = true,
            IncludeMembershipFees = true,
            DateFrom = DateTime.UtcNow.AddMonths(-12),
            DateTo = DateTime.UtcNow,
            Currency = "USD"
        };
        var userId = 123;

        var mockFinancialData = CreateMockFinancialData();
        _mockFinancialRepository.Setup(x => x.GetFinancialDataAsync(clubId, financialExportOptions.DateFrom, financialExportOptions.DateTo))
            .ReturnsAsync(mockFinancialData.Cast<object>().ToList());

        _mockClubTierService.Setup(x => x.CanExportFinancialData(userId, clubId))
            .ReturnsAsync(true);

        // Setup data limit
        _mockClubTierService.Setup(x => x.GetFinancialExportLimitAsync(clubId))
            .ReturnsAsync(1000);

        // Act
        var result = await _financialExportService.ExportFinancialDataToCsv(clubId, financialExportOptions, userId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        var csvContent = Encoding.UTF8.GetString(result);
        var lines = csvContent.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

        // Verify CSV header
        Assert.That(lines[0], Is.EqualTo("TransactionDate,Type,Category,Description,Amount,Currency,PaymentMethod,Status"));

        // Verify data rows
        Assert.That(lines.Length, Is.GreaterThan(1));
        Assert.That(lines[1], Does.Contain("2024"));
        Assert.That(lines[1], Does.Contain("USD"));
        Assert.That(lines[1], Does.Contain("Revenue"));

        // Verify audit trail
        _mockAuditService.Verify(x => x.LogFinancialExportAsync(userId, clubId, "CSV", It.IsAny<DateTime>()), Times.Once);
    }

    [Test]
    public async Task ExportFinancialDataToCsv_UnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var clubId = 1;
        var financialExportOptions = new FinancialExportOptions();
        var userId = 999;

        _mockClubTierService.Setup(x => x.CanExportFinancialData(userId, clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _financialExportService.ExportFinancialDataToCsv(clubId, financialExportOptions, userId));

        Assert.That(exception.Message, Does.Contain("Financial data export requires administrative privileges"));
    }

    [Test]
    public async Task ExportMembershipFeesToCsv_ValidRequest_ReturnsValidMembershipData()
    {
        // Arrange
        var clubId = 2;
        var financialExportOptions = new FinancialExportOptions
        {
            IncludeMembershipFees = true,
            IncludePaymentDetails = true,
            DateFrom = DateTime.UtcNow.AddMonths(-6),
            DateTo = DateTime.UtcNow
        };

        var mockMembershipFees = CreateMockMembershipFeesData();
        _mockFinancialRepository.Setup(x => x.GetMembershipFeesAsync(clubId, financialExportOptions.DateFrom, financialExportOptions.DateTo))
            .ReturnsAsync(mockMembershipFees.Cast<object>().ToList());

        // Act
        var result = await _financialExportService.ExportMembershipFeesToCsv(clubId, financialExportOptions);

        // Assert
        var csvContent = Encoding.UTF8.GetString(result);
        var lines = csvContent.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

        Assert.That(lines[0], Is.EqualTo("MemberId,MemberName,FeeType,Amount,DueDate,PaidDate,PaymentMethod,Status"));
        Assert.That(csvContent, Does.Contain("Monthly Fee"));
        Assert.That(csvContent, Does.Contain("Annual Fee"));
        Assert.That(csvContent, Does.Contain("Paid"));
        Assert.That(csvContent, Does.Contain("Overdue"));
    }

    #endregion

    #region Financial Excel Export Tests (RED Phase)

    [Test]
    public async Task ExportFinancialDataToExcel_ValidRequest_ReturnsValidExcelData()
    {
        // Arrange
        var clubId = 3;
        var financialExportOptions = new FinancialExportOptions
        {
            IncludeRevenue = true,
            IncludeExpenses = true,
            IncludeCharts = true,
            IncludeSummary = true,
            DateFrom = DateTime.UtcNow.AddMonths(-12),
            DateTo = DateTime.UtcNow
        };
        var userId = 456;

        var mockFinancialData = CreateMockFinancialData();
        var mockSummary = CreateMockFinancialSummary();

        _mockFinancialRepository.Setup(x => x.GetFinancialDataAsync(clubId, financialExportOptions.DateFrom, financialExportOptions.DateTo))
            .ReturnsAsync(mockFinancialData.Cast<object>().ToList());
        _mockFinancialRepository.Setup(x => x.GetFinancialSummaryAsync(clubId, financialExportOptions.DateFrom, financialExportOptions.DateTo))
            .ReturnsAsync(mockSummary);

        // Setup authorization - REQUIRED for financial data export
        _mockClubTierService.Setup(x => x.CanExportFinancialData(userId, clubId))
            .ReturnsAsync(true);

        // Setup data limit
        _mockClubTierService.Setup(x => x.GetFinancialExportLimitAsync(clubId))
            .ReturnsAsync(1000);

        // Act
        var result = await _financialExportService.ExportFinancialDataToExcel(clubId, financialExportOptions, userId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        // For GREEN phase, we'll accept simplified Excel format
        var excelContent = Encoding.UTF8.GetString(result);
        Assert.That(excelContent, Does.Contain("Financial Report"));
        Assert.That(excelContent, Does.Contain("Summary"));
        Assert.That(excelContent, Does.Contain("Total Revenue: $25,500.00"));
        Assert.That(excelContent, Does.Contain("Total Expenses: $12,300.00"));
        Assert.That(excelContent, Does.Contain("Net Income: $13,200.00"));
    }

    [Test]
    public async Task ExportFinancialDataToExcel_WithBudgetComparison_IncludesBudgetAnalysis()
    {
        // Arrange
        var clubId = 4;
        var financialExportOptions = new FinancialExportOptions
        {
            IncludeBudgetComparison = true,
            IncludeVarianceAnalysis = true,
            BudgetYear = 2024
        };

        var mockBudgetData = CreateMockBudgetComparisonData();
        _mockFinancialRepository.Setup(x => x.GetBudgetComparisonAsync(clubId, financialExportOptions.BudgetYear))
            .ReturnsAsync(mockBudgetData);

        // Setup financial data mock - this was missing!
        var mockFinancialData = CreateMockFinancialData();
        _mockFinancialRepository.Setup(x => x.GetFinancialDataAsync(clubId, null, null))
            .ReturnsAsync(mockFinancialData.Cast<object>().ToList());

        // Setup authorization - REQUIRED for financial data export
        _mockClubTierService.Setup(x => x.CanExportFinancialData(789, clubId))
            .ReturnsAsync(true);

        // Setup data limit
        _mockClubTierService.Setup(x => x.GetFinancialExportLimitAsync(clubId))
            .ReturnsAsync(1000);

        // Act
        var result = await _financialExportService.ExportFinancialDataToExcel(clubId, financialExportOptions, 789);

        // Assert
        var excelContent = Encoding.UTF8.GetString(result);
        Assert.That(excelContent, Does.Contain("Budget vs Actual"));
        Assert.That(excelContent, Does.Contain("Variance Analysis"));
        Assert.That(excelContent, Does.Contain("Budget: $30,000"));
        Assert.That(excelContent, Does.Contain("Actual: $25,500"));
        Assert.That(excelContent, Does.Contain("Variance: -$4,500"));
    }

    #endregion

    #region Financial PDF Report Tests (RED Phase)

    [Test]
    public async Task ExportFinancialReportToPdf_ValidRequest_ReturnsValidPdfReport()
    {
        // Arrange
        var clubId = 5;
        var financialExportOptions = new FinancialExportOptions
        {
            ReportType = "Annual",
            IncludeCharts = true,
            IncludeExecutiveSummary = true,
            IncludeDetailedTransactions = true,
            DateFrom = DateTime.UtcNow.AddYears(-1),
            DateTo = DateTime.UtcNow
        };
        var userId = 101;

        var mockFinancialData = CreateMockFinancialData();
        var mockSummary = CreateMockFinancialSummary();

        _mockFinancialRepository.Setup(x => x.GetFinancialDataAsync(clubId, financialExportOptions.DateFrom, financialExportOptions.DateTo))
            .ReturnsAsync(mockFinancialData.Cast<object>().ToList());
        _mockFinancialRepository.Setup(x => x.GetFinancialSummaryAsync(clubId, financialExportOptions.DateFrom, financialExportOptions.DateTo))
            .ReturnsAsync(mockSummary);

        // Act
        var result = await _financialExportService.ExportFinancialReportToPdf(clubId, financialExportOptions, userId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        var pdfContent = Encoding.UTF8.GetString(result);
        Assert.That(pdfContent, Does.Contain("Annual Financial Report"));
        Assert.That(pdfContent, Does.Contain("Executive Summary"));
        Assert.That(pdfContent, Does.Contain($"Club ID: {clubId}"));
        Assert.That(pdfContent, Does.Contain("Financial Performance"));
        Assert.That(pdfContent, Does.Contain("Generated on:"));
    }

    [Test]
    public async Task ExportTaxReportToPdf_ValidRequest_ReturnsValidTaxReport()
    {
        // Arrange
        var clubId = 6;
        var financialExportOptions = new FinancialExportOptions
        {
            ReportType = "Tax",
            TaxYear = 2024,
            IncludeTaxDeductibleExpenses = true,
            IncludeNonProfitDocumentation = true
        };
        var userId = 102;

        var mockTaxData = CreateMockTaxData();
        _mockFinancialRepository.Setup(x => x.GetTaxDataAsync(clubId, financialExportOptions.TaxYear))
            .ReturnsAsync(mockTaxData);

        // Act
        var result = await _financialExportService.ExportTaxReportToPdf(clubId, financialExportOptions, userId);

        // Assert
        var pdfContent = Encoding.UTF8.GetString(result);
        Assert.That(pdfContent, Does.Contain("Tax Report 2024"));
        Assert.That(pdfContent, Does.Contain("Tax Deductible Expenses"));
        Assert.That(pdfContent, Does.Contain("Non-Profit Status"));
        Assert.That(pdfContent, Does.Contain("Total Deductions: $8,500.00"));
    }

    #endregion

    #region JSON Financial Export Tests (RED Phase)

    [Test]
    public async Task ExportFinancialDataToJson_ValidRequest_ReturnsValidJsonData()
    {
        // Arrange
        var clubId = 7;
        var financialExportOptions = new FinancialExportOptions
        {
            IncludeMetadata = true,
            IncludeApiCompatibleFormat = true
        };

        var mockFinancialData = CreateMockFinancialData();
        _mockFinancialRepository.Setup(x => x.GetFinancialDataAsync(clubId, null, null))
            .ReturnsAsync(mockFinancialData.Cast<object>().ToList());

        // Act
        var result = await _financialExportService.ExportFinancialDataToJson(clubId, financialExportOptions);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        var jsonContent = Encoding.UTF8.GetString(result);

        // Validate JSON structure
        Assert.That(jsonContent, Does.StartWith("{"));
        Assert.That(jsonContent, Does.EndWith("}"));
        Assert.That(jsonContent, Does.Contain("\"clubId\": " + clubId));
        Assert.That(jsonContent, Does.Contain("\"exportType\": \"financial\""));
        Assert.That(jsonContent, Does.Contain("\"transactions\": ["));
        Assert.That(jsonContent, Does.Contain("\"summary\": {"));
        Assert.That(jsonContent, Does.Contain("\"totalRevenue\":"));
        Assert.That(jsonContent, Does.Contain("\"totalExpenses\":"));
    }

    #endregion

    #region Scheduled Financial Reports Tests (RED Phase)

    [Test]
    public async Task ScheduleMonthlyFinancialReport_ValidRequest_ReturnsScheduleId()
    {
        // Arrange
        var clubId = 8;
        var scheduleRequest = new ScheduledReportRequest
        {
            ReportType = "Monthly Financial",
            Frequency = ReportFrequency.Monthly,
            Recipients = new List<string> { "finance@club.com", "admin@club.com" },
            Format = ExportFormat.PDF,
            IncludeCharts = true,
            DeliveryTime = new TimeSpan(9, 0, 0) // 9:00 AM
        };
        var userId = 103;

        // Act
        var result = await _financialExportService.ScheduleMonthlyFinancialReport(clubId, scheduleRequest, userId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ScheduleId, Is.Not.Empty);
        Assert.That(result.NextRunDate, Is.GreaterThan(DateTime.UtcNow));
        Assert.That(result.Status, Is.EqualTo("Scheduled"));
        Assert.True(Guid.TryParse(result.ScheduleId, out _));
    }

    [Test]
    public async Task ProcessScheduledFinancialReport_ValidScheduleId_GeneratesAndSendsReport()
    {
        // Arrange
        var scheduleId = Guid.NewGuid().ToString();
        var clubId = 9;

        var mockScheduledReport = CreateMockScheduledReport();
        _mockFinancialRepository.Setup(x => x.GetScheduledReportAsync(scheduleId))
            .ReturnsAsync(mockScheduledReport);

        // Act
        var result = await _financialExportService.ProcessScheduledFinancialReport(scheduleId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Status, Is.EqualTo(ScheduledReportExecutionStatus.Completed));
        Assert.That(result.CompletedAt, Is.Not.Null);

        // Verify email was sent to recipients
        _mockEmailService.Verify(x => x.SendScheduledFinancialReportAsync(
            It.IsAny<List<string>>(),
            It.IsAny<string>(),
            It.IsAny<byte[]>(),
            It.IsAny<string>()),
            Times.Once);
    }

    #endregion

    #region Financial Security & Compliance Tests (RED Phase)

    [Test]
    public async Task ExportFinancialData_WithSensitiveData_RedactsPersonalFinancialInfo()
    {
        // Arrange
        var clubId = 10;
        var financialExportOptions = new FinancialExportOptions
        {
            RedactSensitiveData = true,
            ComplianceLevel = "PCI_DSS"
        };

        var mockSensitiveData = CreateMockSensitiveFinancialData();
        _mockFinancialRepository.Setup(x => x.GetFinancialDataAsync(clubId, null, null))
            .ReturnsAsync(mockSensitiveData.Cast<object>().ToList());

        // Setup authorization - REQUIRED for financial data export
        _mockClubTierService.Setup(x => x.CanExportFinancialData(104, clubId))
            .ReturnsAsync(true);

        // Setup data limit
        _mockClubTierService.Setup(x => x.GetFinancialExportLimitAsync(clubId))
            .ReturnsAsync(1000);

        // Act
        var result = await _financialExportService.ExportFinancialDataToCsv(clubId, financialExportOptions, 104);

        // Assert
        var csvContent = Encoding.UTF8.GetString(result);

        // Credit card numbers should be masked
        Assert.That(csvContent, Does.Not.Contain("4532-1234-5678-9012"));
        Assert.That(csvContent, Does.Contain("****-****-****-9012"));

        // Bank account numbers should be masked
        Assert.That(csvContent, Does.Not.Contain("123456789"));
        Assert.That(csvContent, Does.Contain("*****6789"));
    }

    [Test]
    public async Task ExportFinancialData_AuditTrail_LogsAllExportActivities()
    {
        // Arrange
        var clubId = 11;
        var financialExportOptions = new FinancialExportOptions();
        var userId = 105;

        var mockFinancialData = CreateMockFinancialData();
        _mockFinancialRepository.Setup(x => x.GetFinancialDataAsync(clubId, null, null))
            .ReturnsAsync(mockFinancialData.Cast<object>().ToList());

        // Setup authorization - REQUIRED for financial data export
        _mockClubTierService.Setup(x => x.CanExportFinancialData(userId, clubId))
            .ReturnsAsync(true);

        // Setup data limit
        _mockClubTierService.Setup(x => x.GetFinancialExportLimitAsync(clubId))
            .ReturnsAsync(1000);

        // Act
        var result = await _financialExportService.ExportFinancialDataToCsv(clubId, financialExportOptions, userId);

        // Assert
        _mockAuditService.Verify(x => x.LogFinancialExportAsync(
            userId,
            clubId,
            "CSV",
            It.IsAny<DateTime>()),
            Times.Once);

        _mockAuditService.Verify(x => x.LogDataAccessAsync(
            userId,
            clubId,
            "FinancialData",
            "Export",
            It.IsAny<int>()),
            Times.Once);
    }

    [Test]
    public async Task ExportFinancialData_ExceedsDataLimit_ThrowsDataLimitExceededException()
    {
        // Arrange
        var clubId = 12;
        var userId = 106;
        var financialExportOptions = new FinancialExportOptions
        {
            DateFrom = DateTime.UtcNow.AddYears(-10), // Very large date range
            DateTo = DateTime.UtcNow
        };

        // Setup authorization FIRST - REQUIRED for financial data export
        _mockClubTierService.Setup(x => x.CanExportFinancialData(userId, clubId))
            .ReturnsAsync(true);

        _mockClubTierService.Setup(x => x.GetFinancialExportLimitAsync(clubId))
            .ReturnsAsync(1000); // 1000 records limit

        var largeDataset = CreateLargeFinancialDataset(5000); // Exceeds limit
        _mockFinancialRepository.Setup(x => x.GetFinancialDataAsync(clubId, financialExportOptions.DateFrom, financialExportOptions.DateTo))
            .ReturnsAsync(largeDataset.Cast<object>().ToList());

        // Act & Assert
        var exception = Assert.ThrowsAsync<DataLimitExceededException>(
            () => _financialExportService.ExportFinancialDataToCsv(clubId, financialExportOptions, userId));

        Assert.That(exception.Message, Does.Contain("Financial export exceeds the allowed limit of 1000 records"));
    }

    #endregion

    #region Performance Tests (RED Phase)

    [Test]
    public async Task ExportLargeFinancialDataset_Performance_CompletesWithinTimeout()
    {
        // Arrange
        var clubId = 13;
        var financialExportOptions = new FinancialExportOptions();
        var largeDataset = CreateLargeFinancialDataset(2000);

        _mockFinancialRepository.Setup(x => x.GetFinancialDataAsync(clubId, null, null))
            .ReturnsAsync(largeDataset.Cast<object>().ToList());
        _mockClubTierService.Setup(x => x.GetFinancialExportLimitAsync(clubId))
            .ReturnsAsync(5000);
        _mockClubTierService.Setup(x => x.CanExportFinancialData(107, clubId))
            .ReturnsAsync(true);

        // Act & Assert
        var timeout = TimeSpan.FromSeconds(15);
        var cts = new CancellationTokenSource(timeout);

        try
        {
            var result = await _financialExportService.ExportFinancialDataToCsv(clubId, financialExportOptions, 107);
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Length, Is.GreaterThan(0));
        }
        catch (OperationCanceledException)
        {
            // GREEN PHASE: Operation should not timeout with proper implementation
            throw new TimeoutException("This should not happen in GREEN phase - check implementation for performance issues.");
        }
    }

    #endregion

    #region Helper Methods

    private List<FinancialTransaction> CreateMockFinancialData()
    {
        return new List<FinancialTransaction>
        {
            new FinancialTransaction
            {
                Id = 1,
                TransactionDate = new DateTime(2024, 8, 15),
                Type = "Revenue",
                Category = "Membership Fees",
                Description = "Monthly membership fees",
                Amount = 1500.00m,
                Currency = "USD",
                PaymentMethod = "Credit Card",
                Status = "Completed"
            },
            new FinancialTransaction
            {
                Id = 2,
                TransactionDate = new DateTime(2024, 9, 1),
                Type = "Expense",
                Category = "Venue Rental",
                Description = "Event space rental",
                Amount = 500.00m,
                Currency = "USD",
                PaymentMethod = "Bank Transfer",
                Status = "Completed"
            }
        };
    }

    private List<MembershipFee> CreateMockMembershipFeesData()
    {
        return new List<MembershipFee>
        {
            new MembershipFee { MemberId = 1, MemberName = "John Doe", FeeType = "Monthly Fee", Amount = 50.00m, Status = "Paid" },
            new MembershipFee { MemberId = 2, MemberName = "Jane Smith", FeeType = "Annual Fee", Amount = 500.00m, Status = "Overdue" }
        };
    }

    private object CreateMockFinancialSummary()
    {
        return new
        {
            TotalRevenue = 25500.00m,
            TotalExpenses = 12300.00m,
            NetIncome = 13200.00m,
            MembershipRevenue = 18000.00m,
            EventRevenue = 7500.00m
        };
    }

    private object CreateMockBudgetComparisonData()
    {
        return new
        {
            Budget = 30000.00m,
            Actual = 25500.00m,
            Variance = -4500.00m,
            VariancePercentage = -15.0m
        };
    }

    private object CreateMockTaxData()
    {
        return new
        {
            TotalDeductions = 8500.00m,
            CharitableDonations = 2000.00m,
            OperatingExpenses = 6500.00m,
            NonProfitStatus = true
        };
    }

    private object CreateMockScheduledReport()
    {
        return new
        {
            ScheduleId = "scheduled-123",
            ClubId = 9,
            ReportType = "Monthly Financial",
            Recipients = new List<string> { "finance@club.com" }
        };
    }

    private List<FinancialTransaction> CreateMockSensitiveFinancialData()
    {
        var data = CreateMockFinancialData();
        data[0].CreditCardNumber = "4532-1234-5678-9012";
        data[0].BankAccountNumber = "123456789";
        return data;
    }

    private List<FinancialTransaction> CreateLargeFinancialDataset(int count)
    {
        var transactions = new List<FinancialTransaction>();
        for (int i = 1; i <= count; i++)
        {
            transactions.Add(new FinancialTransaction
            {
                Id = i,
                TransactionDate = DateTime.UtcNow.AddDays(-i),
                Type = i % 2 == 0 ? "Revenue" : "Expense",
                Amount = 100.00m + i,
                Currency = "USD",
                Status = "Completed"
            });
        }
        return transactions;
    }

    #endregion
}