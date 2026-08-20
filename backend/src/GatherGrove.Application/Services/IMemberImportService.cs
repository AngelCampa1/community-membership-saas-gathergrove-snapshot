using Microsoft.AspNetCore.Http;
using GatherGrove.Application.DTOs.Import;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for member import operations
/// </summary>
public interface IMemberImportService
{
    /// <summary>
    /// Downloads a CSV template with club-specific fields
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <returns>CSV template content as byte array</returns>
    Task<byte[]> GenerateCsvTemplateAsync(int clubId);

    /// <summary>
    /// Validates CSV data before import
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="csvFile">The CSV file to validate</param>
    /// <returns>Validation results with errors and warnings</returns>
    Task<ImportValidationResult> ValidateCsvAsync(int clubId, IFormFile csvFile);

    /// <summary>
    /// Executes the member import
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="userId">The ID of the user performing the import</param>
    /// <param name="request">The import request with CSV data and options</param>
    /// <returns>Import results with success/failure details</returns>
    Task<ImportResult> ExecuteImportAsync(int clubId, int userId, ImportRequest request);

    /// <summary>
    /// Gets the status of an import operation
    /// </summary>
    /// <param name="importId">The ID of the import operation</param>
    /// <returns>Import status and results</returns>
    Task<ImportResult?> GetImportStatusAsync(Guid importId);
}