using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Interface for member data export service operations
/// US-005 Data Export & Reporting Engine - Member data export functionality
/// </summary>
public interface IMemberDataExportService
{
    /// <summary>
    /// Export members to CSV format
    /// </summary>
    Task<byte[]> ExportMembersToCsv(int clubId, MemberExportOptions options);

    /// <summary>
    /// Export members to Excel format
    /// </summary>
    Task<byte[]> ExportMembersToExcel(int clubId, MemberExportOptions options);

    /// <summary>
    /// Export members to JSON format
    /// </summary>
    Task<byte[]> ExportMembersToJson(int clubId, MemberExportOptions options);

    /// <summary>
    /// Export members to PDF format
    /// </summary>
    Task<byte[]> ExportMembersToPdf(int clubId, MemberExportOptions options);

    /// <summary>
    /// Schedule member export for background processing
    /// </summary>
    Task<ExportResult> ScheduleMemberExport(int clubId, ExportFormat format, MemberExportOptions options, int userId, string notificationEmail);

    /// <summary>
    /// Process background member export
    /// </summary>
    Task<ExportResult> ProcessBackgroundMemberExport(string exportId);

    /// <summary>
    /// Process background member export with notification email
    /// </summary>
    Task<ExportResult> ProcessBackgroundMemberExportWithNotification(string exportId, string notificationEmail);

    /// <summary>
    /// Get export status
    /// </summary>
    Task<ExportStatusResponse> GetExportStatus(string exportId, int clubId);

    /// <summary>
    /// Download completed export file
    /// </summary>
    Task<Stream> DownloadExportAsync(string exportId, int clubId);

    /// <summary>
    /// Get export file name
    /// </summary>
    string GetExportFileName(string exportId);

    /// <summary>
    /// Export members with the specified request parameters (new unified method)
    /// </summary>
    Task<ExportResult> ExportMembersAsync(int clubId, MemberExportRequest request);

    /// <summary>
    /// Get export status by export ID (new method)
    /// </summary>
    Task<ExportStatusResponse?> GetExportStatusAsync(string exportId);
}
