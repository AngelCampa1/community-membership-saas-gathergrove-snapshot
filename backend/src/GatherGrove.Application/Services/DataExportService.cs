using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Text.Json;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for GDPR-compliant data export operations
/// BUG FIX: Implementation created to resolve missing IDataExportService dependency
/// </summary>
public class DataExportService : IDataExportService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<DataExportService> _logger;
    private readonly string _exportStoragePath;
    private readonly Dictionary<Guid, DataExportStatus> _exportStatuses = new();

    public DataExportService(
        GatherGroveDbContext context,
        ILogger<DataExportService> logger)
    {
        _context = context;
        _logger = logger;
        _exportStoragePath = Path.Combine(Path.GetTempPath(), "GatherGrove", "Exports");

        // Ensure export directory exists
        if (!Directory.Exists(_exportStoragePath))
        {
            Directory.CreateDirectory(_exportStoragePath);
        }
    }

    /// <summary>
    /// Exports all user data in GDPR-compliant format
    /// </summary>
    public async Task<DataExportResult> ExportUserDataAsync(int userId)
    {
        var exportId = Guid.NewGuid();
        _logger.LogInformation("Starting data export for user {UserId}, exportId {ExportId}", userId, exportId);

        var status = new DataExportStatus
        {
            ExportId = exportId,
            State = DataExportState.InProgress,
            ProgressPercentage = 0,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        _exportStatuses[exportId] = status;

        try
        {
            // Gather all user data
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException($"User {userId} not found");
            }

            status.ProgressPercentage = 10;

            // Collect all data
            var userData = new
            {
                User = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.CreatedAt
                },
                ClubAdmins = await _context.ClubAdmins
                    .Where(ca => ca.UserId == userId)
                    .Select(ca => new { ca.ClubId, ClubName = ca.Club.Name, ca.CreatedAt })
                    .ToListAsync(),
                Members = await _context.Set<Member>()
                    .Where(m => m.FullName == user.FullName || m.Email == user.Email)
                    .Select(m => new
                    {
                        m.Id,
                        m.ClubId,
                        m.FullName,
                        m.Email,
                        m.PhoneNumber,
                        m.JoinDate,
                        m.MembershipTypeId,
                        m.Status
                    })
                    .ToListAsync(),
                Events = await _context.Set<Event>()
                    .Where(e => e.ClubId != null)
                    .Where(e => _context.ClubAdmins.Any(ca => ca.ClubId == e.ClubId && ca.UserId == userId))
                    .Select(e => new
                    {
                        e.Id,
                        Name = e.Name,
                        e.Description,
                        e.EventDateTime,
                        e.Location
                    })
                    .ToListAsync(),
                Payments = await _context.Set<Payment>()
                    .Where(p => _context.Set<Member>()
                        .Any(m => m.Id == p.MemberId && (m.FullName == user.FullName || m.Email == user.Email)))
                    .Select(p => new
                    {
                        PaymentId = p.PaymentId,
                        p.Amount,
                        p.PaymentDate,
                        p.PaymentMethod,
                        p.Notes
                    })
                    .ToListAsync()
            };

            status.ProgressPercentage = 50;

            // Create ZIP file with JSON data
            var exportFilePath = Path.Combine(_exportStoragePath, $"export-{exportId}.zip");

            using (var zipArchive = ZipFile.Open(exportFilePath, ZipArchiveMode.Create))
            {
                // Add user data as JSON
                var userDataJson = JsonSerializer.Serialize(userData, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                var jsonEntry = zipArchive.CreateEntry("user-data.json");
                using (var entryStream = jsonEntry.Open())
                using (var writer = new StreamWriter(entryStream, Encoding.UTF8))
                {
                    await writer.WriteAsync(userDataJson);
                }

                // Add README
                var readmeEntry = zipArchive.CreateEntry("README.txt");
                using (var entryStream = readmeEntry.Open())
                using (var writer = new StreamWriter(entryStream, Encoding.UTF8))
                {
                    await writer.WriteAsync(GetReadmeContent(user.FullName, DateTime.UtcNow));
                }
            }

            status.ProgressPercentage = 90;

            var fileInfo = new FileInfo(exportFilePath);

            var result = new DataExportResult
            {
                ExportId = exportId,
                DownloadUrl = $"/api/account-deletion/download/{exportId}",
                FileSizeBytes = fileInfo.Length,
                ExpiresAt = status.ExpiresAt,
                Format = "ZIP",
                IncludedDataCategories = new List<string>
                {
                    "User Account",
                    "Club Memberships",
                    "Club Admin Roles",
                    "Created Events",
                    "Payment History"
                }
            };

            status.State = DataExportState.Completed;
            status.ProgressPercentage = 100;
            status.CompletedAt = DateTime.UtcNow;

            _logger.LogInformation("Data export completed for user {UserId}, exportId {ExportId}, size {Size} bytes",
                userId, exportId, fileInfo.Length);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Data export failed for user {UserId}, exportId {ExportId}", userId, exportId);
            status.State = DataExportState.Failed;
            status.ErrorMessage = ex.Message;
            throw;
        }
    }

    /// <summary>
    /// Gets the status of a data export request
    /// </summary>
    public async Task<DataExportStatus> GetExportStatusAsync(Guid exportId)
    {
        _logger.LogDebug("Getting export status for {ExportId}", exportId);

        if (_exportStatuses.TryGetValue(exportId, out var status))
        {
            // Check if export has expired
            if (DateTime.UtcNow > status.ExpiresAt && status.State == DataExportState.Completed)
            {
                status.State = DataExportState.Expired;
            }

            return await Task.FromResult(status);
        }

        throw new InvalidOperationException($"Export {exportId} not found");
    }

    /// <summary>
    /// Downloads the exported data file
    /// </summary>
    public async Task<Stream> DownloadExportAsync(Guid exportId)
    {
        _logger.LogInformation("Downloading export {ExportId}", exportId);

        var status = await GetExportStatusAsync(exportId);

        if (status.State != DataExportState.Completed)
        {
            throw new InvalidOperationException($"Export {exportId} is not ready for download. Status: {status.State}");
        }

        if (DateTime.UtcNow > status.ExpiresAt)
        {
            throw new InvalidOperationException($"Export {exportId} has expired");
        }

        var exportFilePath = Path.Combine(_exportStoragePath, $"export-{exportId}.zip");

        if (!File.Exists(exportFilePath))
        {
            throw new FileNotFoundException($"Export file not found for {exportId}");
        }

        // Return a memory stream copy of the file
        var fileBytes = await File.ReadAllBytesAsync(exportFilePath);
        return new MemoryStream(fileBytes);
    }

    /// <summary>
    /// Cleans up expired export files
    /// </summary>
    public async Task<int> CleanupExpiredExportsAsync()
    {
        _logger.LogInformation("Cleaning up expired exports");

        var cleanedCount = 0;
        var expiredExports = _exportStatuses
            .Where(kvp => DateTime.UtcNow > kvp.Value.ExpiresAt)
            .ToList();

        foreach (var (exportId, _) in expiredExports)
        {
            var exportFilePath = Path.Combine(_exportStoragePath, $"export-{exportId}.zip");

            if (File.Exists(exportFilePath))
            {
                try
                {
                    File.Delete(exportFilePath);
                    cleanedCount++;
                    _logger.LogDebug("Deleted expired export file {ExportId}", exportId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete expired export file {ExportId}", exportId);
                }
            }

            _exportStatuses.Remove(exportId);
        }

        _logger.LogInformation("Cleanup completed. Removed {Count} expired exports", cleanedCount);
        return await Task.FromResult(cleanedCount);
    }

    private string GetReadmeContent(string userName, DateTime exportDate)
    {
        return $@"GatherGrove Data Export
========================

User: {userName}
Export Date: {exportDate:yyyy-MM-dd HH:mm:ss} UTC
Export Format: JSON

This export contains all your personal data stored in GatherGrove, including:
- Your user account information
- Club memberships
- Club administration roles
- Events you created
- Payment history

Data Format:
- user-data.json: Contains all your data in JSON format

This export is provided in compliance with GDPR Article 20 (Right to Data Portability).

The data in this export will be permanently deleted from our servers after your account deletion is complete.

For questions or concerns, please contact: support@gathergrove.club

--
GatherGrove
{DateTime.UtcNow.Year}
";
    }
}
