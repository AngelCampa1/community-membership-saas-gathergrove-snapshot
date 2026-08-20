using GatherGrove.Application.DTOs.Locations;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing member transfers between locations
/// </summary>
public interface IMemberTransferService
{
    /// <summary>
    /// Creates a transfer request for a member
    /// </summary>
    Task<MemberTransferResponse> RequestTransferAsync(int memberId, int requestingUserId, CreateMemberTransferRequest request);

    /// <summary>
    /// Approves a transfer request and executes the transfer
    /// </summary>
    Task<MemberTransferResponse> ApproveTransferAsync(int transferId, int approvingUserId, ApproveTransferRequest request);

    /// <summary>
    /// Denies a transfer request
    /// </summary>
    Task<MemberTransferResponse> DenyTransferAsync(int transferId, int denyingUserId, DenyTransferRequest request);

    /// <summary>
    /// Gets all pending transfers for a location
    /// </summary>
    Task<List<MemberTransferResponse>> GetPendingTransfersAsync(int locationId, int userId);

    /// <summary>
    /// Gets transfer history for a member
    /// </summary>
    Task<List<MemberTransferResponse>> GetTransferHistoryAsync(int memberId, int userId);
}

