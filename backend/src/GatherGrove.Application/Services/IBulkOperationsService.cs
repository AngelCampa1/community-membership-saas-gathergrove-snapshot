using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for managing bulk operations on members
/// Provides functionality for batch processing of member updates, tag assignments, and exports
/// </summary>
public interface IBulkOperationsService
{
    /// <summary>
    /// Creates a new bulk operation
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The bulk operation creation request</param>
    /// <returns>Created bulk operation response</returns>
    Task<BulkOperationResponse> CreateBulkOperationAsync(int clubId, int userId, CreateBulkOperationRequest request);

    /// <summary>
    /// Gets all bulk operations for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="status">Optional status filter</param>
    /// <returns>List of bulk operations</returns>
    Task<IEnumerable<BulkOperationResponse>> GetBulkOperationsAsync(int clubId, int userId, string? status = null);

    /// <summary>
    /// Gets a specific bulk operation by ID
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Bulk operation response</returns>
    Task<BulkOperationResponse> GetBulkOperationByIdAsync(int clubId, int operationId, int userId);

    /// <summary>
    /// Executes bulk tag assignment to members
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="memberIds">List of member IDs</param>
    /// <param name="tagIds">List of tag IDs to assign</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Bulk operation result</returns>
    Task<BulkOperationResult> ExecuteBulkAddTagsAsync(int clubId, int operationId, IEnumerable<int> memberIds, IEnumerable<int> tagIds, int userId);

    /// <summary>
    /// Executes bulk tag removal from members
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="memberIds">List of member IDs</param>
    /// <param name="tagIds">List of tag IDs to remove</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Bulk operation result</returns>
    Task<BulkOperationResult> ExecuteBulkRemoveTagsAsync(int clubId, int operationId, IEnumerable<int> memberIds, IEnumerable<int> tagIds, int userId);

    /// <summary>
    /// Executes bulk custom field updates for members
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="memberIds">List of member IDs</param>
    /// <param name="customFieldUpdates">Dictionary of custom field ID to new value</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Bulk operation result</returns>
    Task<BulkOperationResult> ExecuteBulkUpdateCustomFieldsAsync(int clubId, int operationId, IEnumerable<int> memberIds, Dictionary<int, string> customFieldUpdates, int userId);

    /// <summary>
    /// Executes bulk member export to specified format
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="memberIds">List of member IDs to export</param>
    /// <param name="exportFormat">Export format (CSV, Excel, JSON)</param>
    /// <param name="includeFields">List of fields to include in export</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Bulk operation result with export data</returns>
    Task<BulkOperationResult> ExecuteBulkExportMembersAsync(int clubId, int operationId, IEnumerable<int> memberIds, string exportFormat, IEnumerable<string> includeFields, int userId);

    /// <summary>
    /// Executes bulk member deletion (soft delete)
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="memberIds">List of member IDs to delete</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Bulk operation result</returns>
    Task<BulkOperationResult> ExecuteBulkDeleteMembersAsync(int clubId, int operationId, IEnumerable<int> memberIds, int userId);

    /// <summary>
    /// Executes bulk membership type update for members
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="memberIds">List of member IDs</param>
    /// <param name="newMembershipTypeId">New membership type ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Bulk operation result</returns>
    Task<BulkOperationResult> ExecuteBulkUpdateMembershipTypeAsync(int clubId, int operationId, IEnumerable<int> memberIds, int newMembershipTypeId, int userId);

    /// <summary>
    /// Gets the progress of a bulk operation
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Bulk operation progress</returns>
    Task<BulkOperationProgress> GetBulkOperationProgressAsync(int clubId, int operationId, int userId);

    /// <summary>
    /// Cancels a pending or in-progress bulk operation
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if cancelled successfully</returns>
    Task<bool> CancelBulkOperationAsync(int clubId, int operationId, int userId);

    /// <summary>
    /// Retries a failed bulk operation
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Retried bulk operation response</returns>
    Task<BulkOperationResponse> RetryBulkOperationAsync(int clubId, int operationId, int userId);

    /// <summary>
    /// Gets bulk operation history for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="days">Number of days of history to retrieve</param>
    /// <returns>List of historical bulk operations</returns>
    Task<IEnumerable<BulkOperationResponse>> GetBulkOperationHistoryAsync(int clubId, int userId, int days = 30);

    /// <summary>
    /// Gets bulk operation statistics for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="days">Number of days to analyze</param>
    /// <returns>Bulk operation statistics</returns>
    Task<BulkOperationStatsResponse> GetBulkOperationStatsAsync(int clubId, int userId, int days = 30);

    /// <summary>
    /// Schedules a bulk operation to run at a specific time
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="scheduledTime">When to execute the operation</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if scheduled successfully</returns>
    Task<bool> ScheduleBulkOperationAsync(int clubId, int operationId, DateTime scheduledTime, int userId);

    /// <summary>
    /// Bulk assign tags to multiple members
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The bulk tag assignment request</param>
    /// <returns>Bulk tag operation result</returns>
    Task<BulkTagOperationResult> BulkAssignTagsAsync(int clubId, int userId, BulkAssignTagsRequest request);

    /// <summary>
    /// Bulk remove tags from multiple members
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The bulk tag removal request</param>
    /// <returns>Bulk tag operation result</returns>
    Task<BulkTagOperationResult> BulkRemoveTagsAsync(int clubId, int userId, BulkRemoveTagsRequest request);

    /// <summary>
    /// Bulk update custom field values for multiple members
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The bulk custom field update request</param>
    /// <returns>Bulk custom field operation result</returns>
    Task<BulkCustomFieldResult> BulkUpdateCustomFieldsAsync(int clubId, int userId, BulkUpdateCustomFieldsRequest request);

    /// <summary>
    /// Bulk update member statuses
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The bulk status update request</param>
    /// <returns>Bulk member update result</returns>
    Task<BulkMemberUpdateResult> BulkUpdateMemberStatusAsync(int clubId, int userId, BulkUpdateMemberStatusRequest request);

    /// <summary>
    /// Bulk export members based on filter criteria
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The bulk export request</param>
    /// <returns>Bulk export result</returns>
    Task<BulkExportResult> BulkExportMembersAsync(int clubId, int userId, BulkExportRequest request);

    /// <summary>
    /// Bulk import members from uploaded file
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The bulk import request</param>
    /// <returns>Bulk import result</returns>
    Task<BulkImportResult> BulkImportMembersAsync(int clubId, int userId, BulkImportRequest request);

    /// <summary>
    /// Gets the status of a bulk operation
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Bulk operation status</returns>
    Task<BulkOperationStatus> GetOperationStatusAsync(int clubId, string operationId, int userId);

    /// <summary>
    /// Cancels a running bulk operation
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="operationId">The bulk operation ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if cancelled successfully</returns>
    Task<bool> CancelOperationAsync(int clubId, string operationId, int userId);
}