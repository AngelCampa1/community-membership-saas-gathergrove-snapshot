using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Enums;
using GatherGrove.Application.DTOs.Analytics;
using GatherGrove.Domain.Enums;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;
using GatherGrove.Domain.Models;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Tests.Fixtures;

/// <summary>
/// Test data fixtures for export functionality
/// Provides comprehensive test data for all data categories
/// RED PHASE: Define data structures that will be used in comprehensive tests
/// </summary>
public static class ExportTestDataFixtures
{
    #region Member Data Fixtures

    /// <summary>
    /// Generate large member dataset for performance testing
    /// </summary>
    public static List<Member> GenerateLargeMemberDataset(int count = 10000)
    {
        var members = new List<Member>();
        var random = new Random(42); // Fixed seed for consistent tests

        for (int i = 1; i <= count; i++)
        {
            members.Add(new Member
            {
                Id = i,
                FirstName = $"FirstName{i}",
                LastName = $"LastName{i}",
                Email = $"member{i}@testclub.com",
                PhoneNumber = $"555-{i:D4}",
                JoinDate = DateTime.UtcNow.AddDays(-random.Next(1, 1000)),
                MembershipType = GetRandomMembershipType(random),
                IsActive = random.NextDouble() > 0.1, // 90% active
                DateOfBirth = DateTime.UtcNow.AddYears(-random.Next(18, 80)),
                Address = $"{i} Test Street, Test City, TC {i:D5}",
                EmergencyContact = $"Emergency{i}@test.com",
                MembershipStartDate = DateTime.UtcNow.AddDays(-random.Next(1, 365)),
                LastLoginDate = DateTime.UtcNow.AddDays(-random.Next(0, 30))
            });
        }

        return members;
    }

    /// <summary>
    /// Member data with privacy-sensitive information for security testing
    /// </summary>
    public static List<Member> GeneratePrivacySensitiveMemberData()
    {
        return new List<Member>
        {
            new Member
            {
                Id = 1,
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@sensitive.com",
                PhoneNumber = "555-SENSITIVE",
                SocialSecurityNumber = "123-45-6789", // Highly sensitive
                BankAccountNumber = "ACC-123456789", // Highly sensitive
                CreditCardNumber = "4111-1111-1111-1111", // Highly sensitive
                DateOfBirth = new DateTime(1985, 5, 15),
                Address = "123 Privacy Lane, Secure City, SC 12345",
                MedicalInformation = "Allergic to peanuts", // Sensitive health data
                IsActive = true
            },
            new Member
            {
                Id = 2,
                FirstName = "Jane",
                LastName = "Smith",
                Email = "jane.smith@private.com",
                PhoneNumber = "555-PRIVATE",
                SocialSecurityNumber = "987-65-4321",
                BankAccountNumber = "ACC-987654321",
                CreditCardNumber = "5555-5555-5555-4444",
                DateOfBirth = new DateTime(1990, 8, 22),
                Address = "456 Confidential Ave, Private Town, PT 54321",
                MedicalInformation = "Diabetic",
                IsActive = true
            }
        };
    }

    private static string GetRandomMembershipType(Random random)
    {
        var types = new[] { "Basic", "Premium", "Unlimited", "Student", "Senior" };
        return types[random.Next(types.Length)];
    }

    #endregion

    #region Event Data Fixtures

    /// <summary>
    /// Generate large event dataset for performance testing
    /// </summary>
    public static List<Event> GenerateLargeEventDataset(int count = 5000)
    {
        var events = new List<Event>();
        var random = new Random(42);
        var eventTypes = new[] { "Meeting", "Workshop", "Social", "Training", "Conference" };

        for (int i = 1; i <= count; i++)
        {
            var startDate = DateTime.UtcNow.AddDays(-random.Next(0, 365));
            events.Add(new Event
            {
                Id = i,
                Title = $"Event {i}: {eventTypes[random.Next(eventTypes.Length)]}",
                Description = $"This is a detailed description for event {i}. It includes comprehensive information about the event objectives, agenda, and expected outcomes.",
                StartDate = startDate,
                EndDate = startDate.AddHours(random.Next(1, 8)),
                Location = $"Venue {i % 10}",
                MaxAttendees = random.Next(10, 200),
                CurrentAttendees = random.Next(0, 200),
                EventType = eventTypes[random.Next(eventTypes.Length)],
                IsPublic = random.NextDouble() > 0.3, // 70% public
                RegistrationDeadline = startDate.AddDays(-random.Next(1, 14)),
                Cost = random.NextDouble() > 0.5 ? random.Next(0, 100) : 0, // 50% free events
                CreatedDate = startDate.AddDays(-random.Next(15, 60)),
                CreatedById = random.Next(1, 100)
            });
        }

        return events;
    }

    /// <summary>
    /// Event data with RSVPs for engagement analytics
    /// </summary>
    public static List<EventWithAnalytics> GenerateEventAnalyticsData()
    {
        return new List<EventWithAnalytics>
        {
            new EventWithAnalytics
            {
                EventId = 1,
                Title = "Monthly Board Meeting",
                StartDate = DateTime.UtcNow.AddDays(-30),
                MaxAttendees = 50,
                ActualAttendees = 45,
                RSVPCount = 48,
                CheckInRate = 0.938, // 45/48
                EngagementScore = 8.5,
                FeedbackCount = 12,
                AverageRating = 4.2,
                NoShowCount = 3,
                LateArrivals = 5,
                EarlyDepartures = 2
            },
            new EventWithAnalytics
            {
                EventId = 2,
                Title = "Workshop: Leadership Skills",
                StartDate = DateTime.UtcNow.AddDays(-15),
                MaxAttendees = 30,
                ActualAttendees = 28,
                RSVPCount = 32,
                CheckInRate = 0.875, // 28/32
                EngagementScore = 9.1,
                FeedbackCount = 25,
                AverageRating = 4.7,
                NoShowCount = 4,
                LateArrivals = 2,
                EarlyDepartures = 1
            }
        };
    }

    #endregion

    #region Financial Data Fixtures

    /// <summary>
    /// Generate financial data with sensitive information for security testing
    /// </summary>
    public static List<FinancialRecord> GenerateSensitiveFinancialData()
    {
        return new List<FinancialRecord>
        {
            new FinancialRecord
            {
                Id = 1,
                TransactionDate = DateTime.UtcNow.AddDays(-5),
                Amount = 1500.00m,
                TransactionType = "Income",
                Category = "Membership Fees",
                Description = "Monthly membership fees collection",
                AccountNumber = "ACC-MAIN-001", // Sensitive
                BankRoutingNumber = "123456789", // Sensitive
                CheckNumber = "CHK-001234",
                PaymentMethod = "Bank Transfer",
                VendorTaxId = "12-3456789", // Sensitive
                InternalNotes = "Large cash deposit from annual membership drive"
            },
            new FinancialRecord
            {
                Id = 2,
                TransactionDate = DateTime.UtcNow.AddDays(-10),
                Amount = -850.00m,
                TransactionType = "Expense",
                Category = "Facility Maintenance",
                Description = "Monthly cleaning and maintenance services",
                AccountNumber = "ACC-MAIN-001",
                BankRoutingNumber = "123456789",
                CheckNumber = "CHK-001235",
                PaymentMethod = "Check",
                VendorTaxId = "98-7654321",
                InternalNotes = "Quarterly maintenance contract payment"
            }
        };
    }

    /// <summary>
    /// Generate large financial dataset for performance testing
    /// </summary>
    public static List<FinancialRecord> GenerateLargeFinancialDataset(int count = 50000)
    {
        var records = new List<FinancialRecord>();
        var random = new Random(42);
        var categories = new[] { "Membership Fees", "Event Revenue", "Donations", "Facility Costs", "Marketing", "Insurance", "Utilities" };
        var paymentMethods = new[] { "Cash", "Check", "Credit Card", "Bank Transfer", "PayPal" };

        for (int i = 1; i <= count; i++)
        {
            var isIncome = random.NextDouble() > 0.4; // 60% income, 40% expenses
            records.Add(new FinancialRecord
            {
                Id = i,
                TransactionDate = DateTime.UtcNow.AddDays(-random.Next(0, 1095)), // 3 years of data
                Amount = isIncome ? random.Next(10, 1000) : -random.Next(10, 1000),
                TransactionType = isIncome ? "Income" : "Expense",
                Category = categories[random.Next(categories.Length)],
                Description = $"Transaction {i} - {(isIncome ? "Revenue" : "Expense")} item",
                AccountNumber = $"ACC-{random.Next(1, 5):D3}",
                PaymentMethod = paymentMethods[random.Next(paymentMethods.Length)],
                CheckNumber = random.NextDouble() > 0.7 ? $"CHK-{i:D6}" : null
            });
        }

        return records;
    }

    #endregion

    #region Analytics Data Fixtures

    /// <summary>
    /// Generate comprehensive analytics data for export testing
    /// </summary>
    public static AnalyticsData GenerateComprehensiveAnalyticsData()
    {
        return new AnalyticsData
        {
            Period = new AnalyticsPeriod
            {
                StartDate = DateTime.UtcNow.AddMonths(-12),
                EndDate = DateTime.UtcNow,
                PeriodType = "Annual"
            },
            MembershipMetrics = new MembershipMetrics
            {
                TotalMembers = 1250,
                ActiveMembers = 1125,
                NewMembers = 185,
                ChurnedMembers = 62,
                RetentionRate = 0.925,
                GrowthRate = 0.148,
                AverageEngagementScore = 7.8,
                MembershipTypeDistribution = new Dictionary<string, int>
                {
                    { "Basic", 450 },
                    { "Premium", 380 },
                    { "Unlimited", 295 },
                    { "Student", 95 },
                    { "Senior", 30 }
                }
            },
            EventMetrics = new EventMetrics
            {
                TotalEvents = 156,
                TotalAttendees = 3420,
                AverageAttendanceRate = 0.825,
                PopularEventTypes = new Dictionary<string, int>
                {
                    { "Workshop", 45 },
                    { "Social", 38 },
                    { "Meeting", 32 },
                    { "Training", 28 },
                    { "Conference", 13 }
                },
                AverageEventRating = 4.3,
                EventSatisfactionScore = 0.86
            },
            FinancialMetrics = new FinancialMetrics
            {
                TotalRevenue = 125750.00m,
                TotalExpenses = 89230.00m,
                NetIncome = 36520.00m,
                ProfitMargin = 0.291,
                RevenueByCategory = new Dictionary<string, decimal>
                {
                    { "Membership Fees", 89500.00m },
                    { "Event Revenue", 24750.00m },
                    { "Donations", 8200.00m },
                    { "Merchandise", 3300.00m }
                },
                ExpensesByCategory = new Dictionary<string, decimal>
                {
                    { "Facility Costs", 35200.00m },
                    { "Staff Salaries", 28900.00m },
                    { "Marketing", 12800.00m },
                    { "Insurance", 7200.00m },
                    { "Utilities", 5130.00m }
                }
            },
            EngagementMetrics = new EngagementMetrics
            {
                WebsiteVisits = 45620,
                EmailOpenRate = 0.68,
                EmailClickRate = 0.12,
                SocialMediaEngagement = 2840,
                AppUsageMinutes = 892450,
                MemberFeedbackScore = 4.1,
                ComplaintCount = 23,
                ComplimentCount = 156
            }
        };
    }

    #endregion

    #region Export Request Fixtures

    /// <summary>
    /// Generate various export request scenarios for testing
    /// </summary>
    public static List<ExportAnalyticsRequest> GenerateExportRequestScenarios()
    {
        return new List<ExportAnalyticsRequest>
        {
            // Basic analytics export
            new ExportAnalyticsRequest
            {
                ClubId = 1,
                StartDate = DateTime.UtcNow.AddMonths(-3),
                EndDate = DateTime.UtcNow,
                ExportType = "basic-analytics",
                DataType = "analytics",
                ExportFormat = "PDF"
            },
            // Large date range for performance testing
            new ExportAnalyticsRequest
            {
                ClubId = 2,
                StartDate = DateTime.UtcNow.AddYears(-5),
                EndDate = DateTime.UtcNow,
                ExportType = "historical-analysis",
                DataType = "comprehensive",
                ExportFormat = "Excel"
            },
            // Member data export
            new ExportAnalyticsRequest
            {
                ClubId = 3,
                StartDate = DateTime.UtcNow.AddMonths(-12),
                EndDate = DateTime.UtcNow,
                ExportType = "member-analytics",
                DataType = "members",
                ExportFormat = "CSV"
            },
            // Financial data export
            new ExportAnalyticsRequest
            {
                ClubId = 4,
                StartDate = DateTime.UtcNow.AddMonths(-6),
                EndDate = DateTime.UtcNow,
                ExportType = "financial-report",
                DataType = "financial",
                ExportFormat = "PDF"
            }
        };
    }

    /// <summary>
    /// Generate advanced export requests with custom filters
    /// </summary>
    public static List<AdvancedExportAnalyticsRequest> GenerateAdvancedExportRequests()
    {
        return new List<AdvancedExportAnalyticsRequest>
        {
            new AdvancedExportAnalyticsRequest
            {
                ClubId = 1,
                StartDate = DateTime.UtcNow.AddMonths(-6),
                EndDate = DateTime.UtcNow,
                IncludeCharts = true,
                IncludeDetailedMetrics = true,
                CustomFilters = new Dictionary<string, object>
                {
                    { "membershipType", "Premium" },
                    { "eventType", "Workshop" },
                    { "minEngagementScore", 7.0 }
                },
                ExportFormat = "PDF",
                IncludePrivacySensitiveData = false // Privacy compliance
            },
            new AdvancedExportAnalyticsRequest
            {
                ClubId = 2,
                StartDate = DateTime.UtcNow.AddYears(-2),
                EndDate = DateTime.UtcNow,
                IncludeCharts = false,
                IncludeDetailedMetrics = true,
                CustomFilters = new Dictionary<string, object>
                {
                    { "revenueThreshold", 1000.00m },
                    { "department", "Finance" }
                },
                ExportFormat = "Excel",
                IncludePrivacySensitiveData = true // Requires elevated permissions
            }
        };
    }

    #endregion

    #region Performance Test Data

    /// <summary>
    /// Generate data for concurrent export performance testing
    /// </summary>
    public static List<ConcurrentExportRequest> GenerateConcurrentExportRequests(int concurrentCount = 10)
    {
        var requests = new List<ConcurrentExportRequest>();
        var random = new Random(42);
        var formats = new[] { "PDF", "Excel", "CSV", "JSON" };
        var dataTypes = new[] { "members", "events", "financial", "analytics" };

        for (int i = 1; i <= concurrentCount; i++)
        {
            requests.Add(new ConcurrentExportRequest
            {
                RequestId = i,
                ClubId = random.Next(1, 20),
                Format = formats[random.Next(formats.Length)],
                DataType = dataTypes[random.Next(dataTypes.Length)],
                StartDate = DateTime.UtcNow.AddMonths(-random.Next(1, 24)),
                EndDate = DateTime.UtcNow,
                Priority = random.Next(1, 5),
                ExpectedProcessingTimeMs = random.Next(1000, 30000)
            });
        }

        return requests;
    }

    #endregion
}

#region Supporting Data Models

/// <summary>
/// Member entity for test scenarios
/// </summary>
public class Member
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime JoinDate { get; set; }
    public string MembershipType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContact { get; set; }
    public DateTime? MembershipStartDate { get; set; }
    public DateTime? LastLoginDate { get; set; }

    // Sensitive data for privacy testing
    public string? SocialSecurityNumber { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? CreditCardNumber { get; set; }
    public string? MedicalInformation { get; set; }
}

/// <summary>
/// Event entity for test scenarios
/// </summary>
public class Event
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Location { get; set; } = string.Empty;
    public int MaxAttendees { get; set; }
    public int CurrentAttendees { get; set; }
    public string EventType { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public DateTime? RegistrationDeadline { get; set; }
    public decimal Cost { get; set; }
    public DateTime CreatedDate { get; set; }
    public int CreatedById { get; set; }
}

/// <summary>
/// Event with analytics data for testing engagement metrics
/// </summary>
public class EventWithAnalytics
{
    public int EventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public int MaxAttendees { get; set; }
    public int ActualAttendees { get; set; }
    public int RSVPCount { get; set; }
    public double CheckInRate { get; set; }
    public double EngagementScore { get; set; }
    public int FeedbackCount { get; set; }
    public double AverageRating { get; set; }
    public int NoShowCount { get; set; }
    public int LateArrivals { get; set; }
    public int EarlyDepartures { get; set; }
}

/// <summary>
/// Financial record for testing financial exports
/// </summary>
public class FinancialRecord
{
    public int Id { get; set; }
    public DateTime TransactionDate { get; set; }
    public decimal Amount { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string? BankRoutingNumber { get; set; }
    public string? CheckNumber { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? VendorTaxId { get; set; }
    public string? InternalNotes { get; set; }
}

/// <summary>
/// Comprehensive analytics data structure
/// </summary>
public class AnalyticsData
{
    public AnalyticsPeriod Period { get; set; } = new();
    public MembershipMetrics MembershipMetrics { get; set; } = new();
    public EventMetrics EventMetrics { get; set; } = new();
    public FinancialMetrics FinancialMetrics { get; set; } = new();
    public EngagementMetrics EngagementMetrics { get; set; } = new();
}

public class AnalyticsPeriod
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string PeriodType { get; set; } = string.Empty;
}

public class MembershipMetrics
{
    public int TotalMembers { get; set; }
    public int ActiveMembers { get; set; }
    public int NewMembers { get; set; }
    public int ChurnedMembers { get; set; }
    public double RetentionRate { get; set; }
    public double GrowthRate { get; set; }
    public double AverageEngagementScore { get; set; }
    public Dictionary<string, int> MembershipTypeDistribution { get; set; } = new();
}

public class EventMetrics
{
    public int TotalEvents { get; set; }
    public int TotalAttendees { get; set; }
    public double AverageAttendanceRate { get; set; }
    public Dictionary<string, int> PopularEventTypes { get; set; } = new();
    public double AverageEventRating { get; set; }
    public double EventSatisfactionScore { get; set; }
}

public class FinancialMetrics
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetIncome { get; set; }
    public double ProfitMargin { get; set; }
    public Dictionary<string, decimal> RevenueByCategory { get; set; } = new();
    public Dictionary<string, decimal> ExpensesByCategory { get; set; } = new();
}

public class EngagementMetrics
{
    public int WebsiteVisits { get; set; }
    public double EmailOpenRate { get; set; }
    public double EmailClickRate { get; set; }
    public int SocialMediaEngagement { get; set; }
    public int AppUsageMinutes { get; set; }
    public double MemberFeedbackScore { get; set; }
    public int ComplaintCount { get; set; }
    public int ComplimentCount { get; set; }
}

/// <summary>
/// Advanced export request with custom filtering
/// </summary>
public class AdvancedExportAnalyticsRequest
{
    public int ClubId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IncludeCharts { get; set; }
    public bool IncludeDetailedMetrics { get; set; }
    public Dictionary<string, object> CustomFilters { get; set; } = new();
    public string ExportFormat { get; set; } = string.Empty;
    public bool IncludePrivacySensitiveData { get; set; }
    #region CSV Test Data Methods

    /// <summary>
    /// Creates valid CSV data for testing
    /// </summary>
    public static string CreateValidCsvData()
    {
        return "Name,Email,Age,MembershipType,JoinDate\n" +
               "John Doe,john.doe@test.com,35,Premium,2023-01-15\n" +
               "Jane Smith,jane.smith@test.com,28,Basic,2023-02-20\n";
    }

    /// <summary>
    /// Creates valid CSV data with semicolon delimiter
    /// </summary>
    public static string CreateValidCsvDataWithSemicolonDelimiter()
    {
        return "Name;Email;Age;MembershipType\n" +
               "Alice Johnson;alice.johnson@test.com;42;Unlimited\n" +
               "Bob Wilson;bob.wilson@test.com;31;Premium\n";
    }

    /// <summary>
    /// Creates malformed CSV data for error testing
    /// </summary>
    public static string CreateMalformedCsvData()
    {
        return "Name,Email,Age,MembershipType\n" +
               "John Doe,john.doe@test.com,35\n" + // Missing column
               "Jane \"Smith,jane.smith@test.com,28,Basic\n" + // Unescaped quote
               "Alice Johnson,alice.johnson@test.com,42,Premium,Extra,TooMany\n"; // Too many columns
    }

    #endregion
}


/// <summary>
/// Concurrent export request for performance testing
/// </summary>
public class ConcurrentExportRequest
{
    public int RequestId { get; set; }
    public int ClubId { get; set; }
    public string Format { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Priority { get; set; }
    public int ExpectedProcessingTimeMs { get; set; }
}

#endregion
