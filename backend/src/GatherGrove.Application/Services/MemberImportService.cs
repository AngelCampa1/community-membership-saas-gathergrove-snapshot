using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CsvHelper;
using CsvHelper.Configuration;
using GatherGrove.Application.Common;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Import;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for member import operations
/// </summary>
public class MemberImportService : IMemberImportService
{
    private const int MaxCsvImportSizeBytes = 5 * 1024 * 1024;

    private readonly GatherGroveDbContext _context;
    private readonly IMemberService _memberService;
    private readonly ILogger<MemberImportService> _logger;

    public MemberImportService(
        GatherGroveDbContext context,
        IMemberService memberService,
        ILogger<MemberImportService> logger)
    {
        _context = context;
        _memberService = memberService;
        _logger = logger;
    }

    /// <summary>
    /// Downloads a CSV template with club-specific fields
    /// </summary>
    public async Task<byte[]> GenerateCsvTemplateAsync(int clubId)
    {
        _logger.LogInformation("Generating CSV template for club {ClubId}", clubId);

        // Get club membership types and custom fields
        var membershipTypes = await _context.MembershipTypes
            .Where(mt => mt.ClubId == clubId && mt.IsActive)
            .Select(mt => mt.Name)
            .ToListAsync();

        var customFields = await _context.ClubCustomFields
            .Where(cf => cf.ClubId == clubId)
            .Select(cf => cf.FieldLabel)
            .ToListAsync();

        var csv = new StringBuilder();

        // Create header row
        var headers = new List<string>
        {
            "FullName",
            "Email",
            "PhoneNumber",
            "MembershipType",
            "Address",
            "JoinDate"
        };

        // Add custom field headers
        headers.AddRange(customFields);
        csv.AppendLine(string.Join(",", headers));

        // Add example row with instructions
        var exampleRow = new List<string>
        {
            "\"John Doe\"",
            "\"john@example.com\"",
            "\"555-123-4567\"",
            $"\"{(membershipTypes.FirstOrDefault() ?? "Annual")}\"",
            "\"123 Main St, City, State 12345\"",
            "\"2024-01-15\""
        };

        // Add example custom field values
        foreach (var customField in customFields)
        {
            exampleRow.Add($"\"Example {customField}\"");
        }

        csv.AppendLine(string.Join(",", exampleRow));

        // Add instructions as comments
        csv.AppendLine();
        csv.AppendLine("# Instructions:");
        csv.AppendLine("# - FullName, Email, and MembershipType are required");
        csv.AppendLine("# - PhoneNumber, Address are optional");
        csv.AppendLine($"# - MembershipType must be one of: {string.Join(", ", membershipTypes)}");
        csv.AppendLine("# - JoinDate format: YYYY-MM-DD (optional, defaults to today)");
        csv.AppendLine("# - Remove this example row and instructions before importing");

        return Encoding.UTF8.GetBytes(csv.ToString());
    }

    /// <summary>
    /// Validates CSV data before import
    /// </summary>
    public async Task<ImportValidationResult> ValidateCsvAsync(int clubId, IFormFile csvFile)
    {
        _logger.LogInformation("Validating CSV for club {ClubId}, file: {FileName}", clubId, csvFile.FileName);

        var result = new ImportValidationResult();
        var membershipTypes = await GetValidMembershipTypesAsync(clubId);
        var customFields = await GetCustomFieldsAsync(clubId);
        var existingEmails = await GetExistingEmailsAsync(clubId);

        try
        {
            using var reader = new StreamReader(csvFile.OpenReadStream());
            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                MissingFieldFound = null, // Ignore missing fields
                HeaderValidated = null    // Don't validate headers
            };
            using var csv = new CsvReader(reader, config);

            var records = new List<CsvMemberRow>();
            var rowNumber = 0;
            var emailsInFile = new HashSet<string>();

            await foreach (var record in csv.GetRecordsAsync<CsvMemberRow>())
            {
                rowNumber++;
                record.RowNumber = rowNumber;

                // Skip comment lines
                if (record.FullName?.StartsWith("#") == true)
                    continue;

                records.Add(record);

                // Validate individual record
                await ValidateRecord(record, membershipTypes, customFields, existingEmails, emailsInFile, result);
            }

            result.TotalRows = records.Count;
            result.InvalidRows = result.ValidationErrors.Count;
            result.ValidRows = result.TotalRows - result.InvalidRows;
            result.IsValid = result.InvalidRows == 0;

            _logger.LogInformation("CSV validation completed for club {ClubId}: {ValidRows}/{TotalRows} valid rows",
                clubId, result.ValidRows, result.TotalRows);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating CSV for club {ClubId}", clubId);
            result.ValidationErrors.Add(new ValidationError
            {
                RowNumber = 0,
                Field = "File",
                Value = csvFile.FileName,
                Error = $"CSV parsing error: {ex.Message}"
            });
        }

        return result;
    }

    /// <summary>
    /// Executes the member import
    /// </summary>
    public async Task<ImportResult> ExecuteImportAsync(int clubId, int userId, ImportRequest request)
    {
        var importId = Guid.NewGuid();
        _logger.LogInformation("Starting member import {ImportId} for club {ClubId} by user {UserId}",
            importId, clubId, userId);

        // Create import record
        var memberImport = new MemberImport
        {
            ImportId = importId,
            ClubId = clubId,
            UserId = userId,
            FileName = "manual-import.csv",
            Status = "InProgress",
            CreatedAt = DateTime.UtcNow
        };

        _context.MemberImports.Add(memberImport);
        await _context.SaveChangesAsync();

        var result = new ImportResult
        {
            ImportId = importId,
            Status = "InProgress"
        };

        // Decode CSV data (let FormatException bubble up for invalid base64)
        var csvData = DecodeCsvDataWithSizeLimit(request.CsvData);
        var csvContent = Encoding.UTF8.GetString(csvData);

        try
        {

            // Parse and validate records
            var records = await ParseCsvRecords(csvContent);
            var membershipTypes = await GetValidMembershipTypesAsync(clubId);
            var customFields = await GetCustomFieldsAsync(clubId);

            memberImport.TotalRows = records.Count;

            // Process each record
            foreach (var record in records)
            {
                try
                {
                    // Skip invalid records if option is set
                    if (request.Options.SkipInvalid && await IsRecordInvalid(record, membershipTypes, customFields, clubId))
                    {
                        result.Summary.Skipped++;
                        continue;
                    }

                    // Convert to CreateMemberRequest
                    var createRequest = await ConvertToCreateMemberRequest(record, membershipTypes, customFields);

                    // Create member using existing service
                    await _memberService.CreateMemberAsync(clubId, createRequest);
                    result.Summary.Successful++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to import member at row {RowNumber}: {Error}", record.RowNumber, ex.Message);

                    result.Summary.Failed++;
                    result.Errors.Add(new ImportError
                    {
                        RowNumber = record.RowNumber,
                        MemberData = ConvertRecordToDictionary(record),
                        Error = ex.Message
                    });

                    // Stop processing if not skipping invalid records
                    if (!request.Options.SkipInvalid)
                        break;
                }
            }

            result.Summary.TotalProcessed = records.Count;
            result.Status = "Completed";

            // Update import record
            memberImport.SuccessfulRows = result.Summary.Successful;
            memberImport.FailedRows = result.Summary.Failed;
            memberImport.Status = "Completed";
            memberImport.CompletedAt = DateTime.UtcNow;

            if (result.Errors.Any())
            {
                memberImport.ErrorReport = JsonSerializer.Serialize(result.Errors);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Member import {ImportId} completed: {Successful} successful, {Failed} failed",
                importId, result.Summary.Successful, result.Summary.Failed);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during member import {ImportId}", importId);

            result.Status = "Failed";
            memberImport.Status = "Failed";
            memberImport.ErrorReport = ex.Message;
            memberImport.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        return result;
    }

    /// <summary>
    /// Gets the status of an import operation
    /// </summary>
    public async Task<ImportResult?> GetImportStatusAsync(Guid importId)
    {
        var import = await _context.MemberImports.FindAsync(importId);
        if (import == null)
            return null;

        var result = new ImportResult
        {
            ImportId = import.ImportId,
            Status = import.Status,
            Summary = new ImportSummary
            {
                TotalProcessed = import.TotalRows,
                Successful = import.SuccessfulRows,
                Failed = import.FailedRows,
                Skipped = import.TotalRows - import.SuccessfulRows - import.FailedRows
            }
        };

        if (!string.IsNullOrEmpty(import.ErrorReport))
        {
            try
            {
                result.Errors = JsonSerializer.Deserialize<List<ImportError>>(import.ErrorReport) ?? new List<ImportError>();
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to deserialize error report for import {ImportId}: {Error}", importId, ex.Message);
            }
        }

        return result;
    }

    #region Private Helper Methods

    private static byte[] DecodeCsvDataWithSizeLimit(string csvData)
    {
        var significantCharacters = CountSignificantBase64Characters(csvData);
        var maxEncodedCharacters = ((MaxCsvImportSizeBytes + 2) / 3) * 4;

        if (significantCharacters > maxEncodedCharacters)
        {
            throw new InvalidOperationException("CSV import file exceeds the 5 MB size limit.");
        }

        var decoded = Convert.FromBase64String(csvData);

        if (decoded.Length > MaxCsvImportSizeBytes)
        {
            throw new InvalidOperationException("CSV import file exceeds the 5 MB size limit.");
        }

        return decoded;
    }

    private static int CountSignificantBase64Characters(string value)
    {
        var count = 0;

        foreach (var character in value)
        {
            if (char.IsWhiteSpace(character))
            {
                continue;
            }

            count++;
        }

        return count;
    }

    private async Task<Dictionary<string, int>> GetValidMembershipTypesAsync(int clubId)
    {
        return await _context.MembershipTypes
            .Where(mt => mt.ClubId == clubId && mt.IsActive)
            .ToDictionaryAsync(mt => mt.Name, mt => mt.Id);
    }

    private async Task<List<ClubCustomField>> GetCustomFieldsAsync(int clubId)
    {
        return await _context.ClubCustomFields
            .Where(cf => cf.ClubId == clubId)
            .ToListAsync();
    }

    private async Task<HashSet<string>> GetExistingEmailsAsync(int clubId)
    {
        return (await _context.Members
            .Where(m => m.ClubId == clubId)
            .Select(m => m.Email.ToLower())
            .ToListAsync()).ToHashSet();
    }

    private async Task ValidateRecord(CsvMemberRow record, Dictionary<string, int> membershipTypes,
        List<ClubCustomField> customFields, HashSet<string> existingEmails, HashSet<string> emailsInFile,
        ImportValidationResult result)
    {
        // Required field validation
        if (string.IsNullOrWhiteSpace(record.FullName))
        {
            result.ValidationErrors.Add(new ValidationError
            {
                RowNumber = record.RowNumber,
                Field = "FullName",
                Value = record.FullName ?? "",
                Error = "Full name is required"
            });
        }

        if (string.IsNullOrWhiteSpace(record.Email))
        {
            result.ValidationErrors.Add(new ValidationError
            {
                RowNumber = record.RowNumber,
                Field = "Email",
                Value = record.Email ?? "",
                Error = "Email is required"
            });
        }
        else
        {
            // Email format validation
            if (!IsValidEmail(record.Email))
            {
                result.ValidationErrors.Add(new ValidationError
                {
                    RowNumber = record.RowNumber,
                    Field = "Email",
                    Value = record.Email,
                    Error = "Invalid email format"
                });
            }
            else
            {
                var emailLower = record.Email.ToLower();

                // Check for duplicates in existing members
                if (existingEmails.Contains(emailLower))
                {
                    result.Warnings.Add(new ValidationWarning
                    {
                        RowNumber = record.RowNumber,
                        Field = "Email",
                        Value = record.Email,
                        Warning = "Email already exists - will be skipped"
                    });
                    result.DuplicateEmails++;
                }

                // Check for duplicates within the file
                if (emailsInFile.Contains(emailLower))
                {
                    result.ValidationErrors.Add(new ValidationError
                    {
                        RowNumber = record.RowNumber,
                        Field = "Email",
                        Value = record.Email,
                        Error = "Duplicate email within the file"
                    });
                }
                else
                {
                    emailsInFile.Add(emailLower);
                }
            }
        }

        // Membership type validation
        if (string.IsNullOrWhiteSpace(record.MembershipType))
        {
            result.ValidationErrors.Add(new ValidationError
            {
                RowNumber = record.RowNumber,
                Field = "MembershipType",
                Value = record.MembershipType ?? "",
                Error = "Membership type is required"
            });
        }
        else if (!membershipTypes.ContainsKey(record.MembershipType))
        {
            result.ValidationErrors.Add(new ValidationError
            {
                RowNumber = record.RowNumber,
                Field = "MembershipType",
                Value = record.MembershipType,
                Error = $"Invalid membership type. Valid types: {string.Join(", ", membershipTypes.Keys)}"
            });
        }

        // Date validation
        if (!string.IsNullOrWhiteSpace(record.JoinDate) && !DateTime.TryParse(record.JoinDate, out _))
        {
            result.ValidationErrors.Add(new ValidationError
            {
                RowNumber = record.RowNumber,
                Field = "JoinDate",
                Value = record.JoinDate,
                Error = "Invalid date format. Use YYYY-MM-DD"
            });
        }

    }

    private async Task<List<CsvMemberRow>> ParseCsvRecords(string csvContent)
    {
        using var reader = new StringReader(csvContent);
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            MissingFieldFound = null, // Ignore missing fields
            HeaderValidated = null    // Don't validate headers
        };
        using var csv = new CsvReader(reader, config);

        var records = new List<CsvMemberRow>();
        var rowNumber = 0;

        await foreach (var record in csv.GetRecordsAsync<CsvMemberRow>())
        {
            rowNumber++;
            record.RowNumber = rowNumber;

            // Skip comment lines
            if (record.FullName?.StartsWith("#") == true)
                continue;

            records.Add(record);
        }

        return records;
    }

    private async Task<bool> IsRecordInvalid(CsvMemberRow record, Dictionary<string, int> membershipTypes,
        List<ClubCustomField> customFields, int clubId)
    {
        // Basic validation checks
        if (string.IsNullOrWhiteSpace(record.FullName) ||
            string.IsNullOrWhiteSpace(record.Email) ||
            string.IsNullOrWhiteSpace(record.MembershipType) ||
            !IsValidEmail(record.Email) ||
            !membershipTypes.ContainsKey(record.MembershipType))
        {
            return true;
        }

        // Check if email already exists
        var existingMember = await _context.Members
            .FirstOrDefaultAsync(m => m.ClubId == clubId && m.Email.ToLower() == record.Email.ToLower());

        return existingMember != null;
    }

    private async Task<CreateMemberRequest> ConvertToCreateMemberRequest(CsvMemberRow record,
        Dictionary<string, int> membershipTypes, List<ClubCustomField> customFields)
    {
        var request = new CreateMemberRequest
        {
            FullName = record.FullName,
            Email = record.Email,
            PhoneNumber = record.PhoneNumber,
            Address = record.Address,
            MembershipTypeId = membershipTypes[record.MembershipType],
            HasSmsConsent = false,
            JoinDate = ParseDate(record.JoinDate),
            CustomFieldValues = new List<MemberCustomFieldValueRequest>()
        };

        // Add custom field values
        foreach (var customField in customFields)
        {
            if (record.CustomFields.TryGetValue(customField.FieldLabel, out var value) && !string.IsNullOrWhiteSpace(value))
            {
                request.CustomFieldValues.Add(new MemberCustomFieldValueRequest
                {
                    CustomFieldId = customField.CustomFieldId,
                    FieldValue = value
                });
            }
        }

        return request;
    }

    private Dictionary<string, object> ConvertRecordToDictionary(CsvMemberRow record)
    {
        var dict = new Dictionary<string, object>
        {
            ["FullName"] = record.FullName ?? "",
            ["Email"] = record.Email ?? "",
            ["PhoneNumber"] = record.PhoneNumber ?? "",
            ["MembershipType"] = record.MembershipType ?? "",
            ["Address"] = record.Address ?? "",
            ["JoinDate"] = record.JoinDate ?? ""
        };

        foreach (var customField in record.CustomFields)
        {
            dict[customField.Key] = customField.Value;
        }

        return dict;
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    private bool IsValidBoolean(string value)
    {
        var lowerValue = value.ToLower().Trim();
        return lowerValue == "true" || lowerValue == "false" ||
               lowerValue == "1" || lowerValue == "0" ||
               lowerValue == "yes" || lowerValue == "no";
    }

    private bool ParseBoolean(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        var lowerValue = value.ToLower().Trim();
        return lowerValue == "true" || lowerValue == "1" || lowerValue == "yes";
    }

    private DateTime? ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        // Imported date columns are calendar dates. Parse as DateTimeOffset so a cell
        // carrying an offset keeps the date the author wrote: DateTime.TryParse would
        // first shift it into the server's local zone, which can move it a day.
        // The result is pinned to midnight UTC because Npgsql rejects
        // Kind=Unspecified for 'timestamp with time zone'.
        return DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed)
            ? UtcDateTime.NormalizeDate(parsed.Date)
            : null;
    }

    #endregion
}
