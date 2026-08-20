using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Financial transaction model for export
/// </summary>
public class FinancialTransaction
{
    public int Id { get; set; }
    public DateTime TransactionDate { get; set; }

    [StringLength(50, ErrorMessage = "Type cannot exceed 50 characters")]
    public string Type { get; set; } = string.Empty;

    [StringLength(100, ErrorMessage = "Category cannot exceed 100 characters")]
    public string Category { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    [StringLength(10, ErrorMessage = "Currency cannot exceed 10 characters")]
    public string Currency { get; set; } = "USD";

    [StringLength(50, ErrorMessage = "Payment method cannot exceed 50 characters")]
    public string PaymentMethod { get; set; } = string.Empty;

    [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters")]
    public string Status { get; set; } = string.Empty;

    [StringLength(4, ErrorMessage = "Credit card number cannot exceed 4 characters")]
    public string? CreditCardNumber { get; set; }

    [StringLength(4, ErrorMessage = "Bank account number cannot exceed 4 characters")]
    public string? BankAccountNumber { get; set; }
}

/// <summary>
/// Membership fee model for export
/// </summary>
public class MembershipFee
{
    public int MemberId { get; set; }

    [StringLength(100, ErrorMessage = "Member name cannot exceed 100 characters")]
    public string MemberName { get; set; } = string.Empty;

    [StringLength(100, ErrorMessage = "Fee type cannot exceed 100 characters")]
    public string FeeType { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? PaidDate { get; set; }

    [StringLength(50, ErrorMessage = "Payment method cannot exceed 50 characters")]
    public string PaymentMethod { get; set; } = string.Empty;

    [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters")]
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Member model for export
/// </summary>
public class Member
{
    public int Id { get; set; }

    [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
    public string FirstName { get; set; } = string.Empty;

    [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
    public string LastName { get; set; } = string.Empty;

    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string Email { get; set; } = string.Empty;

    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
    public string? PhoneNumber { get; set; }

    [StringLength(100, ErrorMessage = "Membership type cannot exceed 100 characters")]
    public string MembershipType { get; set; } = string.Empty;

    public DateTime JoinDate { get; set; }

    [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters")]
    public string Status { get; set; } = string.Empty;

    public DateTime? LastActive { get; set; }

    [StringLength(11, ErrorMessage = "SSN cannot exceed 11 characters")]
    public string? SSN { get; set; }

    public Dictionary<string, object>? CustomFields { get; set; }
}

/// <summary>
/// Export member model for filtered data export
/// </summary>
public class ExportMember
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MembershipType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Report execution history for scheduled reports
/// </summary>
public class ReportExecutionHistory
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ScheduleId { get; set; } = string.Empty;
    public DateTime ExecutedAt { get; set; }
    public ScheduledReportExecutionStatus Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public long? ReportSizeBytes { get; set; }
    public int ExecutionTimeSeconds { get; set; }
    public string? ErrorMessage { get; set; }
    public string? JobId { get; set; }
}

/// <summary>
/// Event trend analysis model for export
/// </summary>
public class EventTrendAnalysis
{
    public int ClubId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalEvents { get; set; }
    public double AverageAttendance { get; set; }
    public Dictionary<string, int> EventTypeBreakdown { get; set; } = new();
    public List<MonthlyEventData> MonthlyData { get; set; } = new();
    public int TotalRsvps { get; set; }
    public int TotalAttendance { get; set; }
    public double AverageAttendanceRate { get; set; }
}

/// <summary>
/// Monthly event summary model for export
/// </summary>
public class MonthlyEventSummary
{
    public int ClubId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public int TotalEvents { get; set; }
    public int TotalAttendees { get; set; }
    public double AverageAttendanceRate { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalRsvps { get; set; }
    public int TotalAttendance { get; set; }
}

/// <summary>
/// Monthly event data for trends
/// </summary>
public class MonthlyEventData
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int EventCount { get; set; }
    public int AttendeeCount { get; set; }
    public double AttendanceRate { get; set; }
}