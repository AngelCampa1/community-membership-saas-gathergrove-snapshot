using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using System.Security.Cryptography;
using System.Text;
using QRCoder;

namespace GatherGrove.Application.Services;

public class MemberInviteCodeService : IMemberInviteCodeService
{
    private readonly GatherGroveDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IAuthService _authService;
    private readonly IUrlService _urlService;

    public MemberInviteCodeService(
        GatherGroveDbContext context,
        IConfiguration configuration,
        IAuthService authService,
        IUrlService urlService)
    {
        _context = context;
        _configuration = configuration;
        _authService = authService;
        _urlService = urlService;
    }

    public async Task<(bool Success, string Message, MemberInviteCodeResponse? Data)> CreateInviteCodeAsync(
        int clubId, int userId, CreateMemberInviteCodeRequest request)
    {
        try
        {
            // Verify user is admin of the club
            var isAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

            if (!isAdmin)
            {
                return (false, "You must be an admin of this club to create invite codes.", null);
            }

            // Verify membership type exists and belongs to the club
            var membershipType = await _context.MembershipTypes
                .FirstOrDefaultAsync(mt => mt.Id == request.MembershipTypeId && mt.ClubId == clubId);

            if (membershipType == null)
            {
                return (false, "Invalid membership type.", null);
            }

            // Generate unique code
            var code = GenerateUniqueCode();

            // Ensure code is unique
            while (await _context.MemberInviteCodes.AnyAsync(ic => ic.Code == code))
            {
                code = GenerateUniqueCode();
            }

            var inviteCode = new MemberInviteCode
            {
                ClubId = clubId,
                Code = code,
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                MembershipTypeId = request.MembershipTypeId,
                ExpiresAt = request.ExpiresAt,
                MaxUses = request.MaxUses,
                CurrentUses = 0,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            };

            _context.MemberInviteCodes.Add(inviteCode);
            await _context.SaveChangesAsync();

            return await GetInviteCodeByIdAsync(inviteCode.Id, clubId, userId);
        }
        catch (Exception ex)
        {
            return (false, $"Error creating invite code: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, List<MemberInviteCodeResponse> Data)> GetClubInviteCodesAsync(
        int clubId, int userId)
    {
        try
        {
            // Verify user is admin of the club
            var isAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

            if (!isAdmin)
            {
                return (false, "You must be an admin of this club to view invite codes.", new List<MemberInviteCodeResponse>());
            }

            var inviteCodesData = await _context.MemberInviteCodes
                .Include(ic => ic.MembershipType)
                .Include(ic => ic.CreatedByUser)
                .Where(ic => ic.ClubId == clubId)
                .OrderByDescending(ic => ic.CreatedAt)
                .ToListAsync();

            var inviteCodes = inviteCodesData.Select(ic => MapToResponse(ic)).ToList();

            return (true, "Invite codes retrieved successfully.", inviteCodes);
        }
        catch (Exception ex)
        {
            return (false, $"Error retrieving invite codes: {ex.Message}", new List<MemberInviteCodeResponse>());
        }
    }

    public async Task<(bool Success, string Message, MemberInviteCodeResponse? Data)> GetInviteCodeByCodeAsync(string code)
    {
        try
        {
            var inviteCode = await _context.MemberInviteCodes
                .Include(ic => ic.MembershipType)
                .Include(ic => ic.CreatedByUser)
                .Include(ic => ic.Club)
                .FirstOrDefaultAsync(ic => ic.Code == code);

            if (inviteCode == null)
            {
                return (false, "Invite code not found.", null);
            }

            var response = MapToResponse(inviteCode);
            return (true, "Invite code retrieved successfully.", response);
        }
        catch (Exception ex)
        {
            return (false, $"Error retrieving invite code: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, MemberInviteCodeResponse? Data)> GetInviteCodeByIdAsync(
        int id, int clubId, int userId)
    {
        try
        {
            // Verify user is admin of the club
            var isAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

            if (!isAdmin)
            {
                return (false, "You must be an admin of this club to view invite codes.", null);
            }

            var inviteCode = await _context.MemberInviteCodes
                .Include(ic => ic.MembershipType)
                .Include(ic => ic.CreatedByUser)
                .Include(ic => ic.Club)
                .FirstOrDefaultAsync(ic => ic.Id == id && ic.ClubId == clubId);

            if (inviteCode == null)
            {
                return (false, "Invite code not found.", null);
            }

            var response = MapToResponse(inviteCode);
            return (true, "Invite code retrieved successfully.", response);
        }
        catch (Exception ex)
        {
            return (false, $"Error retrieving invite code: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message)> ToggleInviteCodeStatusAsync(int id, int clubId, int userId)
    {
        try
        {
            // Verify user is admin of the club
            var isAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

            if (!isAdmin)
            {
                return (false, "You must be an admin of this club to modify invite codes.");
            }

            var inviteCode = await _context.MemberInviteCodes
                .FirstOrDefaultAsync(ic => ic.Id == id && ic.ClubId == clubId);

            if (inviteCode == null)
            {
                return (false, "Invite code not found.");
            }

            inviteCode.IsActive = !inviteCode.IsActive;
            inviteCode.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return (true, $"Invite code {(inviteCode.IsActive ? "activated" : "deactivated")} successfully.");
        }
        catch (Exception ex)
        {
            return (false, $"Error updating invite code: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> DeleteInviteCodeAsync(int id, int clubId, int userId)
    {
        try
        {
            // Verify user is admin of the club
            var isAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

            if (!isAdmin)
            {
                return (false, "You must be an admin of this club to delete invite codes.");
            }

            var inviteCode = await _context.MemberInviteCodes
                .FirstOrDefaultAsync(ic => ic.Id == id && ic.ClubId == clubId);

            if (inviteCode == null)
            {
                return (false, "Invite code not found.");
            }

            _context.MemberInviteCodes.Remove(inviteCode);
            await _context.SaveChangesAsync();

            return (true, "Invite code deleted successfully.");
        }
        catch (Exception ex)
        {
            return (false, $"Error deleting invite code: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message, MemberResponse? Data)> RegisterMemberWithInviteCodeAsync(
        RegisterWithInviteCodeRequest request)
    {
        try
        {
            // Validate invite code
            var codeValidation = await ValidateInviteCodeAsync(request.InviteCode);
            if (!codeValidation.Success || codeValidation.Data == null)
            {
                return (false, codeValidation.Message, null);
            }

            var inviteCode = await _context.MemberInviteCodes
                .Include(ic => ic.Club)
                .Include(ic => ic.MembershipType)
                .FirstOrDefaultAsync(ic => ic.Code == request.InviteCode);

            if (inviteCode == null)
            {
                return (false, "Invalid invite code.", null);
            }

            // Check if member already exists in this club
            var existingMember = await _context.Members
                .FirstOrDefaultAsync(m => m.ClubId == inviteCode.ClubId && m.Email == request.Email);

            if (existingMember != null)
            {
                return (false, "A member with this email already exists in this club.", null);
            }

            // Create user account first
            var registerRequest = new RegisterRequest
            {
                FullName = request.FullName,
                Email = request.Email,
                Password = request.Password,
                ClubName = "" // Not creating a club, just user account
            };

            var userResult = await _authService.RegisterAsync(registerRequest, false); // false = don't create club
            if (!userResult.Success)
            {
                return (false, userResult.Message, null);
            }

            // Create member record
            var member = new Member
            {
                ClubId = inviteCode.ClubId,
                MembershipTypeId = inviteCode.MembershipTypeId,
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim().ToLower(),
                PhoneNumber = request.PhoneNumber?.Trim(),
                Address = request.Address?.Trim(),
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                HasSmsConsent = false,
                IsListedInDirectory = false, // Member can opt-in later
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                InviteCodeId = inviteCode.Id
            };

            _context.Members.Add(member);

            // Update invite code usage
            inviteCode.CurrentUses++;
            inviteCode.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Return member response
            var memberResponse = new MemberResponse
            {
                Id = member.Id,
                ClubId = member.ClubId,
                MembershipTypeId = member.MembershipTypeId,
                MembershipTypeName = inviteCode.MembershipType.Name,
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

            return (true, "Member registered successfully!", memberResponse);
        }
        catch (Exception ex)
        {
            return (false, $"Error registering member: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, MemberInviteCodeResponse? Data)> ValidateInviteCodeAsync(string code)
    {
        try
        {
            var inviteCode = await _context.MemberInviteCodes
                .Include(ic => ic.MembershipType)
                .Include(ic => ic.CreatedByUser)
                .Include(ic => ic.Club)
                .FirstOrDefaultAsync(ic => ic.Code == code);

            if (inviteCode == null)
            {
                return (false, "Invalid invite code.", null);
            }

            if (!inviteCode.IsActive)
            {
                return (false, "This invite code has been deactivated.", null);
            }

            if (inviteCode.ExpiresAt < DateTime.UtcNow)
            {
                return (false, "This invite code has expired.", null);
            }

            if (inviteCode.MaxUses.HasValue && inviteCode.CurrentUses >= inviteCode.MaxUses.Value)
            {
                return (false, "This invite code has reached its maximum usage limit.", null);
            }

            var response = MapToResponse(inviteCode);
            return (true, "Invite code is valid.", response);
        }
        catch (Exception ex)
        {
            return (false, $"Error validating invite code: {ex.Message}", null);
        }
    }

    private MemberInviteCodeResponse MapToResponse(MemberInviteCode inviteCode)
    {
        var joinUrl = _urlService.GenerateJoinUrl(inviteCode.Code);

        return new MemberInviteCodeResponse
        {
            Id = inviteCode.Id,
            ClubId = inviteCode.ClubId,
            Code = inviteCode.Code,
            Name = inviteCode.Name,
            Description = inviteCode.Description,
            MembershipTypeId = inviteCode.MembershipTypeId,
            MembershipTypeName = inviteCode.MembershipType?.Name ?? "",
            ExpiresAt = inviteCode.ExpiresAt,
            MaxUses = inviteCode.MaxUses,
            CurrentUses = inviteCode.CurrentUses,
            IsActive = inviteCode.IsActive,
            CreatedAt = inviteCode.CreatedAt,
            UpdatedAt = inviteCode.UpdatedAt,
            CreatedByUserId = inviteCode.CreatedByUserId,
            CreatedByUserName = inviteCode.CreatedByUser?.FullName ?? "",
            JoinUrl = joinUrl,
            QrCodeDataUrl = GenerateQrCodeDataUrl(joinUrl)
        };
    }

    private string GenerateUniqueCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const int length = 8;

        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[length];
        rng.GetBytes(bytes);

        var result = new StringBuilder(length);
        for (int i = 0; i < length; i++)
        {
            result.Append(chars[bytes[i] % chars.Length]);
        }

        return result.ToString();
    }

    private string GenerateQrCodeDataUrl(string url)
    {
        try
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new Base64QRCode(qrCodeData);

            var qrCodeImageAsBase64 = qrCode.GetGraphic(20);
            return $"data:image/png;base64,{qrCodeImageAsBase64}";
        }
        catch (Exception)
        {
            // Fallback to placeholder if QR generation fails
            var fallbackSvg = $"<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='#f0f0f0'/><text x='100' y='100' text-anchor='middle' font-family='Arial' font-size='12' fill='#666'>QR Code Error</text></svg>";
            return $"data:image/svg+xml;base64,{Convert.ToBase64String(Encoding.UTF8.GetBytes(fallbackSvg))}";
        }
    }
}
