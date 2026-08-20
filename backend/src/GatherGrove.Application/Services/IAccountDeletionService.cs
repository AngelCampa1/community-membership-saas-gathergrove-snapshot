using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling complete account deletion workflow
/// Includes data export, subscription validation, and cascading deletion
/// </summary>
public interface IAccountDeletionService
{
    /// <summary>
    /// Validates whether an account can be deleted and returns requirements
    /// </summary>
    /// <param name="userId">User ID requesting deletion</param>
    /// <returns>Validation result with requirements and impact summary</returns>
    Task<AccountDeletionValidationResponse> ValidateAccountDeletionAsync(int userId);

    /// <summary>
    /// Initiates the account deletion process with validation and export
    /// </summary>
    /// <param name="userId">User ID requesting deletion</param>
    /// <param name="request">Deletion request with reason and preferences</param>
    /// <returns>Deletion request details with timeline</returns>
    Task<AccountDeletionResponse> RequestAccountDeletionAsync(int userId, AccountDeletionRequest request);

    /// <summary>
    /// Gets the current status of an account deletion request
    /// </summary>
    /// <param name="userId">User ID who requested deletion</param>
    /// <param name="deletionRequestId">Deletion request ID</param>
    /// <returns>Current status and progress</returns>
    Task<AccountDeletionStatusResponse> GetAccountDeletionStatusAsync(int userId, Guid deletionRequestId);

    /// <summary>
    /// Cancels a pending account deletion request
    /// </summary>
    /// <param name="userId">User ID who requested deletion</param>
    /// <param name="deletionRequestId">Deletion request ID to cancel</param>
    /// <returns>Task representing the async operation</returns>
    Task CancelAccountDeletionAsync(int userId, Guid deletionRequestId);

    /// <summary>
    /// Downloads the data export for a user
    /// </summary>
    /// <param name="userId">User ID requesting download</param>
    /// <param name="exportId">Export ID to download</param>
    /// <returns>File content and metadata</returns>
    Task<DataExportDownloadResponse> DownloadDataExportAsync(int userId, Guid exportId);

    /// <summary>
    /// Executes the actual account deletion (admin/system operation)
    /// </summary>
    /// <param name="request">Execution request with final confirmation</param>
    /// <returns>Task representing the async operation</returns>
    Task ExecuteAccountDeletionAsync(ExecuteAccountDeletionRequest request);

    /// <summary>
    /// Anonymizes a user's member data across all clubs (privacy compliance)
    /// </summary>
    /// <param name="userId">User ID to anonymize</param>
    /// <returns>Task representing the async operation</returns>
    Task AnonymizeMemberDataAsync(int userId);

    /// <summary>
    /// Transfers club ownership from deleted user to another admin
    /// </summary>
    /// <param name="fromUserId">Current owner user ID</param>
    /// <param name="toUserId">New owner user ID</param>
    /// <param name="clubId">Club ID to transfer</param>
    /// <returns>Task representing the async operation</returns>
    Task TransferClubOwnershipAsync(int fromUserId, int toUserId, int clubId);

    /// <summary>
    /// Gets available admin transfer targets for clubs where user is admin
    /// </summary>
    /// <param name="userId">User ID requesting transfer targets</param>
    /// <returns>List of potential admin transfer targets</returns>
    Task<List<AdminTransferTarget>> GetAdminTransferTargetsAsync(int userId);

    /// <summary>
    /// Initiates club ownership transfer process (for admin account deletion)
    /// </summary>
    /// <param name="fromUserId">Current admin user ID</param>
    /// <param name="request">Transfer request details</param>
    /// <returns>Transfer response with confirmation details</returns>
    Task<ClubOwnershipTransferResponse> TransferClubOwnershipAsync(int fromUserId, ClubOwnershipTransferRequest request);

    /// <summary>
    /// Validates club deletion scenario (when admin is only admin)
    /// </summary>
    /// <param name="adminUserId">Admin user ID</param>
    /// <param name="clubId">Club ID to potentially delete</param>
    /// <returns>Validation result for club deletion</returns>
    Task<ClubDeletionValidationResponse> ValidateClubDeletionAsync(int adminUserId, int clubId);
}

/// <summary>
/// Request for executing account deletion (admin operation)
/// </summary>
public class ExecuteAccountDeletionRequest
{
    /// <summary>
    /// User ID to delete
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Admin user ID performing the deletion
    /// </summary>
    public int AdminUserId { get; set; }

    /// <summary>
    /// Final confirmation that deletion should proceed
    /// </summary>
    public bool FinalConfirmation { get; set; }

    /// <summary>
    /// Optional: Transfer club ownership to this user ID
    /// </summary>
    public int? TransferOwnershipToUserId { get; set; }

    /// <summary>
    /// Whether to anonymize member data instead of deleting
    /// </summary>
    public bool AnonymizeMemberData { get; set; } = true;
}

/// <summary>
/// Response for data export download
/// </summary>
public class DataExportDownloadResponse
{
    /// <summary>
    /// File content as byte array
    /// </summary>
    public byte[] FileContent { get; set; } = Array.Empty<byte>();

    /// <summary>
    /// File name for download
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// MIME content type
    /// </summary>
    public string ContentType { get; set; } = "application/octet-stream";

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSize { get; set; }
}