using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for personalizing communication content with member-specific data
/// </summary>
public interface IPersonalizationService
{
    /// <summary>
    /// Personalizes content for a specific member by replacing tokens
    /// </summary>
    Task<PersonalizedContentResponse> PersonalizeContentAsync(int clubId, PersonalizeContentRequest request);

    /// <summary>
    /// Gets all available personalization tokens for a club
    /// </summary>
    Task<AvailableTokensResponse> GetAvailableTokensAsync(int clubId);

    /// <summary>
    /// Creates a custom personalization token for a club
    /// </summary>
    Task<TokenInfo> CreateCustomTokenAsync(int clubId, int userId, CreatePersonalizationTokenRequest request);

    /// <summary>
    /// Previews personalized content for sample members
    /// </summary>
    Task<PreviewPersonalizationResponse> PreviewPersonalizationAsync(int clubId, PreviewPersonalizationRequest request);

    /// <summary>
    /// Replaces all tokens in content for a specific member (used internally)
    /// </summary>
    Task<string> ReplaceTokensAsync(int clubId, int memberId, string content);
}

