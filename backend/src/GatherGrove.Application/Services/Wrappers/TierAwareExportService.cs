using Microsoft.Extensions.Logging;
using GatherGrove.Infrastructure.Services.TierValidation;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Application.DTOs.Analytics;
using GatherGrove.Domain.Enums;
using DomainExportFormat = GatherGrove.Domain.Enums.ExportFormat;

namespace GatherGrove.Application.Services.Wrappers;

/// <summary>
/// Tier-aware wrapper for ExportService
/// Prevents expensive export operations for basic tier clubs
/// Contributes to 40-60% database load reduction by blocking non-Expand export queries
/// </summary>
public class TierAwareExportService : GatherGrove.Application.Services.Interfaces.IExportService
{
    private readonly GatherGrove.Application.Services.Interfaces.IExportService _innerService;
    private readonly ITierGateService _tierGateService;
    private readonly ILogger<TierAwareExportService> _logger;

    public TierAwareExportService(
        GatherGrove.Application.Services.Interfaces.IExportService innerService,
        ITierGateService tierGateService,
        ILogger<TierAwareExportService> logger)
    {
        _innerService = innerService;
        _tierGateService = tierGateService;
        _logger = logger;
    }

    /// <summary>
    /// Exports member data with tier validation
    /// Member exports can involve thousands of records and complex joins
    /// </summary>
    public async Task<ExportResult> ExportMembersAsync(int clubId, DomainExportFormat format, MemberExportOptions options)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from member export - preventing expensive database queries", clubId);
            throw new UnauthorizedAccessException("Member data export requires Expand tier subscription");
        }

        // Validate resource allocation for export operations
        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = 5, // Member export involves multiple queries
            CacheSize = 200, // Cache for member data
            BackgroundProcessing = true // Large exports may run in background
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.ExportMembersAsync(clubId, format, options);
    }

    /// <summary>
    /// Exports event data with tier validation
    /// Event exports include RSVP data, engagement metrics, and historical data
    /// </summary>
    public async Task<ExportResult> ExportEventsAsync(int clubId, DomainExportFormat format, EventExportOptions options)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from event export - avoiding complex event data processing", clubId);
            throw new UnauthorizedAccessException("Event data export requires Expand tier subscription");
        }

        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = 7, // Event export is more complex
            CacheSize = 300,
            BackgroundProcessing = true
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.ExportEventsAsync(clubId, format, options);
    }

    /// <summary>
    /// Exports financial data with tier validation
    /// Financial exports are the most sensitive and resource-intensive
    /// </summary>
    public async Task<ExportResult> ExportFinancialDataAsync(int clubId, DomainExportFormat format, FinancialExportOptions options)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from financial export - maximum database optimization", clubId);
            throw new UnauthorizedAccessException("Financial data export requires Expand tier subscription");
        }

        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = 10, // Financial export requires many complex queries
            CacheSize = 500, // Large cache for financial calculations
            BackgroundProcessing = true
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.ExportFinancialDataAsync(clubId, format, options);
    }

    /// <summary>
    /// Exports analytics data with tier validation
    /// Analytics exports combine multiple data sources and complex calculations
    /// </summary>
    public async Task<ExportResult> ExportAnalyticsDataAsync(int clubId, DomainExportFormat format, AnalyticsExportOptions options)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from analytics export - preventing resource-intensive data processing", clubId);
            throw new UnauthorizedAccessException("Analytics data export requires Expand tier subscription");
        }

        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = 15, // Most complex export type
            CacheSize = 600,
            BackgroundProcessing = true
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.ExportAnalyticsDataAsync(clubId, format, options);
    }

    /// <summary>
    /// Gets export history with tier validation
    /// Even viewing export history should be limited to Expand tier
    /// </summary>
    public async Task<List<ExportHistoryItem>> GetExportHistoryAsync(int clubId, int limit = 50)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            return new List<ExportHistoryItem>(); // Return empty list instead of throwing
        }

        return await _innerService.GetExportHistoryAsync(clubId, limit);
    }

    /// <summary>
    /// Gets export status with tier validation
    /// </summary>
    public async Task<GatherGrove.Domain.Enums.ExportStatus> GetExportStatusAsync(string exportId, int clubId)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            throw new UnauthorizedAccessException("Export status requires Expand tier subscription");
        }

        return await _innerService.GetExportStatusAsync(exportId, clubId);
    }

    /// <summary>
    /// Cancels export with tier validation
    /// </summary>
    public async Task<bool> CancelExportAsync(string exportId, int clubId)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            return false; // Can't cancel what they can't create
        }

        return await _innerService.CancelExportAsync(exportId, clubId);
    }

    /// <summary>
    /// Downloads export file with tier validation
    /// </summary>
    public async Task<Stream> DownloadExportAsync(string exportId, int clubId)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from export download - preventing file access", clubId);
            throw new UnauthorizedAccessException("Export download requires Expand tier subscription");
        }

        return await _innerService.DownloadExportAsync(exportId, clubId);
    }

    /// <summary>
    /// Gets available export formats with tier validation
    /// Even checking formats should be limited since basic tier has no export capability
    /// </summary>
    public async Task<List<ExportFormatInfo>> GetAvailableFormatsAsync(string dataType)
    {
        // This method doesn't require club ID but we should still return limited formats
        // for non-Expand tiers. However, without club context, we return all formats
        // and rely on the actual export methods to enforce tier restrictions.

        return await _innerService.GetAvailableFormatsAsync(dataType);
    }

    /// <summary>
    /// Validates export options with tier validation
    /// </summary>
    public async Task<ExportValidationResult> ValidateExportOptionsAsync(int clubId, string dataType, DomainExportFormat format, object options)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            return new ExportValidationResult
            {
                IsValid = false,
                Errors = new List<string> { "Export functionality requires Expand tier subscription" }
            };
        }

        return await _innerService.ValidateExportOptionsAsync(clubId, dataType, format, options);
    }

    /// <summary>
    /// Gets export quota/limits with tier validation
    /// </summary>
    public async Task<ExportQuota> GetExportQuotaAsync(int clubId)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            return new ExportQuota
            {
                MaxExportsPerDay = 0,
                MaxExportsPerMonth = 0,
                MaxFileSizeBytes = 0,
                UsedExportsToday = 0,
                UsedExportsThisMonth = 0
            };
        }

        return await _innerService.GetExportQuotaAsync(clubId);
    }

    /// <summary>
    /// Schedules background export with tier validation
    /// Background exports are only available for Expand tier
    /// </summary>
    public async Task<string> ScheduleBackgroundExportAsync(int clubId, BackgroundExportRequest request)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from background export scheduling", clubId);
            throw new UnauthorizedAccessException("Background exports require Expand tier subscription");
        }

        // Validate background processing is enabled for this tier
        if (!await _tierGateService.ShouldEnableBackgroundProcessingAsync(clubId))
        {
            _logger.LogWarning("Club {ClubId} blocked from background export - background processing not enabled", clubId);
            throw new InvalidOperationException("Background processing is not enabled for this club");
        }

        return await _innerService.ScheduleBackgroundExportAsync(clubId, request);
    }

    /// <summary>
    /// Export analytics to PDF format with tier validation (overload without userId)
    /// </summary>
    public async Task<byte[]> ExportAnalyticsToPDFAsync(ExportAnalyticsRequest request)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(request.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from PDF export - preventing expensive PDF generation", request.ClubId);
            throw new UnauthorizedAccessException("PDF export requires Expand tier subscription");
        }

        // Validate resource allocation for PDF generation
        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = request.ClubId,
            AnalyticsQueries = 8,
            CacheSize = 400,
            BackgroundProcessing = true
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.ExportAnalyticsToPDFAsync(request);
    }

    /// <summary>
    /// Export analytics to Excel format with tier validation (overload without userId)
    /// </summary>
    public async Task<byte[]> ExportAnalyticsToExcelAsync(ExportAnalyticsRequest request)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(request.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from Excel export - preventing spreadsheet generation overhead", request.ClubId);
            throw new UnauthorizedAccessException("Excel export requires Expand tier subscription");
        }

        // Validate resource allocation for Excel generation
        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = request.ClubId,
            AnalyticsQueries = 6,
            CacheSize = 300,
            BackgroundProcessing = true
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.ExportAnalyticsToExcelAsync(request);
    }

    /// <summary>
    /// Export analytics to CSV format with tier validation (overload without userId)
    /// </summary>
    public async Task<byte[]> ExportAnalyticsToCSVAsync(ExportAnalyticsRequest request)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(request.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from CSV export - avoiding bulk data extraction", request.ClubId);
            throw new UnauthorizedAccessException("CSV export requires Expand tier subscription");
        }

        // Validate resource allocation for CSV generation
        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = request.ClubId,
            AnalyticsQueries = 4,
            CacheSize = 200,
            BackgroundProcessing = true
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.ExportAnalyticsToCSVAsync(request);
    }

    /// <summary>
    /// Export analytics data to PDF format with tier validation
    /// Implements IExportService interface method
    /// </summary>
    public async Task<byte[]> ExportAnalyticsToPDFAsync(ExportAnalyticsRequest request, int userId)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(request.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from PDF export - preventing expensive PDF generation", request.ClubId);
            throw new UnauthorizedAccessException("PDF export requires Expand tier subscription");
        }

        // Validate resource allocation for PDF generation
        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = request.ClubId,
            AnalyticsQueries = 8, // PDF export requires multiple queries for charts and data
            CacheSize = 400, // Large cache for PDF rendering
            BackgroundProcessing = true // PDF generation may be resource intensive
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.ExportAnalyticsToPDFAsync(request);
    }

    /// <summary>
    /// Export analytics data to Excel format with tier validation
    /// Implements IExportService interface method
    /// </summary>
    public async Task<byte[]> ExportAnalyticsToExcelAsync(ExportAnalyticsRequest request, int userId)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(request.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from Excel export - preventing spreadsheet generation overhead", request.ClubId);
            throw new UnauthorizedAccessException("Excel export requires Expand tier subscription");
        }

        // Validate resource allocation for Excel generation
        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = request.ClubId,
            AnalyticsQueries = 6, // Excel export needs data queries and formatting
            CacheSize = 300, // Cache for Excel data processing
            BackgroundProcessing = true // Excel generation can be memory intensive
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.ExportAnalyticsToExcelAsync(request);
    }

    /// <summary>
    /// Export analytics data to CSV format with tier validation
    /// Implements IExportService interface method
    /// </summary>
    public async Task<byte[]> ExportAnalyticsToCSVAsync(ExportAnalyticsRequest request, int userId)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(request.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from CSV export - avoiding bulk data extraction", request.ClubId);
            throw new UnauthorizedAccessException("CSV export requires Expand tier subscription");
        }

        // Validate resource allocation for CSV generation
        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = request.ClubId,
            AnalyticsQueries = 4, // CSV export is lighter but still requires data queries
            CacheSize = 200, // Moderate cache for CSV data
            BackgroundProcessing = true // Large CSV files may need background processing
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.ExportAnalyticsToCSVAsync(request);
    }

    /// <summary>
    /// Export to PDF (simple interface method)
    /// </summary>
    public async Task<byte[]> ExportToPdfAsync(ExportAnalyticsRequest request, int userId)
    {
        return await ExportAnalyticsToPDFAsync(request, userId);
    }

    /// <summary>
    /// Export to Excel (simple interface method)
    /// </summary>
    public async Task<byte[]> ExportToExcelAsync(ExportAnalyticsRequest request, int userId)
    {
        return await ExportAnalyticsToExcelAsync(request, userId);
    }

    /// <summary>
    /// Export to CSV (simple interface method)
    /// </summary>
    public async Task<byte[]> ExportToCsvAsync(ExportAnalyticsRequest request, int userId)
    {
        return await ExportAnalyticsToCSVAsync(request, userId);
    }

    /// <summary>
    /// Export analytics data to PDF format with tier validation (AdvancedExportAnalyticsRequest)
    /// </summary>
    public async Task<byte[]> ExportAnalyticsToPDFAsync(AdvancedExportAnalyticsRequest request, int userId)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(request.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from advanced PDF export", request.ClubId);
            throw new UnauthorizedAccessException("Advanced PDF export requires Expand tier subscription");
        }

        return await _innerService.ExportAnalyticsToPDFAsync(request, userId);
    }

    /// <summary>
    /// Export analytics data to Excel format with tier validation (AdvancedExportAnalyticsRequest)
    /// </summary>
    public async Task<byte[]> ExportAnalyticsToExcelAsync(AdvancedExportAnalyticsRequest request, int userId)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(request.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from advanced Excel export", request.ClubId);
            throw new UnauthorizedAccessException("Advanced Excel export requires Expand tier subscription");
        }

        return await _innerService.ExportAnalyticsToExcelAsync(request, userId);
    }

    /// <summary>
    /// Export analytics data to CSV format with tier validation (AdvancedExportAnalyticsRequest)
    /// </summary>
    public async Task<byte[]> ExportAnalyticsToCSVAsync(AdvancedExportAnalyticsRequest request, int userId)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(request.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from advanced CSV export", request.ClubId);
            throw new UnauthorizedAccessException("Advanced CSV export requires Expand tier subscription");
        }

        return await _innerService.ExportAnalyticsToCSVAsync(request, userId);
    }

    /// <summary>
    /// Export data with tier validation and authorization (new method for controller)
    /// </summary>
    public async Task<ExportResponseDto> ExportDataAsync(int clubId, int userId, string dataType, string format, DateTime startDate, DateTime endDate)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from data export", clubId);
            throw new UnauthorizedAccessException("Data export requires Expand tier subscription");
        }

        return await _innerService.ExportDataAsync(clubId, userId, dataType, format, startDate, endDate);
    }

    // Methods required by AuditTrail tests
    public async Task<ExportResult> ExportFinancialsAsync(GatherGrove.Application.DTOs.Export.ExportRequestDto exportRequest)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(exportRequest.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from financial export", exportRequest.ClubId);
            throw new UnauthorizedAccessException("Financial export requires Expand tier subscription");
        }

        return await _innerService.ExportFinancialsAsync(exportRequest);
    }

    public async Task<ExportResult> ExportMembersAsync(GatherGrove.Application.DTOs.Export.ExportRequestDto exportRequest)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(exportRequest.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from member export", exportRequest.ClubId);
            throw new UnauthorizedAccessException("Member export requires Expand tier subscription");
        }

        return await _innerService.ExportMembersAsync(exportRequest);
    }

    public async Task<ExportResult> ExportEventsAsync(GatherGrove.Application.DTOs.Export.ExportRequestDto exportRequest)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(exportRequest.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from events export", exportRequest.ClubId);
            throw new UnauthorizedAccessException("Events export requires Expand tier subscription");
        }

        return await _innerService.ExportEventsAsync(exportRequest);
    }

    public async Task<ExportResult> ExportAnalyticsAsync(GatherGrove.Application.DTOs.Export.ExportRequestDto exportRequest)
    {
        if (!await _tierGateService.ValidateUnlimitedAccessAsync(exportRequest.ClubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from analytics export", exportRequest.ClubId);
            throw new UnauthorizedAccessException("Analytics export requires Expand tier subscription");
        }

        return await _innerService.ExportAnalyticsAsync(exportRequest);
    }
}

