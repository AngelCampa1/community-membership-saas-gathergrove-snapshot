namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for financial data access
/// Methods return dynamic or anonymous objects matching DTO structures to avoid circular dependencies
/// </summary>
public interface IFinancialRepository
{
    /// <summary>
    /// Gets financial transaction data (returns list matching FinancialTransaction DTO structure)
    /// </summary>
    Task<List<object>> GetFinancialDataAsync(int clubId, DateTime? dateFrom, DateTime? dateTo);

    /// <summary>
    /// Gets membership fee data (returns list matching MembershipFee DTO structure)
    /// </summary>
    Task<List<object>> GetMembershipFeesAsync(int clubId, DateTime? dateFrom, DateTime? dateTo);

    /// <summary>
    /// Gets financial summary (returns anonymous object matching summary structure)
    /// </summary>
    Task<dynamic> GetFinancialSummaryAsync(int clubId, DateTime? dateFrom, DateTime? dateTo);

    /// <summary>
    /// Gets budget comparison data (returns anonymous object matching comparison structure)
    /// </summary>
    Task<dynamic> GetBudgetComparisonAsync(int clubId, int budgetYear);

    /// <summary>
    /// Gets tax data (returns anonymous object matching tax data structure)
    /// </summary>
    Task<dynamic> GetTaxDataAsync(int clubId, int taxYear);

    /// <summary>
    /// Gets scheduled report data (returns anonymous object matching report structure)
    /// </summary>
    Task<dynamic> GetScheduledReportAsync(string scheduleId);
}
