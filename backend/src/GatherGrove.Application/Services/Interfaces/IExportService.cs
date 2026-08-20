using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Analytics;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Interface for analytics export service
/// </summary>
public interface IExportService
{
    // Simple interface methods (from Services/IExportService.cs)
    Task<byte[]> ExportToPdfAsync(ExportAnalyticsRequest request, int userId);
    Task<byte[]> ExportToExcelAsync(ExportAnalyticsRequest request, int userId);
    Task<byte[]> ExportToCsvAsync(ExportAnalyticsRequest request, int userId);

    // Legacy methods
    Task<byte[]> ExportAnalyticsToPDFAsync(AdvancedExportAnalyticsRequest request, int userId);
    Task<byte[]> ExportAnalyticsToExcelAsync(AdvancedExportAnalyticsRequest request, int userId);
    Task<byte[]> ExportAnalyticsToCSVAsync(AdvancedExportAnalyticsRequest request, int userId);

    // Methods required by tests - different signatures
    Task<byte[]> ExportAnalyticsToPDFAsync(ExportAnalyticsRequest request);
    Task<byte[]> ExportAnalyticsToExcelAsync(ExportAnalyticsRequest request);
    Task<byte[]> ExportAnalyticsToCSVAsync(ExportAnalyticsRequest request);

    // New method for the controller with authorization
    Task<ExportResponseDto> ExportDataAsync(int clubId, int userId, string dataType, string format, DateTime startDate, DateTime endDate);

    // Methods expected by TierAwareExportService wrapper (from tests)
    Task<ExportResult> ExportMembersAsync(int clubId, ExportFormat format, MemberExportOptions options);
    Task<ExportResult> ExportEventsAsync(int clubId, ExportFormat format, EventExportOptions options);
    Task<ExportResult> ExportFinancialDataAsync(int clubId, ExportFormat format, FinancialExportOptions options);
    Task<ExportResult> ExportAnalyticsDataAsync(int clubId, ExportFormat format, AnalyticsExportOptions options);

    // Methods expected by AuditTrail tests
    Task<ExportResult> ExportFinancialsAsync(GatherGrove.Application.DTOs.Export.ExportRequestDto exportRequest);
    Task<ExportResult> ExportMembersAsync(GatherGrove.Application.DTOs.Export.ExportRequestDto exportRequest);
    Task<ExportResult> ExportEventsAsync(GatherGrove.Application.DTOs.Export.ExportRequestDto exportRequest);
    Task<ExportResult> ExportAnalyticsAsync(GatherGrove.Application.DTOs.Export.ExportRequestDto exportRequest);
    Task<List<ExportHistoryItem>> GetExportHistoryAsync(int clubId, int limit = 50);
    Task<GatherGrove.Domain.Enums.ExportStatus> GetExportStatusAsync(string exportId, int clubId);
    Task<bool> CancelExportAsync(string exportId, int clubId);
    Task<Stream> DownloadExportAsync(string exportId, int clubId);
    Task<List<ExportFormatInfo>> GetAvailableFormatsAsync(string dataType);
    Task<ExportValidationResult> ValidateExportOptionsAsync(int clubId, string dataType, ExportFormat format, object options);
    Task<ExportQuota> GetExportQuotaAsync(int clubId);
    Task<string> ScheduleBackgroundExportAsync(int clubId, BackgroundExportRequest request);
}