namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Options for financial data export
/// US-005 Data Export & Reporting Engine
/// </summary>
public class FinancialExportOptions
{
    /// <summary>
    /// Whether to include revenue data
    /// </summary>
    public bool IncludeRevenue { get; set; } = true;

    /// <summary>
    /// Whether to include expense data
    /// </summary>
    public bool IncludeExpenses { get; set; } = true;

    /// <summary>
    /// Whether to include membership fees
    /// </summary>
    public bool IncludeMembershipFees { get; set; } = true;

    /// <summary>
    /// Whether to include payment details
    /// </summary>
    public bool IncludePaymentDetails { get; set; } = false;

    /// <summary>
    /// Whether to include charts in reports
    /// </summary>
    public bool IncludeCharts { get; set; } = false;

    /// <summary>
    /// Whether to include summary information
    /// </summary>
    public bool IncludeSummary { get; set; } = false;

    /// <summary>
    /// Whether to include budget comparison
    /// </summary>
    public bool IncludeBudgetComparison { get; set; } = false;

    /// <summary>
    /// Whether to include variance analysis
    /// </summary>
    public bool IncludeVarianceAnalysis { get; set; } = false;

    /// <summary>
    /// Whether to include executive summary
    /// </summary>
    public bool IncludeExecutiveSummary { get; set; } = false;

    /// <summary>
    /// Whether to include detailed transactions
    /// </summary>
    public bool IncludeDetailedTransactions { get; set; } = false;

    /// <summary>
    /// Whether to include tax deductible expenses
    /// </summary>
    public bool IncludeTaxDeductibleExpenses { get; set; } = false;

    /// <summary>
    /// Whether to include non-profit documentation
    /// </summary>
    public bool IncludeNonProfitDocumentation { get; set; } = false;

    /// <summary>
    /// Whether to include metadata
    /// </summary>
    public bool IncludeMetadata { get; set; } = false;

    /// <summary>
    /// Whether to include API compatible format
    /// </summary>
    public bool IncludeApiCompatibleFormat { get; set; } = false;

    /// <summary>
    /// Whether to redact sensitive data
    /// </summary>
    public bool RedactSensitiveData { get; set; } = false;

    /// <summary>
    /// Start date for data range
    /// </summary>
    public DateTime? DateFrom { get; set; }

    /// <summary>
    /// End date for data range
    /// </summary>
    public DateTime? DateTo { get; set; }

    /// <summary>
    /// Currency for financial data
    /// </summary>
    public string Currency { get; set; } = "USD";

    /// <summary>
    /// Report type (Annual, Monthly, Tax, etc.)
    /// </summary>
    public string ReportType { get; set; } = "Standard";

    /// <summary>
    /// Budget year for comparison
    /// </summary>
    public int BudgetYear { get; set; }

    /// <summary>
    /// Tax year for tax reports
    /// </summary>
    public int TaxYear { get; set; }

    /// <summary>
    /// Compliance level (PCI_DSS, etc.)
    /// </summary>
    public string ComplianceLevel { get; set; } = string.Empty;
}