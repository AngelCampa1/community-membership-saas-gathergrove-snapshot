using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service implementation for managing club custom fields for member profiles
/// </summary>
public class CustomFieldService : ICustomFieldService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<CustomFieldService> _logger;
    private const int MaxCustomFieldsPerClub = 10;

    public CustomFieldService(GatherGroveDbContext context, ILogger<CustomFieldService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets all custom fields for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>List of custom fields</returns>
    public async Task<IEnumerable<CustomFieldResponse>> GetCustomFieldsAsync(int clubId, int userId)
    {
        _logger.LogInformation("Getting custom fields for club {ClubId} by user {UserId}", clubId, userId);

        // Verify user is an admin of this club
        await ValidateClubAdminAsync(clubId, userId);

        var customFields = await _context.ClubCustomFields
            .AsNoTracking()
            .Where(cf => cf.ClubId == clubId)
            .OrderBy(cf => cf.CreatedAt)
            .Select(cf => new CustomFieldResponse
            {
                CustomFieldId = cf.CustomFieldId,
                ClubId = cf.ClubId,
                FieldLabel = cf.FieldLabel,
                FieldType = cf.FieldType,
                DropdownOptions = cf.DropdownOptions,
                IsRequired = cf.IsRequired,
                CreatedAt = cf.CreatedAt
            })
            .ToListAsync();

        _logger.LogInformation("Retrieved {Count} custom fields for club {ClubId}", customFields.Count, clubId);

        return customFields;
    }

    /// <summary>
    /// Gets a specific custom field by ID
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="customFieldId">The custom field ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Custom field response</returns>
    public async Task<CustomFieldResponse> GetCustomFieldByIdAsync(int clubId, int customFieldId, int userId)
    {
        _logger.LogInformation("Getting custom field {CustomFieldId} for club {ClubId} by user {UserId}",
            customFieldId, clubId, userId);

        // Verify user is an admin of this club
        await ValidateClubAdminAsync(clubId, userId);

        var customField = await _context.ClubCustomFields
            .AsNoTracking()
            .Where(cf => cf.CustomFieldId == customFieldId && cf.ClubId == clubId)
            .Select(cf => new CustomFieldResponse
            {
                CustomFieldId = cf.CustomFieldId,
                ClubId = cf.ClubId,
                FieldLabel = cf.FieldLabel,
                FieldType = cf.FieldType,
                DropdownOptions = cf.DropdownOptions,
                IsRequired = cf.IsRequired,
                CreatedAt = cf.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (customField == null)
        {
            throw new InvalidOperationException("Custom field not found");
        }

        return customField;
    }

    /// <summary>
    /// Creates a new custom field for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The custom field creation request</param>
    /// <returns>Created custom field response</returns>
    public async Task<CustomFieldResponse> CreateCustomFieldAsync(int clubId, int userId, CreateCustomFieldRequest request)
    {
        _logger.LogInformation("Creating custom field for club {ClubId} by user {UserId}: FieldLabel={FieldLabel}, FieldType={FieldType}",
            clubId, userId, request.FieldLabel, request.FieldType);

        // Verify user is an admin of this club
        await ValidateClubAdminAsync(clubId, userId);

        // Check if club exists
        var clubTier = await _context.Clubs
            .AsNoTracking()
            .Where(c => c.Id == clubId)
            .Select(c => c.Tier)
            .FirstOrDefaultAsync();
        if (clubTier == null)
        {
            throw new InvalidOperationException("Club not found");
        }

        // Validate field type
        var supportedFieldTypes = new[] { "Text", "Number", "Boolean", "Dropdown", "Textarea" };
        if (!supportedFieldTypes.Contains(request.FieldType))
        {
            throw new InvalidOperationException($"Invalid field type. Supported types are: {string.Join(", ", supportedFieldTypes)}");
        }

        // Validate field label length
        if (request.FieldLabel.Length > 255)
        {
            throw new InvalidOperationException("Field label cannot exceed 255 characters");
        }

        // Validate dropdown options for dropdown field type
        if (request.FieldType == "Dropdown")
        {
            if (string.IsNullOrWhiteSpace(request.DropdownOptions))
            {
                throw new InvalidOperationException("Dropdown options are required for Dropdown field type");
            }
            var options = request.DropdownOptions.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(opt => opt.Trim())
                .Where(opt => !string.IsNullOrEmpty(opt))
                .ToArray();

            if (options.Length < 2)
            {
                throw new InvalidOperationException("Dropdown field type requires at least 2 valid options");
            }

            // Check for duplicates (case-insensitive)
            if (options.Select(opt => opt.ToLowerInvariant()).Distinct().Count() != options.Length)
            {
                throw new InvalidOperationException("Dropdown options must be unique");
            }

            // Check total length constraint (database limit is 2000 chars)
            if (string.Join(",", options).Length > 2000)
            {
                throw new InvalidOperationException("Dropdown options are too long. Please reduce the total length");
            }
        }
        else if (!string.IsNullOrEmpty(request.DropdownOptions))
        {
            throw new InvalidOperationException("Dropdown options should only be provided for Dropdown field type");
        }

        // Check maximum limit
        var currentCount = await _context.ClubCustomFields
            .CountAsync(cf => cf.ClubId == clubId);

        if (!HasUnlimitedCustomFields(clubTier) && currentCount >= MaxCustomFieldsPerClub)
        {
            throw new InvalidOperationException($"Maximum of {MaxCustomFieldsPerClub} custom fields allowed per club");
        }

        // Check for duplicate field label in this club
        var existingField = await _context.ClubCustomFields
            .AsNoTracking()
            .AnyAsync(cf => cf.ClubId == clubId && cf.FieldLabel == request.FieldLabel);

        if (existingField)
        {
            throw new InvalidOperationException("A custom field with this label already exists in the club");
        }

        var customField = new ClubCustomField
        {
            ClubId = clubId,
            FieldLabel = request.FieldLabel,
            FieldType = request.FieldType,
            DropdownOptions = request.DropdownOptions,
            IsRequired = request.IsRequired,
            CreatedAt = DateTime.UtcNow
        };

        _context.ClubCustomFields.Add(customField);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Custom field created successfully for club {ClubId}: CustomFieldId={CustomFieldId}, FieldLabel={FieldLabel}",
            clubId, customField.CustomFieldId, customField.FieldLabel);

        return new CustomFieldResponse
        {
            CustomFieldId = customField.CustomFieldId,
            ClubId = customField.ClubId,
            FieldLabel = customField.FieldLabel,
            FieldType = customField.FieldType,
            DropdownOptions = customField.DropdownOptions,
            IsRequired = customField.IsRequired,
            CreatedAt = customField.CreatedAt
        };
    }

    private static bool HasUnlimitedCustomFields(string tier)
    {
        return tier.Equals("Unlimited", StringComparison.OrdinalIgnoreCase)
            || tier.Equals("Expand", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Updates an existing custom field
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="customFieldId">The custom field ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The custom field update request</param>
    /// <returns>Updated custom field response</returns>
    public async Task<CustomFieldResponse> UpdateCustomFieldAsync(int clubId, int customFieldId, int userId, UpdateCustomFieldRequest request)
    {
        _logger.LogInformation("Updating custom field {CustomFieldId} for club {ClubId} by user {UserId}: FieldLabel={FieldLabel}, FieldType={FieldType}",
            customFieldId, clubId, userId, request.FieldLabel, request.FieldType);

        // Verify user is an admin of this club
        await ValidateClubAdminAsync(clubId, userId);

        var customField = await _context.ClubCustomFields
            .FirstOrDefaultAsync(cf => cf.CustomFieldId == customFieldId && cf.ClubId == clubId);

        if (customField == null)
        {
            throw new InvalidOperationException("Custom field not found");
        }

        // Validate field type
        var supportedFieldTypes = new[] { "Text", "Number", "Boolean", "Dropdown", "Textarea" };
        if (!supportedFieldTypes.Contains(request.FieldType))
        {
            throw new InvalidOperationException($"Invalid field type. Supported types are: {string.Join(", ", supportedFieldTypes)}");
        }

        // Validate field label length
        if (request.FieldLabel.Length > 255)
        {
            throw new InvalidOperationException("Field label cannot exceed 255 characters");
        }

        // Validate dropdown options for dropdown field type
        if (request.FieldType == "Dropdown")
        {
            if (string.IsNullOrWhiteSpace(request.DropdownOptions))
            {
                throw new InvalidOperationException("Dropdown options are required for Dropdown field type");
            }
            var options = request.DropdownOptions.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(opt => opt.Trim())
                .Where(opt => !string.IsNullOrEmpty(opt))
                .ToArray();

            if (options.Length < 2)
            {
                throw new InvalidOperationException("Dropdown field type requires at least 2 valid options");
            }

            // Check for duplicates (case-insensitive)
            if (options.Select(opt => opt.ToLowerInvariant()).Distinct().Count() != options.Length)
            {
                throw new InvalidOperationException("Dropdown options must be unique");
            }

            // Check total length constraint (database limit is 2000 chars)
            if (string.Join(",", options).Length > 2000)
            {
                throw new InvalidOperationException("Dropdown options are too long. Please reduce the total length");
            }
        }
        else if (!string.IsNullOrEmpty(request.DropdownOptions))
        {
            throw new InvalidOperationException("Dropdown options should only be provided for Dropdown field type");
        }

        // Check for duplicate field label in this club (excluding current field)
        var existingField = await _context.ClubCustomFields
            .AsNoTracking()
            .AnyAsync(cf => cf.ClubId == clubId && cf.FieldLabel == request.FieldLabel && cf.CustomFieldId != customFieldId);

        if (existingField)
        {
            throw new InvalidOperationException("A custom field with this label already exists in the club");
        }

        customField.FieldLabel = request.FieldLabel;
        customField.FieldType = request.FieldType;
        customField.DropdownOptions = request.DropdownOptions;
        customField.IsRequired = request.IsRequired;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Custom field updated successfully: CustomFieldId={CustomFieldId}, FieldLabel={FieldLabel}",
            customField.CustomFieldId, customField.FieldLabel);

        return new CustomFieldResponse
        {
            CustomFieldId = customField.CustomFieldId,
            ClubId = customField.ClubId,
            FieldLabel = customField.FieldLabel,
            FieldType = customField.FieldType,
            DropdownOptions = customField.DropdownOptions,
            IsRequired = customField.IsRequired,
            CreatedAt = customField.CreatedAt
        };
    }

    /// <summary>
    /// Deletes a custom field
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="customFieldId">The custom field ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if deleted successfully</returns>
    public async Task<bool> DeleteCustomFieldAsync(int clubId, int customFieldId, int userId)
    {
        _logger.LogInformation("Deleting custom field {CustomFieldId} for club {ClubId} by user {UserId}",
            customFieldId, clubId, userId);

        // Verify user is an admin of this club
        await ValidateClubAdminAsync(clubId, userId);

        var customField = await _context.ClubCustomFields
            .FirstOrDefaultAsync(cf => cf.CustomFieldId == customFieldId && cf.ClubId == clubId);

        if (customField == null)
        {
            throw new InvalidOperationException("Custom field not found");
        }

        // Check if custom field has associated member values
        var hasAssociatedValues = await _context.MemberCustomFieldValues
            .AsNoTracking()
            .AnyAsync(mcfv => mcfv.CustomFieldId == customFieldId);

        if (hasAssociatedValues)
        {
            throw new InvalidOperationException("Cannot delete custom field because it contains member data. Please remove all member values for this field first.");
        }

        _context.ClubCustomFields.Remove(customField);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Custom field deleted successfully: CustomFieldId={CustomFieldId}, FieldLabel={FieldLabel}",
            customFieldId, customField.FieldLabel);

        return true;
    }

    /// <summary>
    /// Validates that the user is an admin of the specified club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The user ID to validate</param>
    /// <exception cref="UnauthorizedAccessException">Thrown if user is not an admin</exception>
    private async Task ValidateClubAdminAsync(int clubId, int userId)
    {
        var isAdmin = await _context.ClubAdmins
            .AsNoTracking()
            .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

        if (!isAdmin)
        {
            throw new UnauthorizedAccessException("User is not authorized to manage custom fields for this club");
        }
    }
}
