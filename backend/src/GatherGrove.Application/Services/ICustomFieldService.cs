using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for managing club custom fields for member profiles
/// </summary>
public interface ICustomFieldService
{
    /// <summary>
    /// Gets all custom fields for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>List of custom fields</returns>
    Task<IEnumerable<CustomFieldResponse>> GetCustomFieldsAsync(int clubId, int userId);

    /// <summary>
    /// Gets a specific custom field by ID
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="customFieldId">The custom field ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Custom field response</returns>
    Task<CustomFieldResponse> GetCustomFieldByIdAsync(int clubId, int customFieldId, int userId);

    /// <summary>
    /// Creates a new custom field for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The custom field creation request</param>
    /// <returns>Created custom field response</returns>
    Task<CustomFieldResponse> CreateCustomFieldAsync(int clubId, int userId, CreateCustomFieldRequest request);

    /// <summary>
    /// Updates an existing custom field
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="customFieldId">The custom field ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The custom field update request</param>
    /// <returns>Updated custom field response</returns>
    Task<CustomFieldResponse> UpdateCustomFieldAsync(int clubId, int customFieldId, int userId, UpdateCustomFieldRequest request);

    /// <summary>
    /// Deletes a custom field
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="customFieldId">The custom field ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteCustomFieldAsync(int clubId, int customFieldId, int userId);
}