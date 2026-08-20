using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing member transfers between locations
/// </summary>
public class MemberTransferService : IMemberTransferService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<MemberTransferService> _logger;

    public MemberTransferService(
        GatherGroveDbContext context,
        ILogger<MemberTransferService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates a transfer request for a member
    /// </summary>
    public async Task<MemberTransferResponse> RequestTransferAsync(int memberId, int requestingUserId, CreateMemberTransferRequest request)
    {
        _logger.LogInformation("Creating transfer request for member {MemberId} to location {ToLocationId} by user {UserId}",
            memberId, request.ToLocationId, requestingUserId);

        var member = await _context.Members
            .Include(m => m.Club)
            .Include(m => m.ClubLocation)
            .FirstOrDefaultAsync(m => m.Id == memberId);

        if (member == null)
        {
            throw new ArgumentException($"Member {memberId} not found", nameof(memberId));
        }

        if (!member.LocationId.HasValue)
        {
            throw new InvalidOperationException("Member is not assigned to a location");
        }

        // Verify requesting user has permission (club admin or location admin)
        var hasPermission = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == member.ClubId && ca.UserId == requestingUserId);

        if (!hasPermission)
        {
            hasPermission = await _context.LocationAdmins
                .AnyAsync(la => la.LocationId == member.LocationId &&
                               la.UserId == requestingUserId &&
                               la.PermissionLevel <= LocationPermissionLevel.LocationAdmin);
        }

        if (!hasPermission)
        {
            throw new UnauthorizedAccessException("You do not have permission to request transfers for this member");
        }

        // Verify target location exists and belongs to same club
        var toLocation = await _context.ClubLocations
            .FirstOrDefaultAsync(l => l.Id == request.ToLocationId);

        if (toLocation == null)
        {
            throw new ArgumentException($"Target location {request.ToLocationId} not found", nameof(request.ToLocationId));
        }

        if (toLocation.ParentClubId != member.ClubId)
        {
            throw new InvalidOperationException("Cannot transfer member to a location in a different club");
        }

        if (member.LocationId.Value == request.ToLocationId)
        {
            throw new InvalidOperationException("Member is already at the target location");
        }

        // Check for pending transfers
        var pendingTransfer = await _context.MemberTransfers
            .FirstOrDefaultAsync(t => t.MemberId == memberId && t.Status == MemberTransferStatus.Pending);

        if (pendingTransfer != null)
        {
            throw new InvalidOperationException("Member already has a pending transfer request");
        }

        var transfer = new MemberTransfer
        {
            MemberId = memberId,
            FromLocationId = member.LocationId.Value,
            ToLocationId = request.ToLocationId,
            TransferReason = request.TransferReason,
            RequestedAt = DateTime.UtcNow,
            RequestedBy = requestingUserId,
            Status = MemberTransferStatus.Pending
        };

        _context.MemberTransfers.Add(transfer);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created transfer request {TransferId} for member {MemberId}", transfer.Id, memberId);

        return await GetTransferResponseAsync(transfer.Id);
    }

    /// <summary>
    /// Approves a transfer request and executes the transfer
    /// </summary>
    public async Task<MemberTransferResponse> ApproveTransferAsync(int transferId, int approvingUserId, ApproveTransferRequest request)
    {
        _logger.LogInformation("Approving transfer {TransferId} by user {UserId}", transferId, approvingUserId);

        var transfer = await _context.MemberTransfers
            .Include(t => t.Member)
            .Include(t => t.ToLocation)
            .FirstOrDefaultAsync(t => t.Id == transferId);

        if (transfer == null)
        {
            throw new ArgumentException($"Transfer {transferId} not found", nameof(transferId));
        }

        if (transfer.Status != MemberTransferStatus.Pending)
        {
            throw new InvalidOperationException($"Transfer is already {transfer.Status}");
        }

        // Verify approving user has permission for target location
        var hasPermission = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == transfer.ToLocation.ParentClubId && ca.UserId == approvingUserId);

        if (!hasPermission)
        {
            hasPermission = await _context.LocationAdmins
                .AnyAsync(la => la.LocationId == transfer.ToLocationId &&
                               la.UserId == approvingUserId &&
                               la.PermissionLevel <= LocationPermissionLevel.LocationAdmin);
        }

        if (!hasPermission)
        {
            throw new UnauthorizedAccessException("You do not have permission to approve transfers for this location");
        }

        // Execute the transfer
        transfer.Member.LocationId = transfer.ToLocationId;
        transfer.Member.UpdatedAt = DateTime.UtcNow;

        transfer.Status = MemberTransferStatus.Approved;
        transfer.ApprovedAt = DateTime.UtcNow;
        transfer.ApprovedBy = approvingUserId;
        transfer.ApprovalNotes = request.ApprovalNotes;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Approved and executed transfer {TransferId}", transferId);

        return await GetTransferResponseAsync(transferId);
    }

    /// <summary>
    /// Denies a transfer request
    /// </summary>
    public async Task<MemberTransferResponse> DenyTransferAsync(int transferId, int denyingUserId, DenyTransferRequest request)
    {
        _logger.LogInformation("Denying transfer {TransferId} by user {UserId}", transferId, denyingUserId);

        var transfer = await _context.MemberTransfers
            .Include(t => t.ToLocation)
            .FirstOrDefaultAsync(t => t.Id == transferId);

        if (transfer == null)
        {
            throw new ArgumentException($"Transfer {transferId} not found", nameof(transferId));
        }

        if (transfer.Status != MemberTransferStatus.Pending)
        {
            throw new InvalidOperationException($"Transfer is already {transfer.Status}");
        }

        // Verify denying user has permission
        var hasPermission = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == transfer.ToLocation.ParentClubId && ca.UserId == denyingUserId);

        if (!hasPermission)
        {
            hasPermission = await _context.LocationAdmins
                .AnyAsync(la => la.LocationId == transfer.ToLocationId &&
                               la.UserId == denyingUserId &&
                               la.PermissionLevel <= LocationPermissionLevel.LocationAdmin);
        }

        if (!hasPermission)
        {
            throw new UnauthorizedAccessException("You do not have permission to deny transfers for this location");
        }

        transfer.Status = MemberTransferStatus.Denied;
        transfer.ApprovalNotes = request.DenialReason;
        transfer.ApprovedAt = DateTime.UtcNow;
        transfer.ApprovedBy = denyingUserId;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Denied transfer {TransferId}", transferId);

        return await GetTransferResponseAsync(transferId);
    }

    /// <summary>
    /// Gets all pending transfers for a location
    /// </summary>
    public async Task<List<MemberTransferResponse>> GetPendingTransfersAsync(int locationId, int userId)
    {
        _logger.LogInformation("Getting pending transfers for location {LocationId} by user {UserId}",
            locationId, userId);

        var location = await _context.ClubLocations
            .FirstOrDefaultAsync(l => l.Id == locationId);

        if (location == null)
        {
            throw new ArgumentException($"Location {locationId} not found", nameof(locationId));
        }

        // Verify user has access
        var hasAccess = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == location.ParentClubId && ca.UserId == userId);

        if (!hasAccess)
        {
            hasAccess = await _context.LocationAdmins
                .AnyAsync(la => la.LocationId == locationId && la.UserId == userId);
        }

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException("You do not have permission to view transfers for this location");
        }

        var transfers = await _context.MemberTransfers
            .Where(t => t.ToLocationId == locationId && t.Status == MemberTransferStatus.Pending)
            .OrderBy(t => t.RequestedAt)
            .ToListAsync();

        var responses = new List<MemberTransferResponse>();
        foreach (var transfer in transfers)
        {
            responses.Add(await GetTransferResponseAsync(transfer.Id));
        }

        return responses;
    }

    /// <summary>
    /// Gets transfer history for a member
    /// </summary>
    public async Task<List<MemberTransferResponse>> GetTransferHistoryAsync(int memberId, int userId)
    {
        _logger.LogInformation("Getting transfer history for member {MemberId} by user {UserId}",
            memberId, userId);

        var member = await _context.Members
            .FirstOrDefaultAsync(m => m.Id == memberId);

        if (member == null)
        {
            throw new ArgumentException($"Member {memberId} not found", nameof(memberId));
        }

        // Verify user has access
        var hasAccess = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == member.ClubId && ca.UserId == userId);

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException("You do not have permission to view transfer history for this member");
        }

        var transfers = await _context.MemberTransfers
            .Where(t => t.MemberId == memberId)
            .OrderByDescending(t => t.RequestedAt)
            .ToListAsync();

        var responses = new List<MemberTransferResponse>();
        foreach (var transfer in transfers)
        {
            responses.Add(await GetTransferResponseAsync(transfer.Id));
        }

        return responses;
    }

    private async Task<MemberTransferResponse> GetTransferResponseAsync(int transferId)
    {
        var transfer = await _context.MemberTransfers
            .Include(t => t.Member)
            .Include(t => t.FromLocation)
            .Include(t => t.ToLocation)
            .Include(t => t.RequestedByUser)
            .Include(t => t.ApprovedByUser)
            .AsNoTracking()
            .FirstAsync(t => t.Id == transferId);

        return new MemberTransferResponse
        {
            Id = transfer.Id,
            MemberId = transfer.MemberId,
            MemberName = transfer.Member.FullName,
            MemberEmail = transfer.Member.Email,
            FromLocationId = transfer.FromLocationId,
            FromLocationName = transfer.FromLocation.LocationName,
            ToLocationId = transfer.ToLocationId,
            ToLocationName = transfer.ToLocation.LocationName,
            TransferReason = transfer.TransferReason,
            Status = transfer.Status,
            StatusName = transfer.Status.ToString(),
            RequestedAt = transfer.RequestedAt,
            RequestedBy = transfer.RequestedBy,
            RequestedByName = transfer.RequestedByUser.FullName,
            ApprovedAt = transfer.ApprovedAt,
            ApprovedBy = transfer.ApprovedBy,
            ApprovedByName = transfer.ApprovedByUser?.FullName,
            ApprovalNotes = transfer.ApprovalNotes
        };
    }
}

