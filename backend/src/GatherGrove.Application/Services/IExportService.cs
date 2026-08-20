using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for exporting analytics data to various formats
/// </summary>
public interface IExportService
{
    /// <summary>
    /// Export analytics data to PDF format
    /// </summary>
    Task<byte[]> ExportToPdfAsync(ExportAnalyticsRequest request, int userId);

    /// <summary>
    /// Export analytics data to Excel format
    /// </summary>
    Task<byte[]> ExportToExcelAsync(ExportAnalyticsRequest request, int userId);

    /// <summary>
    /// Export analytics data to CSV format
    /// </summary>
    Task<byte[]> ExportToCsvAsync(ExportAnalyticsRequest request, int userId);
}