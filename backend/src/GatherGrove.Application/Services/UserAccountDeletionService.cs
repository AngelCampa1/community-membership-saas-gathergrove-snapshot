using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling complete user account deletion with cascading effects
/// Implements GDPR compliance and data protection requirements
/// BUG FIX: Implements both IUserAccountDeletionService and IAccountDeletionService to resolve circular dependency
/// </summary>
public class UserAccountDeletionService : IUserAccountDeletionService, IAccountDeletionService
{
    private readonly GatherGroveDbContext _context;
    private readonly IDataExportService _dataExportService;
    private readonly ILogger<UserAccountDeletionService> _logger;

    public UserAccountDeletionService(
        GatherGroveDbContext context,
        IDataExportService dataExportService,
        ILogger<UserAccountDeletionService> logger)
    {
        _context = context;
        _dataExportService = dataExportService;
        _logger = logger;
    }

    /// <summary>
    /// Validates whether an account can be deleted and returns requirements
    /// </summary>
    public async Task<AccountDeletionValidationResponse> ValidateAccountDeletionAsync(int userId)
    {
        _logger.LogInformation("Starting account deletion validation for user {UserId}", userId);

        var user = await _context.Users
            .Include(u => u.ClubAdmins)
                .ThenInclude(ca => ca.Club)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new AccountDeletionValidationResponse
            {
                CanDelete = false,
                ValidationErrors = new List<string> { "User not found" },
                EstimatedDeletionTime = TimeSpan.FromMinutes(30),
                ImpactSummary = new DeletionImpactSummary()
            };
        }

        var response = new AccountDeletionValidationResponse
        {
            CanDelete = true,
            EstimatedDeletionTime = TimeSpan.FromMinutes(30),
            ImpactSummary = new DeletionImpactSummary()
        };

        // Check if user is admin for any clubs
        var isUserAdmin = user.ClubAdmins.Any();
        response.IsAdminAccount = isUserAdmin;

        if (isUserAdmin)
        {
            // BUG FIX: ClubAdmin doesn't have Role property - all admins are equal
            // Count total clubs administered without role distinction
            response.AdminInfo = new AdminDeletionInfo
            {
                PrimaryClubsCount = user.ClubAdmins.Count(), // All clubs count as primary
                SecondaryClubsCount = 0, // No role differentiation
                ExtendedGracePeriodDays = 30,
                HasActiveBilling = false // Would check actual billing status
            };

            // Pre-fetch all club statistics in a single query to avoid N+1 problem
            var clubIds = user.ClubAdmins.Select(ca => ca.ClubId).ToList();

            var clubStats = await _context.Clubs
                .Where(c => clubIds.Contains(c.Id))
                .Select(c => new
                {
                    ClubId = c.Id,
                    MemberCount = c.Members.Count(m => m.Status == "Active"), // BUG FIX: Use Status instead of IsActive
                    EventCount = c.Events.Count(),
                    AdminCount = c.ClubAdmins.Count()
                })
                .ToDictionaryAsync(x => x.ClubId);

            // Analyze club impact
            foreach (var clubAdmin in user.ClubAdmins)
            {
                var club = clubAdmin.Club;
                var stats = clubStats[club.Id];

                // BUG FIX: No Role property - check if user is the ONLY admin
                if (stats.AdminCount == 1)
                {
                    // This club will be deleted (user is sole admin)
                    response.AdminInfo.ClubsToBeDeleted.Add(new ClubDeletionInfo
                    {
                        ClubId = club.Id,
                        ClubName = club.Name,
                        MemberCount = stats.MemberCount,
                        EventCount = stats.EventCount,
                        HasActiveSubscription = false // Would check actual subscription status
                    });
                }
                else
                {
                    // Club has multiple admins - can be transferred
                    response.AdminInfo.ClubsToTransfer.Add(new ClubTransferInfo
                    {
                        ClubId = club.Id,
                        ClubName = club.Name,
                        CurrentAdminCount = stats.AdminCount,
                        RequiresNewAdmin = true
                    });
                }
            }

            // Add admin-specific requirements
            response.RequiredActions.Add("Transfer ownership of clubs with multiple administrators");
            response.RequiredActions.Add("Or confirm deletion of clubs where you are the only administrator");
            response.RequiredActions.Add("Download all club data before deletion");
        }
        else
        {
            // Regular member deletion
            response.RequiredActions.Add("Download personal data");
            response.RequiredActions.Add("Confirm understanding of data deletion");
        }

        _logger.LogInformation("Account deletion validation completed for user {UserId}: CanDelete={CanDelete}, IsAdmin={IsAdmin}",
            userId, response.CanDelete, response.IsAdminAccount);

        return response;
    }

    /// <summary>
    /// Gets the impact summary of what will be deleted
    /// </summary>
    public async Task<AccountDeletionImpact> GetAccountDeletionImpactAsync(int userId)
    {
        _logger.LogInformation("Calculating account deletion impact for user {UserId}", userId);

        var impact = new AccountDeletionImpact();

        // BUG FIX: ClubAdmin doesn't have Role property - count all clubs where user is admin
        impact.OwnedClubsCount = await _context.ClubAdmins
            .Where(ca => ca.UserId == userId)
            .CountAsync();

        // Count memberships - match by email since Member doesn't have UserId
        var user = await _context.Users.FindAsync(userId);
        impact.MembershipCount = user != null
            ? await _context.Set<Member>()
                .Where(m => m.Email == user.Email)
                .CountAsync()
            : 0;

        // Count events created - match by clubs user administers
        impact.CreatedEventsCount = user != null
            ? await _context.Set<Event>()
                .Where(e => _context.ClubAdmins.Any(ca => ca.ClubId == e.ClubId && ca.UserId == userId))
                .CountAsync()
            : 0;

        // Count payment records - through member relationship
        impact.PaymentRecordsCount = user != null
            ? await _context.Set<Payment>()
                .Where(p => p.MemberId != null && _context.Set<Member>()
                    .Any(m => m.Id == p.MemberId && m.Email == user.Email))
                .CountAsync()
            : 0;

        // Estimate data export size
        impact.EstimatedDataSizeBytes = await EstimateUserDataSizeAsync(userId);

        _logger.LogInformation("Account deletion impact calculated for user {UserId}. Clubs: {ClubCount}, Memberships: {MembershipCount}",
            userId, impact.OwnedClubsCount, impact.MembershipCount);

        return impact;
    }

    /// <summary>
    /// Executes the complete account deletion process
    /// </summary>
    public async Task<AccountDeletionResult> DeleteUserAccountAsync(int userId, AccountDeletionOptions? options = null)
    {
        _logger.LogInformation("Starting account deletion process for user {UserId}", userId);

        var result = new AccountDeletionResult { UserId = userId, StartedAt = DateTime.UtcNow };
        var deletionSteps = new List<string>();

        try
        {
            // Step 1: Validate deletion can proceed
            var validation = await ValidateAccountDeletionAsync(userId);
            // BUG FIX: Use CanDelete and RequiredActions properties that exist in AccountDeletionValidationResponse
            if (!validation.CanDelete || validation.RequiredActions.Any())
            {
                result.Success = false;
                result.ErrorMessages = validation.ValidationErrors.Concat(validation.RequiredActions).ToList();
                return result;
            }

            // Step 2: Create data export if requested
            if (options?.CreateDataExport == true)
            {
                _logger.LogInformation("Creating data export for user {UserId}", userId);
                var exportResult = await _dataExportService.ExportUserDataAsync(userId);
                result.DataExportId = exportResult.ExportId;
                deletionSteps.Add("Data export created");
            }

            // Step 3: Begin database transaction for atomic deletion
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Step 4: Handle club ownership transfers or deletions
                await HandleClubOwnershipAsync(userId, options?.TransferOwnershipToUserId);
                deletionSteps.Add("Club ownership handled");

                // Step 5: Anonymize or remove member data based on options
                await HandleMemberDataAsync(userId, options?.MemberDataHandling ?? MemberDataHandling.Anonymize);
                deletionSteps.Add("Member data processed");

                // Step 6: Handle cascading deletions
                await DeleteUserRelatedDataAsync(userId);
                deletionSteps.Add("Related data deleted");

                // Step 7: Delete the user account
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    _context.Users.Remove(user);
                    deletionSteps.Add("User account deleted");
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                result.Success = true;
                result.CompletedAt = DateTime.UtcNow;
                result.DeletionSteps = deletionSteps;

                _logger.LogInformation("Account deletion completed successfully for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Account deletion failed for user {UserId}", userId);
            result.Success = false;
            result.ErrorMessages = new List<string> { $"Account deletion failed: {ex.Message}" };
        }

        return result;
    }

    /// <summary>
    /// Handles club ownership transfer or deletion
    /// </summary>
    private async Task HandleClubOwnershipAsync(int userId, int? transferToUserId = null)
    {
        // BUG FIX: ClubAdmin doesn't have Role property - get all clubs where user is admin
        var adminClubs = await _context.ClubAdmins
            .Where(ca => ca.UserId == userId)
            .Include(ca => ca.Club)
            .ToListAsync();

        foreach (var clubAdmin in adminClubs)
        {
            // Check if this is the only admin for this club
            var adminCount = await _context.ClubAdmins.CountAsync(ca => ca.ClubId == clubAdmin.ClubId);

            if (transferToUserId.HasValue && adminCount == 1)
            {
                // Add new admin before removing current admin
                await TransferClubOwnershipAsync(userId, transferToUserId.Value, clubAdmin.ClubId);
            }
            else if (!transferToUserId.HasValue && adminCount == 1)
            {
                // Delete the club if user is sole admin and no transfer specified
                _context.Clubs.Remove(clubAdmin.Club);
            }
            // If multiple admins exist, just remove this admin relationship (handled elsewhere)
        }
    }

    /// <summary>
    /// Handles member data based on specified handling option
    /// </summary>
    private async Task HandleMemberDataAsync(int userId, MemberDataHandling handling)
    {
        switch (handling)
        {
            case MemberDataHandling.Anonymize:
                // BUG FIX: Call method directly instead of via circular dependency
                await AnonymizeMemberDataAsync(userId);
                break;
            case MemberDataHandling.Remove:
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    var members = await _context.Set<Member>()
                        .Where(m => m.Email == user.Email)
                        .ToListAsync();
                    _context.Set<Member>().RemoveRange(members);
                }
                break;
            case MemberDataHandling.Retain:
                // Keep member data as-is for historical purposes
                break;
        }
    }

    /// <summary>
    /// Deletes user-related data with proper cascading
    /// </summary>
    private async Task DeleteUserRelatedDataAsync(int userId)
    {
        // The Entity Framework cascade deletions will handle most relationships
        // Only explicitly handle special cases that need custom logic

        // Delete device tokens
        var deviceTokens = await _context.UserDeviceTokens
            .Where(dt => dt.UserId == userId)
            .ToListAsync();
        _context.UserDeviceTokens.RemoveRange(deviceTokens);

        // Delete password reset tokens
        var resetTokens = await _context.PasswordResetTokens
            .Where(rt => rt.UserId == userId)
            .ToListAsync();
        _context.PasswordResetTokens.RemoveRange(resetTokens);
    }

    /// <summary>
    /// Estimates the total data size for a user
    /// </summary>
    private async Task<long> EstimateUserDataSizeAsync(int userId)
    {
        // Simple estimation based on typical data sizes
        // In a real implementation, this would be more sophisticated

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return 0;

        var memberCount = await _context.Set<Member>().Where(m => m.Email == user.Email).CountAsync();
        var eventCount = await _context.Set<Event>()
            .Where(e => _context.ClubAdmins.Any(ca => ca.ClubId == e.ClubId && ca.UserId == userId))
            .CountAsync();
        var paymentCount = await _context.Set<Payment>()
            .Where(p => _context.Set<Member>()
                .Any(m => m.Id == p.MemberId && m.Email == user.Email))
            .CountAsync();

        // Rough estimation: 1KB per member, 2KB per event, 0.5KB per payment
        return (memberCount * 1024) + (eventCount * 2048) + (paymentCount * 512);
    }

    /// <summary>
    /// Gets potential transfer targets for admin-owned clubs
    /// </summary>
    public async Task<List<AdminTransferTarget>> GetAdminTransferTargetsAsync(int userId)
    {
        _logger.LogInformation("Getting transfer targets for admin user {UserId}", userId);

        // Get clubs where user is admin
        var userClubs = await _context.ClubAdmins
            .Where(ca => ca.UserId == userId)
            .Select(ca => ca.ClubId)
            .ToListAsync();

        if (!userClubs.Any())
        {
            return new List<AdminTransferTarget>();
        }

        // BUG FIX: AdminTransferTarget structure - has FullName, ClubIds list, and Role
        // Group by user to collect all clubs they admin
        var adminGroups = await _context.ClubAdmins
            .Where(ca => userClubs.Contains(ca.ClubId) && ca.UserId != userId)
            .Include(ca => ca.User)
            .GroupBy(ca => ca.UserId)
            .Select(g => new AdminTransferTarget
            {
                UserId = g.Key,
                FullName = g.First().User.FullName,
                Email = g.First().User.Email,
                ClubIds = g.Select(ca => ca.ClubId).ToList(),
                Role = "Admin" // All admins have same role (no differentiation)
            })
            .ToListAsync();

        var potentialTargets = adminGroups;

        _logger.LogInformation("Found {Count} potential transfer targets for user {UserId}",
            potentialTargets.Count, userId);

        return potentialTargets;
    }

    /// <summary>
    /// Transfers club ownership from one user to another
    /// </summary>
    public async Task<ClubOwnershipTransferResponse> TransferClubOwnershipAsync(int fromUserId, ClubOwnershipTransferRequest request)
    {
        // BUG FIX: Use TargetUserId from request
        _logger.LogInformation("Transferring club ownership from user {FromUserId} to user {ToUserId} for club {ClubId}",
            fromUserId, request.TargetUserId, request.ClubId);

        // BUG FIX: ClubOwnershipTransferResponse has different properties
        var response = new ClubOwnershipTransferResponse
        {
            TransferId = Guid.NewGuid(),
            Status = "Processing",
            RequiresTargetConfirmation = request.RequireTargetConfirmation,
            ScheduledTransferDate = request.ScheduledTransferDate
        };

        try
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            // BUG FIX: ClubAdmin doesn't have Role property - validate user is admin of club
            var fromAdmin = await _context.ClubAdmins
                .FirstOrDefaultAsync(ca => ca.UserId == fromUserId && ca.ClubId == request.ClubId);

            if (fromAdmin == null)
            {
                response.Status = "Failed";
                response.RequiredActions.Add("Source user is not an admin of this club");
                return response;
            }

            // BUG FIX: Use TargetUserId from request
            var toUser = await _context.Users.FindAsync(request.TargetUserId);
            if (toUser == null)
            {
                response.Status = "Failed";
                response.RequiredActions.Add("Target user not found");
                return response;
            }

            // Check if target user is already an admin of this club
            var existingAdmin = await _context.ClubAdmins
                .FirstOrDefaultAsync(ca => ca.UserId == request.TargetUserId && ca.ClubId == request.ClubId);

            if (existingAdmin == null)
            {
                // BUG FIX: No Role property - add new admin without role
                _context.ClubAdmins.Add(new ClubAdmin
                {
                    UserId = request.TargetUserId,
                    ClubId = request.ClubId,
                    CreatedAt = DateTime.UtcNow
                });
            }
            // If already an admin, no changes needed

            // For account deletion scenario, always remove the original admin
            if (request.IsPartOfAccountDeletion)
            {
                _context.ClubAdmins.Remove(fromAdmin);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            response.Status = "Completed";
            if (request.RequireTargetConfirmation)
            {
                response.TargetConfirmationToken = Guid.NewGuid().ToString();
                response.TokenExpirationDate = DateTime.UtcNow.AddDays(7);
            }

            _logger.LogInformation("Club ownership transfer completed successfully for club {ClubId}", request.ClubId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Club ownership transfer failed for club {ClubId}", request.ClubId);
            response.Status = "Failed";
            response.RequiredActions.Add($"Transfer failed: {ex.Message}");
        }

        return response;
    }

    /// <summary>
    /// Validates if a club can be deleted by an admin
    /// </summary>
    public async Task<ClubDeletionValidationResponse> ValidateClubDeletionAsync(int adminUserId, int clubId)
    {
        _logger.LogInformation("Validating club deletion for admin user {AdminUserId} and club {ClubId}",
            adminUserId, clubId);

        var response = new ClubDeletionValidationResponse
        {
            ClubId = clubId,
            AdminUserId = adminUserId,
            CanDelete = false
        };

        try
        {
            // BUG FIX: ClubAdmin doesn't have Role property - check if user is admin of club
            var admin = await _context.ClubAdmins
                .Include(ca => ca.Club)
                .FirstOrDefaultAsync(ca => ca.UserId == adminUserId && ca.ClubId == clubId);

            if (admin == null)
            {
                response.Reason = "User is not an admin of this club";
                return response;
            }

            var club = admin.Club;
            response.ClubName = club.Name;

            // Count club members and admins
            var memberCount = await _context.Members.CountAsync(m => m.ClubId == clubId);
            var adminCount = await _context.ClubAdmins.CountAsync(ca => ca.ClubId == clubId);

            response.MemberCount = memberCount;
            response.AdminCount = adminCount;

            // Check for active subscriptions or billing (placeholder)
            response.HasActiveBilling = false; // Would check actual billing status

            // Check for upcoming events
            var upcomingEventCount = await _context.Events
                .CountAsync(e => e.ClubId == clubId && e.EventDateTime > DateTime.UtcNow);

            response.UpcomingEventCount = upcomingEventCount;

            // Deletion is allowed if there are no other admins or if admin explicitly confirms
            response.CanDelete = adminCount <= 1;
            response.RequiresConfirmation = adminCount > 1 || memberCount > 10 || upcomingEventCount > 0;

            if (response.CanDelete)
            {
                response.Reason = "Club can be deleted - no other administrators found";
            }
            else
            {
                response.Reason = "Club deletion requires additional confirmation due to multiple administrators or active members";
            }

            _logger.LogInformation("Club deletion validation completed for club {ClubId}: CanDelete={CanDelete}, Reason={Reason}",
                clubId, response.CanDelete, response.Reason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Club deletion validation failed for club {ClubId}", clubId);
            response.Reason = $"Validation failed: {ex.Message}";
        }

        return response;
    }

    // ============================================================
    // IAccountDeletionService Implementation (BUG FIX)
    // ============================================================

    /// <summary>
    /// Initiates the account deletion process with validation and export
    /// </summary>
    public async Task<AccountDeletionResponse> RequestAccountDeletionAsync(int userId, GatherGrove.Application.DTOs.AccountDeletionRequest request)
    {
        _logger.LogInformation("Account deletion requested by user {UserId}", userId);

        var validation = await ValidateAccountDeletionAsync(userId);

        // BUG FIX: AccountDeletionResponse has different properties
        var response = new AccountDeletionResponse
        {
            DeletionRequestId = Guid.NewGuid(),
            Status = validation.CanDelete ? "Pending" : "RequiresAction",
            RequiresManualReview = validation.IsAdminAccount,
            EstimatedCompletionDate = DateTime.UtcNow.AddDays(30), // GDPR 30-day grace period
            RequiredActions = validation.RequiredActions,
            Warnings = validation.ValidationErrors
        };

        // Create data export automatically
        if (validation.CanDelete)
        {
            try
            {
                var exportResult = await _dataExportService.ExportUserDataAsync(userId);
                response.DataExportId = exportResult.ExportId;
                response.DataExportFilePath = exportResult.DownloadUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create data export for user {UserId}", userId);
                response.Status = "ExportFailed";
                response.Warnings.Add($"Data export failed: {ex.Message}");
            }
        }

        return response;
    }

    /// <summary>
    /// Gets the current status of an account deletion request
    /// </summary>
    public async Task<AccountDeletionStatusResponse> GetAccountDeletionStatusAsync(int userId, Guid deletionRequestId)
    {
        _logger.LogInformation("Getting account deletion status for user {UserId}, request {RequestId}",
            userId, deletionRequestId);

        // BUG FIX: AccountDeletionStatusResponse has different properties
        return await Task.FromResult(new AccountDeletionStatusResponse
        {
            DeletionRequestId = deletionRequestId,
            Status = "Pending",
            Progress = 0,
            EstimatedCompletionDate = DateTime.UtcNow.AddDays(30),
            CompletedSteps = new List<string>(),
            RemainingSteps = new List<string>
            {
                "Data export generation",
                "Club ownership transfer",
                "Member data anonymization",
                "Account deletion"
            }
        });
    }

    /// <summary>
    /// Cancels a pending account deletion request
    /// </summary>
    public async Task CancelAccountDeletionAsync(int userId, Guid deletionRequestId)
    {
        _logger.LogInformation("Canceling account deletion for user {UserId}, request {RequestId}",
            userId, deletionRequestId);

        // In a full implementation, this would remove the deletion request from a queue/table
        await Task.CompletedTask;
    }

    /// <summary>
    /// Downloads the data export for a user
    /// </summary>
    public async Task<DataExportDownloadResponse> DownloadDataExportAsync(int userId, Guid exportId)
    {
        _logger.LogInformation("Downloading data export {ExportId} for user {UserId}", exportId, userId);

        var exportStream = await _dataExportService.DownloadExportAsync(exportId);

        using var memoryStream = new MemoryStream();
        await exportStream.CopyToAsync(memoryStream);

        return new DataExportDownloadResponse
        {
            FileContent = memoryStream.ToArray(),
            FileName = $"user-data-export-{userId}-{exportId}.zip",
            ContentType = "application/zip",
            FileSize = memoryStream.Length
        };
    }

    /// <summary>
    /// Executes the actual account deletion (admin/system operation)
    /// </summary>
    public async Task ExecuteAccountDeletionAsync(ExecuteAccountDeletionRequest request)
    {
        _logger.LogInformation("Executing account deletion for user {UserId} by admin {AdminUserId}",
            request.UserId, request.AdminUserId);

        if (!request.FinalConfirmation)
        {
            throw new InvalidOperationException("Final confirmation required for account deletion");
        }

        var options = new AccountDeletionOptions
        {
            CreateDataExport = false, // Already created during request
            TransferOwnershipToUserId = request.TransferOwnershipToUserId,
            MemberDataHandling = request.AnonymizeMemberData ? MemberDataHandling.Anonymize : MemberDataHandling.Remove
        };

        await DeleteUserAccountAsync(request.UserId, options);
    }

    /// <summary>
    /// Anonymizes a user's member data across all clubs (privacy compliance)
    /// </summary>
    public async Task AnonymizeMemberDataAsync(int userId)
    {
        _logger.LogInformation("Anonymizing member data for user {UserId}", userId);

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found for anonymization", userId);
            return;
        }

        var members = await _context.Set<Member>()
            .Where(m => m.Email == user.Email)
            .ToListAsync();

        foreach (var member in members)
        {
            // BUG FIX: Anonymize only fields that exist in Member entity
            member.FullName = "[Deleted User]";
            member.Email = $"deleted-{Guid.NewGuid()}@anonymized.local";
            member.PhoneNumber = null;
            member.Address = null;
            member.Status = "Inactive"; // Mark as inactive instead of active
            // Note: Member doesn't have UserId, DateOfBirth, EmergencyContact, or EmergencyPhone fields
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Anonymized {Count} member records for user {UserId}", members.Count, userId);
    }

    /// <summary>
    /// Transfers club ownership from deleted user to another admin (3-parameter overload)
    /// </summary>
    public async Task TransferClubOwnershipAsync(int fromUserId, int toUserId, int clubId)
    {
        _logger.LogInformation("Transferring club {ClubId} ownership from user {FromUserId} to user {ToUserId}",
            clubId, fromUserId, toUserId);

        // BUG FIX: ClubOwnershipTransferRequest uses TargetUserId and IsPartOfAccountDeletion
        var request = new ClubOwnershipTransferRequest
        {
            ClubId = clubId,
            TargetUserId = toUserId,
            IsPartOfAccountDeletion = true, // Remove original owner since account is being deleted
            RequireTargetConfirmation = false, // No confirmation needed for account deletion transfers
            PasswordConfirmation = string.Empty // Not needed for system-initiated transfers
        };

        await TransferClubOwnershipAsync(fromUserId, request);
    }
}


/// <summary>
/// Options for account deletion process
/// </summary>
public class AccountDeletionOptions
{
    /// <summary>
    /// Whether to create a data export before deletion
    /// </summary>
    public bool CreateDataExport { get; set; } = true;

    /// <summary>
    /// User ID to transfer club ownership to (if user owns clubs)
    /// </summary>
    public int? TransferOwnershipToUserId { get; set; }

    /// <summary>
    /// How to handle member data in remaining clubs
    /// </summary>
    public MemberDataHandling MemberDataHandling { get; set; } = MemberDataHandling.Anonymize;
}

/// <summary>
/// Result of account deletion operation
/// </summary>
public class AccountDeletionResult
{
    /// <summary>
    /// User ID that was deleted
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Whether the deletion was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// When the deletion process started
    /// </summary>
    public DateTime StartedAt { get; set; }

    /// <summary>
    /// When the deletion process completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Steps that were completed during deletion
    /// </summary>
    public List<string> DeletionSteps { get; set; } = new();

    /// <summary>
    /// Error messages if deletion failed
    /// </summary>
    public List<string> ErrorMessages { get; set; } = new();

    /// <summary>
    /// ID of data export if created
    /// </summary>
    public Guid? DataExportId { get; set; }
}

/// <summary>
/// Validation result for account deletion
/// </summary>
public class AccountDeletionValidation
{
    /// <summary>
    /// Whether the account can be deleted
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// Validation error messages
    /// </summary>
    public List<string> ValidationErrors { get; set; } = new();

    /// <summary>
    /// Requirements that must be met before deletion
    /// </summary>
    public List<string> Requirements { get; set; } = new();

    /// <summary>
    /// Warning messages about deletion impact
    /// </summary>
    public List<string> Warnings { get; set; } = new();

    /// <summary>
    /// Whether this deletion requires manual admin review
    /// </summary>
    public bool RequiresManualReview { get; set; }
}

/// <summary>
/// Impact summary of account deletion
/// </summary>
public class AccountDeletionImpact
{
    /// <summary>
    /// Number of clubs owned by this user
    /// </summary>
    public int OwnedClubsCount { get; set; }

    /// <summary>
    /// Number of club memberships
    /// </summary>
    public int MembershipCount { get; set; }

    /// <summary>
    /// Number of events created by this user
    /// </summary>
    public int CreatedEventsCount { get; set; }

    /// <summary>
    /// Number of payment records
    /// </summary>
    public int PaymentRecordsCount { get; set; }

    /// <summary>
    /// Estimated size of data export in bytes
    /// </summary>
    public long EstimatedDataSizeBytes { get; set; }
}