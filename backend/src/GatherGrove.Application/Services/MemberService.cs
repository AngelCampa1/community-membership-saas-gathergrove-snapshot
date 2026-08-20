using Microsoft.EntityFrameworkCore;
using GatherGrove.Application.Common;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for member operations
/// </summary>
public class MemberService : IMemberService
{
    private const int SeedMemberLimit = 100;
    private const int GrowMemberLimit = 200;
    private const int ExpandMemberLimit = 2000;

    private readonly GatherGroveDbContext _context;
    private readonly IMemberActivationService _memberActivationService;
    private readonly ILogger<MemberService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IPaymentService _paymentService;

    public MemberService(
        GatherGroveDbContext context,
        IMemberActivationService memberActivationService,
        ILogger<MemberService> logger,
        IConfiguration configuration,
        IPaymentService paymentService)
    {
        _context = context;
        _memberActivationService = memberActivationService;
        _logger = logger;
        _configuration = configuration;
        _paymentService = paymentService;
    }

    /// <summary>
    /// Creates a new member for a club
    /// </summary>
    public async Task<MemberResponse> CreateMemberAsync(int clubId, CreateMemberRequest request)
    {
        // Check if club exists
        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException($"Club with ID {clubId} not found", nameof(clubId));
        }

        // Validate membership type belongs to this club
        var membershipType = await _context.MembershipTypes
            .Where(mt => mt.Id == request.MembershipTypeId && mt.ClubId == clubId && mt.IsActive)
            .FirstOrDefaultAsync();

        if (membershipType == null)
        {
            throw new ArgumentException($"Membership type with ID {request.MembershipTypeId} not found in this club", nameof(request.MembershipTypeId));
        }

        // Check if member email already exists in this club
        var existingMember = await _context.Members
            .FirstOrDefaultAsync(m => m.ClubId == clubId && m.Email == request.Email);

        if (existingMember != null)
        {
            throw new ArgumentException($"A member with the email '{request.Email}' already exists in this club");
        }

        // Validate custom field values if provided
        if (request.CustomFieldValues.Any())
        {
            var customFieldIds = request.CustomFieldValues.Select(cfv => cfv.CustomFieldId).ToList();
            var validCustomFields = await _context.ClubCustomFields
                .Where(cf => cf.ClubId == clubId && customFieldIds.Contains(cf.CustomFieldId))
                .Select(cf => cf.CustomFieldId)
                .ToListAsync();

            var invalidCustomFieldIds = customFieldIds.Except(validCustomFields).ToList();
            if (invalidCustomFieldIds.Any())
            {
                throw new ArgumentException($"Invalid custom field IDs for this club: {string.Join(", ", invalidCustomFieldIds)}");
            }
        }

        var now = DateTime.UtcNow;
        // JoinDate is a calendar date, not an instant. NormalizeDate keeps the date
        // the caller supplied and pins it to midnight UTC, which both satisfies
        // Npgsql (it rejects Kind=Unspecified for 'timestamp with time zone') and
        // avoids shifting the date across timezones. CSV import reaches this method
        // without passing through the API boundary, so it is normalized here too.
        var joinDate = UtcDateTime.NormalizeDate(request.JoinDate) ?? now.Date;

        await EnsureMemberCapacityAsync(clubId, club.Tier, additionalActiveMembers: 1);

        var member = new Member
        {
            ClubId = clubId,
            MembershipTypeId = request.MembershipTypeId,
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Address = request.Address,
            Status = "Active",
            JoinDate = joinDate,
            DuesPaidUntil = null, // Can be set later when dues are processed
            HasSmsConsent = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Save custom field values if provided
        if (request.CustomFieldValues.Any())
        {
            var customFieldValues = request.CustomFieldValues.Select(cfv => new MemberCustomFieldValue
            {
                MemberId = member.Id,
                CustomFieldId = cfv.CustomFieldId,
                Value = cfv.FieldValue,
                UpdatedAt = now
            }).ToList();

            _context.MemberCustomFieldValues.AddRange(customFieldValues);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Saved {Count} custom field values for member {MemberId}", customFieldValues.Count, member.Id);
        }

        // Create user account based on club tier
        try
        {
            bool accountCreated;
            if (club.Tier == "Grow")
            {
                // For "Grow" tier clubs, create a user account and send activation email
                accountCreated = await _memberActivationService.CreateMemberAccountAndSendActivationEmailAsync(member.Id, clubId);
                if (accountCreated)
                {
                    _logger.LogInformation("Member account created and activation email sent for member {MemberId} ({Email})", member.Id, member.Email);
                }
                else
                {
                    _logger.LogWarning("Failed to create account or send activation email for member {MemberId} ({Email})", member.Id, member.Email);
                }
            }
            else if (club.Tier == "Seed" || club.Tier == "Sprout")
            {
                // For "Seed" and "Sprout" tier clubs, create a dormant user account without sending activation email
                accountCreated = await _memberActivationService.CreateDormantMemberAccountAsync(member.Id, clubId);
                if (accountCreated)
                {
                    _logger.LogInformation("Dormant member account created for member {MemberId} ({Email}) in {ClubTier} tier - no activation email sent", member.Id, member.Email, club.Tier);
                }
                else
                {
                    _logger.LogWarning("Failed to create dormant account for member {MemberId} ({Email}) in {ClubTier} tier", member.Id, member.Email, club.Tier);
                }
            }
            else
            {
                _logger.LogWarning("Unknown club tier '{ClubTier}' for club {ClubId} - no user account created", club.Tier, clubId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError("Error creating user account for member {MemberId} ({Email}) in {ClubTier} tier club: {Error}", member.Id, member.Email, club.Tier, ex.Message);
            // Don't fail the member creation if user account creation fails
        }

        // Get custom field values for response
        var customFieldValuesResponse = await GetMemberCustomFieldValuesAsync(member.Id);

        return new MemberResponse
        {
            Id = member.Id,
            ClubId = member.ClubId,
            MembershipTypeId = member.MembershipTypeId,
            MembershipTypeName = membershipType.Name,
            FullName = member.FullName,
            Email = member.Email,
            PhoneNumber = member.PhoneNumber,
            Address = member.Address,
            Status = member.Status,
            JoinDate = member.JoinDate,
            DuesPaidUntil = member.DuesPaidUntil,
            HasSmsConsent = member.HasSmsConsent,
            CreatedAt = member.CreatedAt,
            UpdatedAt = member.UpdatedAt,
            CustomFieldValues = customFieldValuesResponse
        };
    }

    /// <summary>
    /// Gets all members for a club
    /// </summary>
    public async Task<List<MemberResponse>> GetMembersByClubAsync(int clubId)
    {
        var members = await _context.Members
            .Include(m => m.MembershipType)
            .Where(m => m.ClubId == clubId)
            .OrderBy(m => m.FullName)
            .AsNoTracking()
            .ToListAsync();

        // Batch calculate payment information for all members to avoid N+1 queries
        var memberIds = members.Select(m => m.Id).ToList();
        var paymentData = await CalculateBatchPartialPaymentInfoAsync(memberIds);

        var memberResponses = members.Select(m =>
        {
            var expectedDuesAmount = m.MembershipType.DuesAmount;
            var paymentInfo = paymentData.GetValueOrDefault(m.Id, (0, expectedDuesAmount, null, false));

            return new MemberResponse
            {
                Id = m.Id,
                ClubId = m.ClubId,
                MembershipTypeId = m.MembershipTypeId,
                MembershipTypeName = m.MembershipType.Name,
                FullName = m.FullName,
                Email = m.Email,
                PhoneNumber = m.PhoneNumber,
                Address = m.Address,
                Status = m.Status,
                JoinDate = m.JoinDate,
                DuesPaidUntil = m.DuesPaidUntil,
                HasSmsConsent = m.HasSmsConsent,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
                TotalPaidCurrentPeriod = paymentInfo.totalPaid,
                ExpectedDuesAmount = paymentInfo.expectedAmount,
                OutstandingBalance = paymentInfo.outstandingBalance,
                HasPartialPayments = paymentInfo.hasPartialPayments
            };
        }).ToList();

        return memberResponses;
    }

    /// <summary>
    /// Gets paginated and searchable members for a club (Story 14)
    /// </summary>
    public async Task<PaginatedMembersResponse> GetPaginatedMembersAsync(int clubId, string? search = null, int page = 1, int pageSize = 25)
    {
        // Validate parameters
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        if (pageSize > 100) pageSize = 100; // Prevent excessive page sizes

        // Start with base query for active members only (as per Story 14)
        var query = _context.Members
            .Include(m => m.MembershipType)
            .Where(m => m.ClubId == clubId && m.Status == "Active");

        // Apply search filter if provided (searching on FullName and Email as per Story 14)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim().ToLower();
            query = query.Where(m =>
                m.FullName.ToLower().Contains(searchTerm) ||
                m.Email.ToLower().Contains(searchTerm));
        }

        // Get total count for pagination
        var totalCount = await query.CountAsync();

        // Calculate pagination metadata
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        var skip = (page - 1) * pageSize;

        // Get the paginated results
        var members = await query
            .OrderBy(m => m.FullName)
            .Skip(skip)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        // Convert to response DTOs
        var memberResponses = members.Select(m => new MemberResponse
        {
            Id = m.Id,
            ClubId = m.ClubId,
            MembershipTypeId = m.MembershipTypeId,
            MembershipTypeName = m.MembershipType.Name,
            FullName = m.FullName,
            Email = m.Email,
            PhoneNumber = m.PhoneNumber,
            Address = m.Address,
            Status = m.Status,
            JoinDate = m.JoinDate,
            DuesPaidUntil = m.DuesPaidUntil,
            HasSmsConsent = m.HasSmsConsent,
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt
        }).ToList();

        return new PaginatedMembersResponse
        {
            Members = memberResponses,
            CurrentPage = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasPrevious = page > 1,
            HasNext = page < totalPages,
            Search = string.IsNullOrWhiteSpace(search) ? null : search
        };
    }

    /// <summary>
    /// Gets a specific member by ID
    /// </summary>
    public async Task<MemberResponse?> GetMemberByIdAsync(int clubId, int memberId)
    {
        var member = await _context.Members
            .Include(m => m.MembershipType)
            .Where(m => m.ClubId == clubId && m.Id == memberId)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (member == null)
        {
            return null;
        }

        // Get custom field values for this member
        var customFieldValues = await GetMemberCustomFieldValuesAsync(member.Id);

        // Calculate partial payment information
        var expectedDuesAmount = member.MembershipType.DuesAmount;
        var (totalPaid, expectedAmount, outstandingBalance, hasPartialPayments) =
            await CalculatePartialPaymentInfoAsync(member.Id, expectedDuesAmount, member.DuesPaidUntil);

        return new MemberResponse
        {
            Id = member.Id,
            ClubId = member.ClubId,
            MembershipTypeId = member.MembershipTypeId,
            MembershipTypeName = member.MembershipType.Name,
            FullName = member.FullName,
            Email = member.Email,
            PhoneNumber = member.PhoneNumber,
            Address = member.Address,
            Status = member.Status,
            JoinDate = member.JoinDate,
            DuesPaidUntil = member.DuesPaidUntil,
            HasSmsConsent = member.HasSmsConsent,
            CreatedAt = member.CreatedAt,
            UpdatedAt = member.UpdatedAt,
            CustomFieldValues = customFieldValues,
            TotalPaidCurrentPeriod = totalPaid,
            ExpectedDuesAmount = expectedAmount,
            OutstandingBalance = outstandingBalance,
            HasPartialPayments = hasPartialPayments,
            DuesFrequency = member.MembershipType.DuesFrequency
        };
    }

    /// <summary>
    /// Gets a specific member by email address
    /// </summary>
    public async Task<MemberResponse?> GetMemberByEmailAsync(int clubId, string email)
    {
        var member = await _context.Members
            .Include(m => m.MembershipType)
            .Where(m => m.ClubId == clubId && m.Email.ToLower() == email.ToLower())
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (member == null)
        {
            return null;
        }

        // Get custom field values for this member
        var customFieldValues = await GetMemberCustomFieldValuesAsync(member.Id);

        // Calculate partial payment information
        var expectedDuesAmount = member.MembershipType.DuesAmount;
        var (totalPaid, expectedAmount, outstandingBalance, hasPartialPayments) =
            await CalculatePartialPaymentInfoAsync(member.Id, expectedDuesAmount, member.DuesPaidUntil);

        return new MemberResponse
        {
            Id = member.Id,
            ClubId = member.ClubId,
            MembershipTypeId = member.MembershipTypeId,
            MembershipTypeName = member.MembershipType.Name,
            FullName = member.FullName,
            Email = member.Email,
            PhoneNumber = member.PhoneNumber,
            Address = member.Address,
            Status = member.Status,
            JoinDate = member.JoinDate,
            DuesPaidUntil = member.DuesPaidUntil,
            HasSmsConsent = member.HasSmsConsent,
            CreatedAt = member.CreatedAt,
            UpdatedAt = member.UpdatedAt,
            CustomFieldValues = customFieldValues,
            TotalPaidCurrentPeriod = totalPaid,
            ExpectedDuesAmount = expectedAmount,
            OutstandingBalance = outstandingBalance,
            HasPartialPayments = hasPartialPayments,
            DuesFrequency = member.MembershipType.DuesFrequency
        };
    }

    /// <summary>
    /// Gets paginated member directory for a club (Story 30)
    /// Returns only opted-in members with their chosen visible fields
    /// </summary>
    public async Task<PaginatedDirectoryMembersResponse> GetMemberDirectoryAsync(int clubId, int requestingUserId, string? search = null, int page = 1, int pageSize = 25)
    {
        // Validate parameters
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        if (pageSize > 100) pageSize = 100;

        _logger.LogInformation("Getting member directory for club {ClubId}, user {UserId}, search: '{Search}', page {Page}, pageSize {PageSize}",
            clubId, requestingUserId, search ?? "none", page, pageSize);

        // First, verify the requesting user exists
        var requestingUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == requestingUserId);

        if (requestingUser == null)
        {
            throw new ArgumentException("Requesting user not found");
        }

        // Check if the user is an admin of this club
        var isClubAdmin = await _context.ClubAdmins
            .AnyAsync(ca => ca.UserId == requestingUserId && ca.ClubId == clubId);

        // Get the club to check directory settings
        var club = await _context.Clubs
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == clubId);

        if (club == null)
        {
            throw new ArgumentException("Club not found");
        }

        // Check if directory is enabled for this club
        if (!club.IsDirectoryEnabled)
        {
            throw new InvalidOperationException("The member directory is disabled for this club");
        }

        // If not an admin, check member status and opt-in
        if (!isClubAdmin)
        {
            var requestingMember = await _context.Members
                .FirstOrDefaultAsync(m => m.Email == requestingUser.Email && m.ClubId == clubId);

            if (requestingMember == null)
            {
                throw new InvalidOperationException("Requesting user is not a member of this club");
            }

            // Check if requesting member has opted in to directory
            if (!requestingMember.IsListedInDirectory)
            {
                throw new InvalidOperationException("You must opt in to the member directory to view other members");
            }
        }

        // Get admin allowed fields for this club
        var adminAllowedFields = string.IsNullOrEmpty(club.DirectoryAllowedSharableFields)
            ? Array.Empty<string>()
            : club.DirectoryAllowedSharableFields.Split(',', StringSplitOptions.RemoveEmptyEntries);

        // Start with base query for members who have opted in to directory
        var query = _context.Members
            .Include(m => m.MembershipType)
            .Where(m => m.ClubId == clubId && m.IsListedInDirectory && m.Status == "Active");

        // Apply search filter if provided (searching on FullName only for privacy)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim().ToLower();
            query = query.Where(m => m.FullName.ToLower().Contains(searchTerm));
        }

        // Get total count for pagination
        var totalMembers = await query.CountAsync();

        // Calculate pagination
        var totalPages = (int)Math.Ceiling((double)totalMembers / pageSize);
        var hasNextPage = page < totalPages;
        var hasPreviousPage = page > 1;

        // Get the members for this page
        var members = await query
            .OrderBy(m => m.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        // Transform to directory responses, respecting privacy settings
        var directoryMembers = members.Select(m =>
        {
            var memberVisibleFields = string.IsNullOrEmpty(m.DirectoryVisibleFields)
                ? Array.Empty<string>()
                : m.DirectoryVisibleFields.Split(',', StringSplitOptions.RemoveEmptyEntries);

            // Only include fields that are both admin-allowed AND member-chosen
            var allowedVisibleFields = memberVisibleFields.Intersect(adminAllowedFields).ToArray();

            return new DirectoryMemberResponse
            {
                Id = m.Id,
                FullName = m.FullName, // Always visible
                Email = allowedVisibleFields.Contains("email") ? m.Email : null,
                PhoneNumber = allowedVisibleFields.Contains("phoneNumber") ? m.PhoneNumber : null,
                Address = allowedVisibleFields.Contains("address") ? m.Address : null,
                MembershipTypeName = allowedVisibleFields.Contains("membershipType") ? m.MembershipType.Name : null,
                JoinDate = allowedVisibleFields.Contains("joinDate") ? m.JoinDate : null
            };
        }).ToList();

        _logger.LogInformation("Retrieved {Count} directory members for club {ClubId} (page {Page} of {TotalPages})",
            directoryMembers.Count, clubId, page, totalPages);

        return new PaginatedDirectoryMembersResponse
        {
            Members = directoryMembers,
            CurrentPage = page,
            TotalPages = totalPages,
            TotalMembers = totalMembers,
            PageSize = pageSize,
            HasNextPage = hasNextPage,
            HasPreviousPage = hasPreviousPage
        };
    }

    /// <summary>
    /// Updates an existing member's information
    /// </summary>
    public async Task<MemberResponse> UpdateMemberAsync(int clubId, int memberId, UpdateMemberRequest request)
    {
        // Get the member to update
        var member = await _context.Members
            .Include(m => m.Club)
            .Include(m => m.MembershipType)
            .Where(m => m.ClubId == clubId && m.Id == memberId)
            .FirstOrDefaultAsync();

        if (member == null)
        {
            throw new ArgumentException($"Member with ID {memberId} not found in club {clubId}");
        }

        // Validate membership type exists in this club
        var membershipType = await _context.MembershipTypes
            .Where(mt => mt.ClubId == clubId && mt.Id == request.MembershipTypeId)
            .FirstOrDefaultAsync();

        if (membershipType == null)
        {
            throw new ArgumentException($"Membership type with ID {request.MembershipTypeId} not found in this club", nameof(request.MembershipTypeId));
        }

        // Check if new email conflicts with another member (excluding current member)
        var existingMember = await _context.Members
            .Where(m => m.ClubId == clubId && m.Email == request.Email && m.Id != memberId)
            .FirstOrDefaultAsync();

        if (existingMember != null)
        {
            throw new ArgumentException($"A member with the email '{request.Email}' already exists in this club");
        }

        // Validate custom field values if provided
        if (request.CustomFieldValues.Any())
        {
            var customFieldIds = request.CustomFieldValues.Select(cfv => cfv.CustomFieldId).ToList();
            var validCustomFields = await _context.ClubCustomFields
                .Where(cf => cf.ClubId == clubId && customFieldIds.Contains(cf.CustomFieldId))
                .Select(cf => cf.CustomFieldId)
                .ToListAsync();

            var invalidCustomFieldIds = customFieldIds.Except(validCustomFields).ToList();
            if (invalidCustomFieldIds.Any())
            {
                throw new ArgumentException($"Invalid custom field IDs for this club: {string.Join(", ", invalidCustomFieldIds)}");
            }
        }

        var now = DateTime.UtcNow;

        // Update member properties
        member.FullName = request.FullName;
        member.Email = request.Email;
        member.PhoneNumber = request.PhoneNumber;
        member.Address = request.Address;
        member.MembershipTypeId = request.MembershipTypeId;
        member.HasSmsConsent = false;
        member.UpdatedAt = now;

        // Update the membership type navigation property for the response
        member.MembershipType = membershipType;

        // Handle membership type transitions to $0 membership types
        if (membershipType.DuesAmount == 0)
        {
            // For $0 membership types, clear DuesPaidUntil
            member.DuesPaidUntil = null;
        }
        else
        {
            // For paid membership types, recalculate dues if needed
            // This will handle transitions from $0 to paid membership types
            await RecalculateMemberDuesAsync(member.Id);
        }

        // Update custom field values
        if (request.CustomFieldValues.Any())
        {
            // Remove existing custom field values for this member
            var existingCustomFieldValues = await _context.MemberCustomFieldValues
                .Where(mcfv => mcfv.MemberId == memberId)
                .ToListAsync();

            _context.MemberCustomFieldValues.RemoveRange(existingCustomFieldValues);

            // Add new custom field values
            var newCustomFieldValues = request.CustomFieldValues.Select(cfv => new MemberCustomFieldValue
            {
                MemberId = memberId,
                CustomFieldId = cfv.CustomFieldId,
                Value = cfv.FieldValue,
                UpdatedAt = now
            }).ToList();

            _context.MemberCustomFieldValues.AddRange(newCustomFieldValues);

            _logger.LogInformation("Updated {Count} custom field values for member {MemberId}", newCustomFieldValues.Count, memberId);
        }

        // BUG FIX #6: Handle optimistic concurrency conflicts
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Concurrency conflict updating member {MemberId}. Another user modified this member.", memberId);
            throw new InvalidOperationException(
                "This member was updated by another user. Please refresh the page and try again.");
        }

        // Get updated custom field values for response
        var customFieldValuesResponse = await GetMemberCustomFieldValuesAsync(memberId);

        return new MemberResponse
        {
            Id = member.Id,
            ClubId = member.ClubId,
            MembershipTypeId = member.MembershipTypeId,
            MembershipTypeName = member.MembershipType.Name,
            FullName = member.FullName,
            Email = member.Email,
            PhoneNumber = member.PhoneNumber,
            Address = member.Address,
            Status = member.Status,
            JoinDate = member.JoinDate,
            DuesPaidUntil = member.DuesPaidUntil,
            HasSmsConsent = member.HasSmsConsent,
            CreatedAt = member.CreatedAt,
            UpdatedAt = member.UpdatedAt,
            CustomFieldValues = customFieldValuesResponse
        };
    }

    /// <summary>
    /// Updates a member's status (Story 16: Archive a Member)
    /// </summary>
    public async Task<MemberResponse> UpdateMemberStatusAsync(int clubId, int memberId, string status)
    {
        try
        {
            var member = await _context.Members
                .Include(m => m.MembershipType)
                .FirstOrDefaultAsync(m => m.Id == memberId && m.ClubId == clubId);

            if (member == null)
            {
                throw new ArgumentException("Member not found.");
            }

            // Validate status values
            var validStatuses = new[] { "Active", "Archived", "Inactive", "Suspended" };
            if (!validStatuses.Contains(status))
            {
                throw new ArgumentException($"Invalid status. Valid statuses are: {string.Join(", ", validStatuses)}");
            }

            member.Status = status;
            member.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated member {MemberId} status to {Status} for club {ClubId}", memberId, status, clubId);

            return new MemberResponse
            {
                Id = member.Id,
                ClubId = member.ClubId,
                MembershipTypeId = member.MembershipTypeId,
                MembershipTypeName = member.MembershipType.Name,
                FullName = member.FullName,
                Email = member.Email,
                PhoneNumber = member.PhoneNumber,
                Address = member.Address,
                Status = member.Status,
                JoinDate = member.JoinDate,
                DuesPaidUntil = member.DuesPaidUntil,
                HasSmsConsent = member.HasSmsConsent,
                CreatedAt = member.CreatedAt,
                UpdatedAt = member.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError("Error updating status for member {MemberId} in club {ClubId}: {Error}", memberId, clubId, ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Records a manual dues payment for a member (Story 17)
    /// </summary>
    public async Task<PaymentResponse> RecordPaymentAsync(int clubId, int memberId, RecordPaymentRequest request)
    {
        try
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            // Get the member and verify they exist in the club
            var member = await _context.Members
                .Include(m => m.MembershipType)
                .FirstOrDefaultAsync(m => m.Id == memberId && m.ClubId == clubId);

            if (member == null)
            {
                throw new ArgumentException($"Member with ID {memberId} not found in club {clubId}");
            }

            // Ensure membership type is loaded
            if (member.MembershipType == null)
            {
                throw new ArgumentException($"Member {memberId} does not have a valid membership type assigned");
            }

            // Handle $0 membership types gracefully
            if (member.MembershipType.DuesAmount == 0)
            {
                _logger.LogInformation($"Skipping payment recording for member {memberId} with $0 membership type");
                return new PaymentResponse
                {
                    PaymentId = 0, // No payment was created
                    MemberId = memberId,
                    ClubId = clubId,
                    Amount = 0,
                    PaymentDate = request.PaymentDate,
                    PaymentMethod = request.PaymentMethod,
                    Notes = "$0 membership type - no payment required",
                    CreatedAt = DateTime.UtcNow,
                    IsPartialPayment = false,
                    ExpectedDuesAmount = 0,
                    OutstandingBalance = null,
                    PaymentStatusMessage = "No payment required for $0 membership type"
                };
            }

            // Create the payment record
            var payment = new Payment
            {
                MemberId = memberId,
                ClubId = clubId,
                Amount = request.Amount,
                PaymentDate = request.PaymentDate,
                PaymentMethod = request.PaymentMethod,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);

            // Update the member's DuesPaidUntil date based on payment coverage
            // Logic: Only extend the dues date if payment covers the full dues amount for the frequency period
            var expectedDuesAmount = member.MembershipType.DuesAmount;
            var paymentCoverageRatio = (double)(request.Amount / expectedDuesAmount);

            // Only update DuesPaidUntil if payment covers at least the full period dues
            if (request.Amount >= expectedDuesAmount)
            {
                DateTime newDuesPaidUntil;
                var baseDate = member.DuesPaidUntil.HasValue && member.DuesPaidUntil.Value > request.PaymentDate
                    ? member.DuesPaidUntil.Value
                    : request.PaymentDate;

                // Calculate period extension based on membership frequency
                // Use null-safe operator with default to "monthly" to prevent NullReferenceException
                switch ((member.MembershipType.DuesFrequency ?? "Monthly").ToLower())
                {
                    case "weekly":
                        newDuesPaidUntil = baseDate.AddDays(7);
                        break;
                    case "biweekly":
                        newDuesPaidUntil = baseDate.AddDays(14);
                        break;
                    case "monthly":
                        newDuesPaidUntil = baseDate.AddMonths(1);
                        break;
                    case "quarterly":
                        newDuesPaidUntil = baseDate.AddMonths(3);
                        break;
                    case "semiannually":
                        newDuesPaidUntil = baseDate.AddMonths(6);
                        break;
                    case "annually":
                    case "annual":
                        newDuesPaidUntil = baseDate.AddYears(1);
                        break;
                    case "biennially":
                        newDuesPaidUntil = baseDate.AddYears(2);
                        break;
                    case "onetime":
                        // For one-time payments, extend by 10 years to mark as "lifetime paid"
                        newDuesPaidUntil = baseDate.AddYears(10);
                        break;
                    default:
                        // Default to annual for unknown frequencies
                        newDuesPaidUntil = baseDate.AddYears(1);
                        break;
                }

                member.DuesPaidUntil = newDuesPaidUntil;

                _logger.LogInformation("Full payment received. Updated dues paid until {DuesPaidUntil} for member {MemberId}",
                    newDuesPaidUntil, memberId);
            }
            else
            {
                // Partial payment - do not update DuesPaidUntil date
                _logger.LogInformation("Partial payment of ${Amount} received (expected ${ExpectedAmount}). Dues paid until date not updated for member {MemberId}",
                    request.Amount, expectedDuesAmount, memberId);
            }

            member.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Calculate payment status information
            var isPartialPayment = request.Amount < expectedDuesAmount;
            var outstandingBalance = isPartialPayment ? expectedDuesAmount - request.Amount : (decimal?)null;
            var paymentStatusMessage = isPartialPayment
                ? $"Partial payment received - ${outstandingBalance:F2} remaining for this period"
                : "Full payment received - dues are current";

            _logger.LogInformation("Recorded payment of ${Amount} for member {MemberId} in club {ClubId}. Status: {Status}",
                request.Amount, memberId, clubId, paymentStatusMessage);

            return new PaymentResponse
            {
                PaymentId = payment.PaymentId,
                MemberId = payment.MemberId,
                ClubId = payment.ClubId,
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                PaymentMethod = payment.PaymentMethod,
                Notes = payment.Notes,
                CreatedAt = payment.CreatedAt,
                IsPartialPayment = isPartialPayment,
                ExpectedDuesAmount = expectedDuesAmount,
                OutstandingBalance = outstandingBalance,
                PaymentStatusMessage = paymentStatusMessage
            };
        }
        catch (Exception ex)
        {
            _logger.LogError("Error recording payment for member {MemberId} in club {ClubId}: {Error}", memberId, clubId, ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Helper method to get custom field values for a member
    /// </summary>
    private async Task<List<MemberCustomFieldValueResponse>> GetMemberCustomFieldValuesAsync(int memberId)
    {
        return await _context.MemberCustomFieldValues
            .Include(mcfv => mcfv.CustomField)
            .Where(mcfv => mcfv.MemberId == memberId)
            .AsNoTracking()
            .OrderBy(mcfv => mcfv.CustomField.FieldName)
            .Select(mcfv => new MemberCustomFieldValueResponse
            {
                Id = mcfv.Id,
                CustomFieldId = mcfv.CustomFieldId,
                FieldLabel = mcfv.CustomField.FieldName,
                FieldType = mcfv.CustomField.FieldType,
                FieldValue = mcfv.Value,
                UpdatedAt = mcfv.UpdatedAt
            })
            .ToListAsync();
    }

    /// <summary>
    /// Batch calculate partial payment information for multiple members to avoid N+1 queries
    /// </summary>
    private async Task<Dictionary<int, (decimal totalPaid, decimal expectedAmount, decimal? outstandingBalance, bool hasPartialPayments)>>
        CalculateBatchPartialPaymentInfoAsync(List<int> memberIds)
    {
        var cutoffDate = DateTime.UtcNow.AddYears(-1);

        // Get all payments for these members in a single query
        var payments = await _context.Payments
            .Where(p => memberIds.Contains(p.MemberId) && p.PaymentDate >= cutoffDate)
            .GroupBy(p => p.MemberId)
            .Select(g => new { MemberId = g.Key, TotalPaid = g.Sum(p => p.Amount) })
            .AsNoTracking()
            .ToListAsync();

        // Get member dues information
        var memberDues = await _context.Members
            .Where(m => memberIds.Contains(m.Id))
            .Select(m => new { m.Id, m.MembershipType.DuesAmount, m.DuesPaidUntil })
            .AsNoTracking()
            .ToListAsync();

        var paymentLookup = payments.ToDictionary(p => p.MemberId, p => p.TotalPaid);
        var result = new Dictionary<int, (decimal, decimal, decimal?, bool)>();

        foreach (var member in memberDues)
        {
            var totalPaid = paymentLookup.GetValueOrDefault(member.Id, 0);
            var expectedAmount = member.DuesAmount;

            // If member has paid dues (has a future due date), they don't have partial payments
            if (member.DuesPaidUntil.HasValue && member.DuesPaidUntil.Value > DateTime.UtcNow)
            {
                result[member.Id] = (expectedAmount, expectedAmount, null, false);
            }
            else
            {
                var outstandingBalance = totalPaid >= expectedAmount ?
                    (decimal?)null :
                    expectedAmount - totalPaid;
                var hasPartialPayments = totalPaid > 0 && totalPaid < expectedAmount;

                result[member.Id] = (totalPaid, expectedAmount, outstandingBalance, hasPartialPayments);
            }
        }

        return result;
    }

    /// <summary>
    /// Helper method to calculate partial payment information for a member
    /// </summary>
    private async Task<(decimal totalPaid, decimal expectedAmount, decimal? outstandingBalance, bool hasPartialPayments)>
        CalculatePartialPaymentInfoAsync(int memberId, decimal expectedDuesAmount, DateTime? duesPaidUntil)
    {
        // If member has paid dues (has a future due date), they don't have partial payments
        if (duesPaidUntil.HasValue && duesPaidUntil.Value > DateTime.UtcNow)
        {
            return (expectedDuesAmount, expectedDuesAmount, null, false);
        }

        // Get all payments for this member for the current dues period
        // For unpaid members, consider payments from the last year as towards current period
        var cutoffDate = DateTime.UtcNow.AddYears(-1);

        var totalPaidCurrentPeriod = await _context.Payments
            .Where(p => p.MemberId == memberId && p.PaymentDate >= cutoffDate)
            .SumAsync(p => p.Amount);

        // Calculate outstanding balance
        var outstandingBalance = totalPaidCurrentPeriod >= expectedDuesAmount ?
            (decimal?)null :
            expectedDuesAmount - totalPaidCurrentPeriod;

        // Has partial payments if they've paid something but not the full amount
        var hasPartialPayments = totalPaidCurrentPeriod > 0 && totalPaidCurrentPeriod < expectedDuesAmount;

        return (totalPaidCurrentPeriod, expectedDuesAmount, outstandingBalance, hasPartialPayments);
    }

    /// <summary>
    /// Allows a member to pay their own dues online (Mobile Story M08)
    /// </summary>
    public async Task<PaymentResponse> PayMemberDuesAsync(int userId, PayMyDuesRequest request)
    {
        try
        {
            // Get the user's email from their User record to find their Member record
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            // Get the member record for this user by email
            var member = await _context.Members
                .Include(m => m.MembershipType)
                .Include(m => m.Club)
                .FirstOrDefaultAsync(m => m.Email == user.Email);

            if (member == null)
            {
                throw new ArgumentException("Member profile not found for the authenticated user");
            }

            // Validate that the membership type matches what the member currently has
            if (member.MembershipTypeId != request.MembershipTypeId)
            {
                throw new ArgumentException("Membership type mismatch. Please contact your club administrator.");
            }

            // Verify club has Stripe connected
            if (string.IsNullOrEmpty(member.Club.StripeAccountId))
            {
                throw new InvalidOperationException("Your club has not configured online payments. Please pay manually or contact your club administrator.");
            }

            // Get payment amount from membership type
            var paymentAmount = member.MembershipType.DuesAmount;

            // BUG FIX #4: Validate that membership type requires payment
            if (paymentAmount <= 0)
            {
                throw new InvalidOperationException("Your membership type does not require payment. Dues amount is $0.");
            }

            // Create a payment token internally (no email) to reuse existing payment processing logic
            var token = GenerateSecureToken();
            var paymentToken = new PaymentToken
            {
                Token = token,
                MemberId = member.Id,
                ClubId = member.ClubId,
                Amount = paymentAmount,
                Description = $"Membership dues payment for {member.MembershipType.Name}",
                ExpiresAt = DateTime.UtcNow.AddMinutes(30), // Short expiration for immediate use
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PaymentTokens.Add(paymentToken);
            await _context.SaveChangesAsync();

            // Use existing PaymentService to process the payment
            var processPaymentRequest = new GatherGrove.Application.DTOs.ProcessPaymentRequest
            {
                PaymentMethodId = request.PaymentMethodId
            };

            await _paymentService.ProcessPaymentAsync(token, processPaymentRequest);

            // Get the recorded payment to return
            var recordedPayment = await _context.Payments
                .Where(p => p.MemberId == member.Id)
                .OrderByDescending(p => p.CreatedAt)
                .FirstAsync();

            _logger.LogInformation("Member {MemberId} successfully paid dues of ${Amount} via mobile app",
                member.Id, paymentAmount);

            return new PaymentResponse
            {
                PaymentId = recordedPayment.PaymentId,
                MemberId = recordedPayment.MemberId,
                ClubId = recordedPayment.ClubId,
                Amount = recordedPayment.Amount,
                PaymentDate = recordedPayment.PaymentDate,
                PaymentMethod = recordedPayment.PaymentMethod,
                Notes = recordedPayment.Notes,
                CreatedAt = recordedPayment.CreatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError("Error processing dues payment for user {UserId}: {Error}", userId, ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Generates a cryptographically secure token for payment processing
    /// </summary>
    private static string GenerateSecureToken()
    {
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            var bytes = new byte[32];
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        }
    }

    /// <summary>
    /// Gets the authenticated user's member profile
    /// </summary>
    public async Task<MemberProfileResponse> GetMemberProfileAsync(int userId)
    {
        try
        {
            // Get the user's email from their User record to find their Member record
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            // Get the member record for this user by email
            var member = await _context.Members
                .Include(m => m.MembershipType)
                .Include(m => m.Club)
                .FirstOrDefaultAsync(m => m.Email == user.Email);

            if (member == null)
            {
                throw new ArgumentException("Member profile not found for the authenticated user");
            }

            // Get custom field values
            var customFieldValues = await GetMemberCustomFieldValuesAsync(member.Id);

            return new MemberProfileResponse
            {
                Id = member.Id,
                ClubId = member.ClubId,
                ClubName = member.Club.Name,
                MembershipTypeId = member.MembershipTypeId,
                MembershipTypeName = member.MembershipType.Name,
                FullName = member.FullName,
                Email = member.Email,
                PhoneNumber = member.PhoneNumber,
                Address = member.Address,
                Status = member.Status,
                JoinDate = member.JoinDate,
                DuesPaidUntil = member.DuesPaidUntil,
                HasSmsConsent = member.HasSmsConsent,
                CreatedAt = member.CreatedAt,
                UpdatedAt = member.UpdatedAt,
                CustomFieldValues = customFieldValues
            };
        }
        catch (Exception ex)
        {
            _logger.LogError("Error getting member profile for user {UserId}: {Error}", userId, ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Updates the authenticated user's member profile
    /// </summary>
    public async Task<MemberProfileResponse> UpdateMemberProfileAsync(int userId, UpdateMemberProfileRequest request)
    {
        try
        {
            // Get the user's email from their User record to find their Member record
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            // Get the member record for this user by email
            var member = await _context.Members
                .Include(m => m.MembershipType)
                .Include(m => m.Club)
                .FirstOrDefaultAsync(m => m.Email == user.Email);

            if (member == null)
            {
                throw new ArgumentException("Member profile not found for the authenticated user");
            }

            var now = DateTime.UtcNow;

            // Update only allowed fields (members can't change their own membership type or status)
            member.FullName = request.FullName;
            member.PhoneNumber = request.PhoneNumber;
            member.Address = request.Address;
            member.HasSmsConsent = false;
            member.UpdatedAt = now;

            // Update custom field values if provided
            if (request.CustomFieldValues?.Any() == true)
            {
                // Remove existing custom field values for this member
                var existingCustomFieldValues = await _context.MemberCustomFieldValues
                    .Where(mcfv => mcfv.MemberId == member.Id)
                    .ToListAsync();

                _context.MemberCustomFieldValues.RemoveRange(existingCustomFieldValues);

                // Add new custom field values
                var newCustomFieldValues = request.CustomFieldValues.Select(cfv => new MemberCustomFieldValue
                {
                    MemberId = member.Id,
                    CustomFieldId = cfv.CustomFieldId,
                    Value = cfv.FieldValue,
                    UpdatedAt = now
                }).ToList();

                _context.MemberCustomFieldValues.AddRange(newCustomFieldValues);

                _logger.LogInformation("Updated {Count} custom field values for member {MemberId}", newCustomFieldValues.Count, member.Id);
            }

            await _context.SaveChangesAsync();

            // Get updated custom field values for response
            var customFieldValues = await GetMemberCustomFieldValuesAsync(member.Id);

            _logger.LogInformation("Updated profile for member {MemberId} (user {UserId})", member.Id, userId);

            return new MemberProfileResponse
            {
                Id = member.Id,
                ClubId = member.ClubId,
                ClubName = member.Club.Name,
                MembershipTypeId = member.MembershipTypeId,
                MembershipTypeName = member.MembershipType.Name,
                FullName = member.FullName,
                Email = member.Email,
                PhoneNumber = member.PhoneNumber,
                Address = member.Address,
                Status = member.Status,
                JoinDate = member.JoinDate,
                DuesPaidUntil = member.DuesPaidUntil,
                HasSmsConsent = member.HasSmsConsent,
                CreatedAt = member.CreatedAt,
                UpdatedAt = member.UpdatedAt,
                CustomFieldValues = customFieldValues
            };
        }
        catch (Exception ex)
        {
            _logger.LogError("Error updating member profile for user {UserId}: {Error}", userId, ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Gets all payments for a specific member
    /// </summary>
    public async Task<List<PaymentResponse>> GetMemberPaymentsAsync(int clubId, int memberId)
    {
        var payments = await _context.Payments
            .Where(p => p.ClubId == clubId && p.MemberId == memberId)
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new PaymentResponse
            {
                PaymentId = p.PaymentId,
                MemberId = p.MemberId,
                ClubId = p.ClubId,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return payments;
    }

    /// <summary>
    /// Gets a specific payment by ID
    /// </summary>
    public async Task<PaymentResponse?> GetPaymentByIdAsync(int clubId, int memberId, int paymentId)
    {
        var payment = await _context.Payments
            .Where(p => p.ClubId == clubId && p.MemberId == memberId && p.PaymentId == paymentId)
            .Select(p => new PaymentResponse
            {
                PaymentId = p.PaymentId,
                MemberId = p.MemberId,
                ClubId = p.ClubId,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt
            })
            .FirstOrDefaultAsync();

        return payment;
    }

    /// <summary>
    /// Updates a manual payment (Cash or Check only)
    /// </summary>
    public async Task<PaymentResponse> UpdatePaymentAsync(int clubId, int memberId, int paymentId, UpdatePaymentRequest request)
    {
        var payment = await _context.Payments
            .Include(p => p.Member)
            .ThenInclude(m => m.MembershipType)
            .Where(p => p.ClubId == clubId && p.MemberId == memberId && p.PaymentId == paymentId)
            .FirstOrDefaultAsync();

        if (payment == null)
        {
            throw new ArgumentException("Payment not found");
        }

        // Only allow editing manual payments (Cash/Check), not Stripe payments
        if (payment.PaymentMethod == "Stripe")
        {
            throw new InvalidOperationException("Stripe payments cannot be edited");
        }

        // Validate payment method
        if (request.PaymentMethod != "Cash" && request.PaymentMethod != "Check")
        {
            throw new ArgumentException("Only Cash and Check payment methods are allowed for manual payments");
        }

        // Update payment details
        payment.Amount = request.Amount;
        payment.PaymentDate = request.PaymentDate;
        payment.PaymentMethod = request.PaymentMethod;
        payment.Notes = request.Notes;

        await _context.SaveChangesAsync();

        // Recalculate member's DuesPaidUntil date
        await RecalculateMemberDuesAsync(memberId);

        return new PaymentResponse
        {
            PaymentId = payment.PaymentId,
            MemberId = payment.MemberId,
            ClubId = payment.ClubId,
            Amount = payment.Amount,
            PaymentDate = payment.PaymentDate,
            PaymentMethod = payment.PaymentMethod,
            Notes = payment.Notes,
            CreatedAt = payment.CreatedAt
        };
    }

    /// <summary>
    /// Deletes a manual payment (Cash or Check only)
    /// </summary>
    public async Task DeletePaymentAsync(int clubId, int memberId, int paymentId)
    {
        var payment = await _context.Payments
            .Where(p => p.ClubId == clubId && p.MemberId == memberId && p.PaymentId == paymentId)
            .FirstOrDefaultAsync();

        if (payment == null)
        {
            throw new ArgumentException("Payment not found");
        }

        // Only allow deleting manual payments (Cash/Check), not Stripe payments
        if (payment.PaymentMethod == "Stripe")
        {
            throw new InvalidOperationException("Stripe payments cannot be deleted");
        }

        _context.Payments.Remove(payment);
        await _context.SaveChangesAsync();

        // Recalculate member's DuesPaidUntil date
        await RecalculateMemberDuesAsync(memberId);
    }

    /// <summary>
    /// Recalculates a member's DuesPaidUntil date based on all their payments
    /// </summary>
    private async Task RecalculateMemberDuesAsync(int memberId)
    {
        var member = await _context.Members
            .Include(m => m.MembershipType)
            .Include(m => m.Payments)
            .FirstOrDefaultAsync(m => m.Id == memberId);

        if (member == null || member.MembershipType == null)
            return;

        var membershipType = member.MembershipType;
        var duesAmount = membershipType.DuesAmount;
        var frequency = membershipType.DuesFrequency?.ToLower() ?? "annually";

        // For $0 membership types, clear DuesPaidUntil
        if (duesAmount == 0)
        {
            member.DuesPaidUntil = null;
            await _context.SaveChangesAsync();
            return;
        }

        // Calculate total payments
        var totalPayments = member.Payments.Sum(p => p.Amount);

        // Calculate how many periods are covered by payments
        var periodsCovered = Math.Floor(totalPayments / duesAmount);

        if (periodsCovered <= 0)
        {
            // No full periods covered
            member.DuesPaidUntil = null;
        }
        else
        {
            // BUG FIX #5: Use the most recent relevant date as base for recalculation
            // This ensures accurate dues status after payment deletion
            var mostRecentPaymentDate = member.Payments.Any()
                ? member.Payments.Max(p => p.PaymentDate)
                : member.JoinDate;

            var baseDate = member.JoinDate;

            // If member was previously current, use that date or most recent payment date
            if (member.DuesPaidUntil.HasValue && member.DuesPaidUntil.Value > member.JoinDate)
            {
                // Use the earlier of current DuesPaidUntil or most recent payment date
                // This prevents backdating when deleting old payments
                baseDate = mostRecentPaymentDate > member.JoinDate ? mostRecentPaymentDate : member.JoinDate;
            }

            var duesPaidUntil = baseDate;

            // Add the appropriate number of periods from the base date
            for (int i = 0; i < periodsCovered; i++)
            {
                duesPaidUntil = frequency switch
                {
                    "weekly" => duesPaidUntil.AddDays(7),
                    "biweekly" => duesPaidUntil.AddDays(14),
                    "monthly" => duesPaidUntil.AddMonths(1),
                    "quarterly" => duesPaidUntil.AddMonths(3),
                    "semiannually" => duesPaidUntil.AddMonths(6),
                    "annually" or "annual" => duesPaidUntil.AddYears(1),
                    "biennially" => duesPaidUntil.AddYears(2),
                    _ => duesPaidUntil.AddYears(1) // Default to annual
                };
            }

            member.DuesPaidUntil = duesPaidUntil;

            _logger.LogInformation("Recalculated dues for member {MemberId}. Base date: {BaseDate}, Periods covered: {Periods}, New DuesPaidUntil: {DuesPaidUntil}",
                memberId, baseDate, periodsCovered, duesPaidUntil);
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Gets all members with their statuses for diagnostic purposes
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <returns>List of all members with status information</returns>
    public async Task<object> GetAllMembersWithStatusesAsync(int clubId)
    {
        var members = await _context.Members
            .Where(m => m.ClubId == clubId)
            .Select(m => new
            {
                m.Id,
                m.Email,
                m.Status,
                m.DuesPaidUntil,
                m.MembershipType!.Name,
                MembershipTypeName = m.MembershipType.Name,
                IsActive = m.Status == "Active",
                DuesStatus = m.DuesPaidUntil == null ? "Never Paid" :
                            m.DuesPaidUntil < DateTime.UtcNow ? "Overdue" : "Current"
            })
            .OrderBy(m => m.Email)
            .ToListAsync();

        return members;
    }

    /// <summary>
    /// Gets the Stripe payment configuration status for the authenticated user's club
    /// </summary>
    public async Task<StripeConfigResponse> GetPaymentConfigurationAsync(int userId)
    {
        try
        {
            // Get the user's email from their User record to find their Member record
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            // Get the member record for this user by email
            var member = await _context.Members
                .Include(m => m.Club)
                .FirstOrDefaultAsync(m => m.Email == user.Email);

            if (member == null)
            {
                throw new ArgumentException("Member profile not found for the authenticated user");
            }

            // Check if running in development mode
            var isDevelopmentMode = _configuration.GetSection("App:IsDevelopmentMode").Value == "true";

            // Check if club has Stripe configured
            var isConfigured = !string.IsNullOrEmpty(member.Club.StripeAccountId);
            var canAcceptPayments = isConfigured || isDevelopmentMode;

            return new StripeConfigResponse
            {
                IsConfigured = isConfigured,
                CanAcceptPayments = canAcceptPayments,
                IsDevelopmentMode = isDevelopmentMode
            };
        }
        catch (Exception ex)
        {
            _logger.LogError("Error getting payment configuration for user {UserId}: {Error}", userId, ex.Message);
            throw;
        }
    }

    private async Task EnsureMemberCapacityAsync(int clubId, string? tier, int additionalActiveMembers)
    {
        var memberLimit = GetMemberLimitForTier(tier);
        var activeMemberCount = await _context.Members
            .AsNoTracking()
            .CountAsync(m => m.ClubId == clubId && m.Status.ToLower() == "active");

        if (activeMemberCount + additionalActiveMembers > memberLimit)
        {
            var displayTier = GetDisplayTierName(tier);
            throw new InvalidOperationException(
                $"{displayTier} allows up to {memberLimit:N0} active members. Remove inactive members or upgrade before adding more.");
        }
    }

    private static int GetMemberLimitForTier(string? tier)
    {
        return tier?.ToLowerInvariant() switch
        {
            "seed" or "sprout" => SeedMemberLimit,
            "grow" => GrowMemberLimit,
            "expand" or "unlimited" => ExpandMemberLimit,
            _ => GrowMemberLimit
        };
    }

    private static string GetDisplayTierName(string? tier)
    {
        return tier?.Equals("Unlimited", StringComparison.OrdinalIgnoreCase) == true ? "Expand" : tier ?? "Grow";
    }
}
