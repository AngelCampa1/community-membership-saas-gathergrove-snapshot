using Microsoft.AspNetCore.Http;
using GatherGrove.Application.DTOs.Branding;

namespace GatherGrove.Application.Services.Branding;

/// <summary>
/// Service interface for managing club branding operations
/// </summary>
public interface IBrandingService
{
    /// <summary>
    /// Gets branding settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID</param>
    /// <returns>The branding settings</returns>
    /// <exception cref="UnauthorizedAccessException">When user is not authorized</exception>
    /// <exception cref="KeyNotFoundException">When branding settings not found</exception>
    /// <exception cref="InvalidOperationException">When club is not Unlimited tier</exception>
    Task<BrandingResponse> GetBrandingAsync(int clubId, int userId);

    /// <summary>
    /// Creates new branding settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID</param>
    /// <param name="request">The branding settings to create</param>
    /// <returns>The created branding settings</returns>
    /// <exception cref="UnauthorizedAccessException">When user is not authorized</exception>
    /// <exception cref="InvalidOperationException">When branding already exists or club is not Unlimited tier</exception>
    Task<BrandingResponse> CreateBrandingAsync(int clubId, int userId, CreateBrandingRequest request);

    /// <summary>
    /// Updates existing branding settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID</param>
    /// <param name="request">The branding settings to update</param>
    /// <returns>The updated branding settings</returns>
    /// <exception cref="UnauthorizedAccessException">When user is not authorized</exception>
    /// <exception cref="KeyNotFoundException">When branding settings not found</exception>
    /// <exception cref="InvalidOperationException">When club is not Unlimited tier</exception>
    Task<BrandingResponse> UpdateBrandingAsync(int clubId, int userId, UpdateBrandingRequest request);

    /// <summary>
    /// Deletes branding settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID</param>
    /// <exception cref="UnauthorizedAccessException">When user is not authorized</exception>
    /// <exception cref="KeyNotFoundException">When branding settings not found</exception>
    /// <exception cref="InvalidOperationException">When club is not Unlimited tier</exception>
    Task DeleteBrandingAsync(int clubId, int userId);

    /// <summary>
    /// Uploads a logo file for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID</param>
    /// <param name="file">The logo file to upload</param>
    /// <returns>The upload response with logo URL</returns>
    /// <exception cref="UnauthorizedAccessException">When user is not authorized</exception>
    /// <exception cref="ArgumentException">When file is invalid</exception>
    /// <exception cref="InvalidOperationException">When club is not Unlimited tier</exception>
    Task<LogoUploadResponse> UploadLogoAsync(int clubId, int userId, IFormFile file);

    /// <summary>
    /// Uploads a favicon file for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID</param>
    /// <param name="file">The favicon file to upload</param>
    /// <returns>The upload response with favicon URL</returns>
    /// <exception cref="UnauthorizedAccessException">When user is not authorized</exception>
    /// <exception cref="ArgumentException">When file is invalid</exception>
    /// <exception cref="InvalidOperationException">When club is not Unlimited tier</exception>
    Task<FaviconUploadResponse> UploadFaviconAsync(int clubId, int userId, IFormFile file);
}