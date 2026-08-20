using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for financial data access
/// Returns anonymous objects matching DTO structures to avoid circular dependencies
/// </summary>
public class FinancialRepository : IFinancialRepository
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<FinancialRepository> _logger;

    public FinancialRepository(GatherGroveDbContext context, ILogger<FinancialRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<object>> GetFinancialDataAsync(int clubId, DateTime? dateFrom, DateTime? dateTo)
    {
        _logger.LogInformation("Getting financial data for club {ClubId} from {DateFrom} to {DateTo}", clubId, dateFrom, dateTo);

        // Get all payments as financial transactions
        var query = _context.Payments
            .Include(p => p.Member)
            .Where(p => p.ClubId == clubId);

        // Apply date filtering if provided
        if (dateFrom.HasValue)
        {
            query = query.Where(p => p.PaymentDate >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(p => p.PaymentDate <= dateTo.Value);
        }

        var payments = await query
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        // Map payments to anonymous objects matching FinancialTransaction DTO structure
        return payments.Select(p => (object)new
        {
            Id = p.PaymentId,
            TransactionDate = p.PaymentDate,
            Type = "Payment",
            Category = "Membership Dues",
            Description = $"Payment from {p.Member?.FullName ?? "Unknown"}",
            Amount = p.Amount,
            Currency = "USD",
            PaymentMethod = p.PaymentMethod,
            Status = "Completed"
        }).ToList();
    }

    public async Task<List<object>> GetMembershipFeesAsync(int clubId, DateTime? dateFrom, DateTime? dateTo)
    {
        _logger.LogInformation("Getting membership fees for club {ClubId} from {DateFrom} to {DateTo}", clubId, dateFrom, dateTo);

        var query = _context.Payments
            .Include(p => p.Member)
                .ThenInclude(m => m.MembershipType)
            .Where(p => p.ClubId == clubId);

        // Apply date filtering if provided
        if (dateFrom.HasValue)
        {
            query = query.Where(p => p.PaymentDate >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(p => p.PaymentDate <= dateTo.Value);
        }

        var payments = await query
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        // Map to anonymous objects matching MembershipFee DTO structure
        return payments.Select(p => (object)new
        {
            MemberId = p.MemberId,
            MemberName = p.Member?.FullName ?? "Unknown",
            FeeType = p.Member?.MembershipType?.Name ?? "Regular Membership",
            Amount = p.Amount,
            DueDate = p.Member?.DuesPaidUntil,
            PaidDate = p.PaymentDate,
            PaymentMethod = p.PaymentMethod,
            Status = p.Member?.DuesPaidUntil >= DateTime.UtcNow ? "Paid" : "Overdue"
        }).ToList();
    }

    public async Task<dynamic> GetFinancialSummaryAsync(int clubId, DateTime? dateFrom, DateTime? dateTo)
    {
        _logger.LogInformation("Getting financial summary for club {ClubId} from {DateFrom} to {DateTo}", clubId, dateFrom, dateTo);

        // Get all payments (membership fees) for the period
        var paymentsQuery = _context.Payments
            .Where(p => p.ClubId == clubId);

        if (dateFrom.HasValue)
        {
            paymentsQuery = paymentsQuery.Where(p => p.PaymentDate >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            paymentsQuery = paymentsQuery.Where(p => p.PaymentDate <= dateTo.Value);
        }

        var totalMembershipFees = await paymentsQuery.SumAsync(p => (decimal?)p.Amount) ?? 0m;

        // Note: For now, we only track membership fees (Payments table)
        // Event revenue would come from EventPayment table (not yet in scope)
        // Expenses would come from Expense table (not yet in scope)
        var totalRevenue = totalMembershipFees;
        var totalExpenses = 0m; // Placeholder for future expense tracking
        var eventRevenue = 0m;   // Placeholder for future event payment tracking

        return await Task.FromResult(new
        {
            TotalRevenue = totalRevenue,
            TotalExpenses = totalExpenses,
            NetIncome = totalRevenue - totalExpenses,
            MembershipFees = totalMembershipFees,
            EventRevenue = eventRevenue
        });
    }

    public async Task<dynamic> GetBudgetComparisonAsync(int clubId, int budgetYear)
    {
        _logger.LogInformation("Getting budget comparison for club {ClubId} for year {BudgetYear}", clubId, budgetYear);

        // Calculate actual spending for the year
        var yearStart = new DateTime(budgetYear, 1, 1);
        var yearEnd = new DateTime(budgetYear, 12, 31, 23, 59, 59);

        var actualRevenue = await _context.Payments
            .Where(p => p.ClubId == clubId &&
                       p.PaymentDate >= yearStart &&
                       p.PaymentDate <= yearEnd)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        // Note: Budget entities don't exist yet in the database
        // This is a placeholder implementation
        var plannedBudget = 0m; // Would come from Budget table
        var variance = actualRevenue - plannedBudget;

        return await Task.FromResult(new
        {
            BudgetYear = budgetYear,
            PlannedBudget = plannedBudget,
            ActualSpending = actualRevenue,
            Variance = variance,
            VariancePercentage = plannedBudget > 0 ? (variance / plannedBudget * 100) : 0m
        });
    }

    public async Task<dynamic> GetTaxDataAsync(int clubId, int taxYear)
    {
        _logger.LogInformation("Getting tax data for club {ClubId} for year {TaxYear}", clubId, taxYear);

        // Calculate income for the tax year
        var yearStart = new DateTime(taxYear, 1, 1);
        var yearEnd = new DateTime(taxYear, 12, 31, 23, 59, 59);

        var totalIncome = await _context.Payments
            .Where(p => p.ClubId == clubId &&
                       p.PaymentDate >= yearStart &&
                       p.PaymentDate <= yearEnd)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        // Note: Expense tracking not yet implemented
        var deductibleExpenses = 0m; // Would come from Expense table with tax-deductible flag

        return await Task.FromResult(new
        {
            TaxYear = taxYear,
            TotalIncome = totalIncome,
            DeductibleExpenses = deductibleExpenses,
            TaxableIncome = totalIncome - deductibleExpenses,
            PaymentMethodBreakdown = await _context.Payments
                .Where(p => p.ClubId == clubId &&
                           p.PaymentDate >= yearStart &&
                           p.PaymentDate <= yearEnd)
                .GroupBy(p => p.PaymentMethod)
                .Select(g => new { Method = g.Key, Amount = g.Sum(p => p.Amount) })
                .ToListAsync()
        });
    }

    public async Task<dynamic> GetScheduledReportAsync(string scheduleId)
    {
        _logger.LogInformation("Getting scheduled report {ScheduleId}", scheduleId);

        // Query the scheduled reports table
        var report = await _context.ScheduledReports
            .Where(r => r.Id == scheduleId)
            .Select(r => new
            {
                ScheduleId = r.Id,
                ClubId = r.ClubId,
                ReportName = r.ReportName,
                ReportType = r.ReportType,
                Format = r.Format.ToString(),
                Frequency = r.Frequency.ToString(),
                NextRunDate = r.NextRunDate,
                LastExecuted = r.LastExecuted,
                IsActive = r.IsActive,
                Recipients = r.Recipients,
                DeliveryTime = r.DeliveryTime,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (report == null)
        {
            _logger.LogWarning("Scheduled report {ScheduleId} not found", scheduleId);
            return await Task.FromResult(new
            {
                ScheduleId = scheduleId,
                ReportType = "Financial",
                Status = "Not Found"
            });
        }

        return report;
    }
}
