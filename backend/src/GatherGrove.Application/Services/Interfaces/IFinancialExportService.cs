using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Interface for financial export service operations
/// US-005 Data Export & Reporting Engine - Financial data export functionality
/// </summary>
public interface IFinancialExportService
{
    /// <summary>
    /// Export financial data to CSV format
    /// </summary>
    Task<byte[]> ExportFinancialDataToCsv(int clubId, FinancialExportOptions options, int userId);

    /// <summary>
    /// Export membership fees to CSV format
    /// </summary>
    Task<byte[]> ExportMembershipFeesToCsv(int clubId, FinancialExportOptions options);

    /// <summary>
    /// Export financial data to Excel format
    /// </summary>
    Task<byte[]> ExportFinancialDataToExcel(int clubId, FinancialExportOptions options, int userId);

    /// <summary>
    /// Export financial report to PDF format
    /// </summary>
    Task<byte[]> ExportFinancialReportToPdf(int clubId, FinancialExportOptions options, int userId);

    /// <summary>
    /// Export tax report to PDF format
    /// </summary>
    Task<byte[]> ExportTaxReportToPdf(int clubId, FinancialExportOptions options, int userId);

    /// <summary>
    /// Export financial data to JSON format
    /// </summary>
    Task<byte[]> ExportFinancialDataToJson(int clubId, FinancialExportOptions options);

    /// <summary>
    /// Schedule monthly financial report
    /// </summary>
    Task<ScheduledReportResult> ScheduleMonthlyFinancialReport(int clubId, ScheduledReportRequest request, int userId);

    /// <summary>
    /// Process scheduled financial report
    /// </summary>
    Task<ReportExecutionResult> ProcessScheduledFinancialReport(string scheduleId);

    /// <summary>
    /// Schedule a financial export with the given parameters
    /// </summary>
    Task<ExportResult> ScheduleFinancialExport(int clubId, ExportFormat format, FinancialExportOptions options, int userId, string userEmail);

    /// <summary>
    /// Export financial data with the specified request parameters
    /// </summary>
    Task<ExportResult> ExportFinancialDataAsync(int clubId, FinancialExportRequest request);
}