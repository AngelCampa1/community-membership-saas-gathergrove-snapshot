using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Request DTO for financial data export operations
/// US-005 Data Export & Reporting Engine - Financial export request model
/// </summary>
public class FinancialExportRequest
{
    /// <summary>
    /// Export format (CSV, Excel, PDF, JSON)
    /// </summary>
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Type of financial report to generate
    /// </summary>
    public string ReportType { get; set; } = string.Empty;

    /// <summary>
    /// Include revenue data in export
    /// </summary>
    public bool IncludeRevenue { get; set; }

    /// <summary>
    /// Include expense data in export
    /// </summary>
    public bool IncludeExpenses { get; set; }

    /// <summary>
    /// Start date for financial data range
    /// </summary>
    public DateTime DateFrom { get; set; }

    /// <summary>
    /// End date for financial data range
    /// </summary>
    public DateTime DateTo { get; set; }

    /// <summary>
    /// Include membership fees in export
    /// </summary>
    public bool IncludeMembershipFees { get; set; }

    /// <summary>
    /// Include donations in export
    /// </summary>
    public bool IncludeDonations { get; set; }

    /// <summary>
    /// Include event revenue in export
    /// </summary>
    public bool IncludeEventRevenue { get; set; }

    /// <summary>
    /// Currency for financial data
    /// </summary>
    public string Currency { get; set; } = "USD";

    /// <summary>
    /// Include tax-related information
    /// </summary>
    public bool IncludeTaxInfo { get; set; }

    /// <summary>
    /// Group data by category
    /// </summary>
    public bool GroupByCategory { get; set; }

    /// <summary>
    /// Custom notes for the export
    /// </summary>
    public string Notes { get; set; } = string.Empty;
}