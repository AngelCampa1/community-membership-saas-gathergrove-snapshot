using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for personalizing communication content with member-specific data
/// </summary>
public class PersonalizationService : IPersonalizationService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<PersonalizationService> _logger;

    public PersonalizationService(
        GatherGroveDbContext context,
        ILogger<PersonalizationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PersonalizedContentResponse> PersonalizeContentAsync(int clubId, PersonalizeContentRequest request)
    {
        _logger.LogInformation("Personalizing content for member {MemberId} in club {ClubId}",
            request.MemberId, clubId);

        var response = new PersonalizedContentResponse();

        try
        {
            var personalizedContent = await ReplaceTokensAsync(clubId, request.MemberId, request.Content);
            response.Content = personalizedContent;

            // Track which tokens were replaced
            var tokenMatches = Regex.Matches(request.Content, @"\{\{([^}]+)\}\}");
            foreach (Match match in tokenMatches)
            {
                var tokenName = match.Groups[1].Value.Trim();
                if (!personalizedContent.Contains(match.Value))
                {
                    response.ReplacedTokens[tokenName] = "replaced";
                }
                else
                {
                    response.FailedTokens.Add(tokenName);
                }
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error personalizing content for member {MemberId}", request.MemberId);
            response.Content = request.Content;
            return response;
        }
    }

    public async Task<AvailableTokensResponse> GetAvailableTokensAsync(int clubId)
    {
        _logger.LogInformation("Getting available tokens for club {ClubId}", clubId);

        var response = new AvailableTokensResponse();

        // System tokens
        response.SystemTokens = new List<TokenInfo>
        {
            new() { TokenName = "member_name", DisplayName = "Member Name", Description = "Full name of the member", Category = "Member", ExampleValue = "John Doe", IsSystemToken = true },
            new() { TokenName = "member_first_name", DisplayName = "First Name", Description = "Member's first name", Category = "Member", ExampleValue = "John", IsSystemToken = true },
            new() { TokenName = "member_last_name", DisplayName = "Last Name", Description = "Member's last name", Category = "Member", ExampleValue = "Doe", IsSystemToken = true },
            new() { TokenName = "member_email", DisplayName = "Email Address", Description = "Member's email", Category = "Member", ExampleValue = "john@example.com", IsSystemToken = true },
            new() { TokenName = "member_phone", DisplayName = "Phone Number", Description = "Member's phone number", Category = "Member", ExampleValue = "(555) 123-4567", IsSystemToken = true },
            new() { TokenName = "club_name", DisplayName = "Club Name", Description = "Name of the club", Category = "Club", ExampleValue = "Awesome Club", IsSystemToken = true },
            new() { TokenName = "membership_type", DisplayName = "Membership Type", Description = "Member's membership type", Category = "Member", ExampleValue = "Premium", IsSystemToken = true },
            new() { TokenName = "dues_status", DisplayName = "Dues Status", Description = "Current dues payment status", Category = "Member", ExampleValue = "Current", IsSystemToken = true },
            new() { TokenName = "join_date", DisplayName = "Join Date", Description = "When the member joined", Category = "Member", ExampleValue = "January 15, 2024", IsSystemToken = true },
            new() { TokenName = "engagement_score", DisplayName = "Engagement Score", Description = "Member's engagement score", Category = "Analytics", ExampleValue = "85", IsSystemToken = true },
            new() { TokenName = "upcoming_events", DisplayName = "Upcoming Events", Description = "List of upcoming club events", Category = "Events", ExampleValue = "Summer Picnic, Monthly Meeting", IsSystemToken = true },
            new() { TokenName = "current_year", DisplayName = "Current Year", Description = "Current calendar year", Category = "System", ExampleValue = "2024", IsSystemToken = true },
            new() { TokenName = "current_date", DisplayName = "Current Date", Description = "Today's date", Category = "System", ExampleValue = "October 13, 2025", IsSystemToken = true }
        };

        // Custom tokens from database
        var customTokens = await _context.PersonalizationTokens
            .AsNoTracking()
            .Where(t => t.ClubId == clubId && t.IsActive)
            .OrderBy(t => t.SortOrder)
            .ThenBy(t => t.DisplayName)
            .ToListAsync();

        response.CustomTokens = customTokens.Select(t => new TokenInfo
        {
            Id = t.Id,
            TokenName = t.TokenName,
            DisplayName = t.DisplayName,
            Description = t.Description,
            Category = t.Category,
            DefaultValue = t.DefaultValue,
            ExampleValue = t.DefaultValue ?? "[Custom Value]",
            IsSystemToken = false
        }).ToList();

        return response;
    }

    public async Task<TokenInfo> CreateCustomTokenAsync(int clubId, int userId, CreatePersonalizationTokenRequest request)
    {
        _logger.LogInformation("Creating custom token {TokenName} for club {ClubId}", request.TokenName, clubId);

        // Validate token name doesn't conflict with system tokens
        var systemTokenNames = new[] { "member_name", "member_first_name", "member_last_name", "member_email",
            "member_phone", "club_name", "membership_type", "dues_status", "join_date", "engagement_score",
            "upcoming_events", "current_year", "current_date" };

        if (systemTokenNames.Contains(request.TokenName.ToLower()))
        {
            throw new ArgumentException($"Token name '{request.TokenName}' is reserved. Please choose a different name.");
        }

        // Check if token already exists
        var existingToken = await _context.PersonalizationTokens
            .FirstOrDefaultAsync(t => t.ClubId == clubId && t.TokenName == request.TokenName);

        if (existingToken != null)
        {
            throw new ArgumentException($"Token '{request.TokenName}' already exists for this club.");
        }

        var token = new PersonalizationToken
        {
            ClubId = clubId,
            TokenName = request.TokenName,
            DisplayName = request.DisplayName,
            Description = request.Description,
            Category = request.Category,
            DataSource = request.DataSource,
            DefaultValue = request.DefaultValue,
            IsSystemToken = false,
            IsActive = true,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.PersonalizationTokens.Add(token);
        await _context.SaveChangesAsync();

        return new TokenInfo
        {
            Id = token.Id,
            TokenName = token.TokenName,
            DisplayName = token.DisplayName,
            Description = token.Description,
            Category = token.Category,
            DefaultValue = token.DefaultValue,
            ExampleValue = token.DefaultValue ?? "[Custom Value]",
            IsSystemToken = false
        };
    }

    public async Task<PreviewPersonalizationResponse> PreviewPersonalizationAsync(int clubId, PreviewPersonalizationRequest request)
    {
        _logger.LogInformation("Previewing personalization for club {ClubId}", clubId);

        var response = new PreviewPersonalizationResponse();

        // Get sample members
        var membersQuery = _context.Members
            .AsNoTracking()
            .Where(m => m.ClubId == clubId && m.Status == "Active");

        if (request.SegmentId.HasValue)
        {
            var segmentMemberIds = await _context.SegmentMembers
                .Where(sm => sm.SegmentId == request.SegmentId.Value)
                .Select(sm => sm.MemberId)
                .ToListAsync();

            membersQuery = membersQuery.Where(m => segmentMemberIds.Contains(m.Id));
        }

        var sampleMembers = await membersQuery
            .OrderBy(m => Guid.NewGuid()) // Random selection
            .Take(request.SampleCount)
            .ToListAsync();

        foreach (var member in sampleMembers)
        {
            var personalizedContent = await ReplaceTokensAsync(clubId, member.Id, request.Content);

            response.Samples.Add(new PersonalizedSample
            {
                MemberId = member.Id,
                MemberName = member.FullName,
                PersonalizedContent = personalizedContent
            });
        }

        return response;
    }

    public async Task<string> ReplaceTokensAsync(int clubId, int memberId, string content)
    {
        if (string.IsNullOrEmpty(content))
        {
            return content;
        }

        // Get member data
        var member = await _context.Members
            .AsNoTracking()
            .Include(m => m.Club)
            .Include(m => m.MembershipType)
            .Include(m => m.CustomFieldValues)
                .ThenInclude(cfv => cfv.CustomField)
            .Include(m => m.MemberEngagementScore)
            .FirstOrDefaultAsync(m => m.Id == memberId && m.ClubId == clubId);

        if (member == null)
        {
            _logger.LogWarning("Member {MemberId} not found in club {ClubId}", memberId, clubId);
            return content;
        }

        var result = content;

        // Replace system tokens
        result = result.Replace("{{member_name}}", member.FullName);
        result = result.Replace("{{member_first_name}}", member.FirstName);
        result = result.Replace("{{member_last_name}}", member.LastName);
        result = result.Replace("{{member_email}}", member.Email);
        result = result.Replace("{{member_phone}}", member.PhoneNumber ?? "[No phone number]");
        result = result.Replace("{{club_name}}", member.Club.Name);
        result = result.Replace("{{membership_type}}", member.MembershipType.Name);

        // Dues status
        var duesStatus = GetDuesStatus(member);
        result = result.Replace("{{dues_status}}", duesStatus);

        // Join date
        result = result.Replace("{{join_date}}", member.JoinDate.ToString("MMMM dd, yyyy"));

        // Engagement score
        var engagementScore = member.MemberEngagementScore?.AverageEventEngagementScore.ToString("F0") ?? "N/A";
        result = result.Replace("{{engagement_score}}", engagementScore);

        // Upcoming events
        var upcomingEvents = await GetUpcomingEventsAsync(clubId);
        result = result.Replace("{{upcoming_events}}", upcomingEvents);

        // System tokens
        result = result.Replace("{{current_year}}", DateTime.UtcNow.Year.ToString());
        result = result.Replace("{{current_date}}", DateTime.UtcNow.ToString("MMMM dd, yyyy"));

        // Replace custom field tokens
        foreach (var customFieldValue in member.CustomFieldValues)
        {
            var fieldName = customFieldValue.CustomField.FieldName.ToLower().Replace(" ", "_");
            var token = $"{{{{custom_fields.{fieldName}}}}}";
            result = result.Replace(token, customFieldValue.Value ?? "[Not set]");
        }

        // Replace custom tokens
        var customTokens = await _context.PersonalizationTokens
            .AsNoTracking()
            .Where(t => t.ClubId == clubId && t.IsActive)
            .ToListAsync();

        foreach (var token in customTokens)
        {
            var tokenPlaceholder = $"{{{{{token.TokenName}}}}}";
            var tokenValue = await ResolveCustomTokenAsync(token, member);
            result = result.Replace(tokenPlaceholder, tokenValue);
        }

        return result;
    }

    private string GetDuesStatus(Member member)
    {
        if (!member.DuesPaidUntil.HasValue)
        {
            return "Unknown";
        }

        if (member.DuesPaidUntil.Value >= DateTime.UtcNow)
        {
            return "Current";
        }

        return "Overdue";
    }

    private async Task<string> GetUpcomingEventsAsync(int clubId)
    {
        var events = await _context.Events
            .AsNoTracking()
            .Where(e => e.ClubId == clubId && e.EventDateTime >= DateTime.UtcNow)
            .OrderBy(e => e.EventDateTime)
            .Take(3)
            .Select(e => e.Name)
            .ToListAsync();

        return events.Any() ? string.Join(", ", events) : "No upcoming events";
    }

    private async Task<string> ResolveCustomTokenAsync(PersonalizationToken token, Member member)
    {
        // For now, return default value
        // In the future, this could execute complex logic based on DataSource
        return await Task.FromResult(token.DefaultValue ?? $"[{token.DisplayName}]");
    }
}

