using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs.Import;
using GatherGrove.API.Extensions;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for member import operations
/// BUG FIX #21: Added rate limiting to prevent abuse of bulk import operations
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/members/import")]
[EnableRateLimiting("StrictApi")]
public class MemberImportController : ControllerBase
{
    private const int MaxCsvImportSizeBytes = 5 * 1024 * 1024;
    private const int MaxBase64CsvImportCharacters = ((MaxCsvImportSizeBytes + 2) / 3) * 4;

    private readonly IMemberImportService _importService;
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<MemberImportController> _logger;

    public MemberImportController(
        IMemberImportService importService,
        IClubAuthorizationService authService,
        ILogger<MemberImportController> logger)
    {
        _importService = importService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Downloads a CSV template with club-specific fields
    /// </summary>
    /// <remarks>
    /// Downloads a CSV template that includes:
    /// - Required columns (FullName, Email, MembershipType)
    /// - Optional columns (PhoneNumber, Address, JoinDate)
    /// - Club-specific custom fields
    /// - Example data and format instructions
    /// The template is customized based on the club's membership types and custom fields.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <response code="200">Returns the CSV template file</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet("template")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(FileContentResult), 200)]
    public async Task<IActionResult> DownloadTemplate([FromRoute] int clubId)
    {
        try
        {
            _logger.LogInformation("Generating CSV template for club {ClubId}", clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var templateBytes = await _importService.GenerateCsvTemplateAsync(clubId);

            return File(templateBytes, "text/csv", $"member-import-template-{clubId}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating CSV template for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while generating the template." });
        }
    }

    /// <summary>
    /// Validates CSV data before import
    /// </summary>
    /// <remarks>
    /// Validates uploaded CSV file and returns detailed feedback:
    /// - Row-by-row validation results
    /// - Duplicate email detection (within file and existing members)
    /// - Membership type validation
    /// - Custom field validation
    /// - Format and required field checks
    /// Does not create any members - only validates the data.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="csvFile">The CSV file to validate (max 5MB, 1000 rows)</param>
    /// <response code="200">Returns validation results with errors and warnings</response>
    /// <response code="400">If the file is invalid or too large</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("validate")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(ImportValidationResult), 200)]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5MB limit
    public async Task<IActionResult> ValidateCsv([FromRoute] int clubId, IFormFile csvFile)
    {
        try
        {
            // Validate file first
            if (csvFile == null || csvFile.Length == 0)
            {
                return BadRequest(new { message = "No file provided or file is empty." });
            }

            _logger.LogInformation("Validating CSV for club {ClubId}, file: {FileName}, size: {FileSize}",
                clubId, csvFile.FileName, csvFile.Length);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            if (csvFile.Length > 5 * 1024 * 1024) // 5MB
            {
                return BadRequest(new { message = "File size exceeds 5MB limit." });
            }

            if (!csvFile.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "File must be a CSV file." });
            }

            var validationResult = await _importService.ValidateCsvAsync(clubId, csvFile);

            // Check if we have too many rows
            if (validationResult.TotalRows > 1000)
            {
                return BadRequest(new { message = "CSV file contains too many rows. Maximum allowed is 1000 rows." });
            }

            _logger.LogInformation("CSV validation completed for club {ClubId}: {ValidRows}/{TotalRows} valid rows, {ErrorCount} errors",
                clubId, validationResult.ValidRows, validationResult.TotalRows, validationResult.ValidationErrors.Count);

            return Ok(validationResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating CSV for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while validating the CSV file." });
        }
    }

    /// <summary>
    /// Executes the member import
    /// </summary>
    /// <remarks>
    /// Imports members from previously validated CSV data.
    /// The CSV data should be base64 encoded in the request.
    /// Import options control behavior for duplicates and invalid records.
    /// Creates an audit trail and returns detailed results.
    /// All successful imports create member records immediately.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">Import request with CSV data and options</param>
    /// <response code="200">Returns import results with success/failure details</response>
    /// <response code="400">If the request is invalid or import fails</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("execute")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(ImportResult), 200)]
    public async Task<IActionResult> ExecuteImport([FromRoute] int clubId, [FromBody] ImportRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            _logger.LogInformation("Executing member import for club {ClubId} by user {UserId}", clubId, userId.Value);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Validate request
            if (request == null)
            {
                return BadRequest(new { message = "Import request is required." });
            }

            if (string.IsNullOrEmpty(request.CsvData))
            {
                return BadRequest(new { message = "CSV data is required." });
            }

            if (CountSignificantBase64Characters(request.CsvData) > MaxBase64CsvImportCharacters)
            {
                return StatusCode(413, new { message = "CSV import file exceeds the 5 MB size limit." });
            }

            var importResult = await _importService.ExecuteImportAsync(clubId, userId.Value, request);

            _logger.LogInformation("Member import {ImportId} completed for club {ClubId}: {Successful} successful, {Failed} failed, {Skipped} skipped",
                importResult.ImportId, clubId, importResult.Summary.Successful, importResult.Summary.Failed, importResult.Summary.Skipped);

            return Ok(importResult);
        }
        catch (FormatException)
        {
            return BadRequest(new { message = "Invalid CSV data format. Must be base64 encoded." });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("5 MB size limit", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(413, new { message = "CSV import file exceeds the 5 MB size limit." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing member import for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while importing members." });
        }
    }

    /// <summary>
    /// Gets the status of an import operation
    /// </summary>
    /// <remarks>
    /// Retrieves the current status and results of a member import operation.
    /// Useful for tracking long-running imports or reviewing completed imports.
    /// Returns detailed error information if the import failed.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="importId">The ID of the import operation</param>
    /// <response code="200">Returns import status and results</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the import operation is not found</response>
    [HttpGet("{importId}/status")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(ImportResult), 200)]
    public async Task<IActionResult> GetImportStatus([FromRoute] int clubId, [FromRoute] Guid importId)
    {
        try
        {
            _logger.LogInformation("Getting import status {ImportId} for club {ClubId}", importId, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var importResult = await _importService.GetImportStatusAsync(importId);

            if (importResult == null)
            {
                return NotFound(new { message = "Import operation not found." });
            }

            return Ok(importResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting import status {ImportId} for club {ClubId}", importId, clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving import status." });
        }
    }

    /// <summary>
    /// Gets the current user's ID from the JWT token claims
    /// </summary>
    /// <returns>User ID if found in claims</returns>
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim?.Value, out var userId) ? userId : null;
    }

    private static int CountSignificantBase64Characters(string value)
    {
        var count = 0;

        foreach (var character in value)
        {
            if (!char.IsWhiteSpace(character))
            {
                count++;
            }
        }

        return count;
    }
}
