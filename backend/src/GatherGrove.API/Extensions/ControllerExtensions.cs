using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;

namespace GatherGrove.API.Extensions;

/// <summary>
/// Extension methods for controllers to simplify authorization checks
/// </summary>
public static class ControllerExtensions
{
    /// <summary>
    /// Verifies that the user can access the specified club as an admin
    /// </summary>
    /// <param name="controller">The controller instance</param>
    /// <param name="authService">The authorization service</param>
    /// <param name="clubId">The club ID to verify access for</param>
    /// <returns>Forbid result if access denied, null if access allowed</returns>
    public static async Task<IActionResult?> VerifyClubAdminAccessAsync(
        this ControllerBase controller,
        IClubAuthorizationService authService,
        int clubId)
    {
        if (!await authService.CanAccessClubAsAdminAsync(controller.User, clubId))
        {
            return controller.Forbid();
        }
        return null;
    }

    /// <summary>
    /// Verifies that the user can access the specified club as a member
    /// </summary>
    /// <param name="controller">The controller instance</param>
    /// <param name="authService">The authorization service</param>
    /// <param name="clubId">The club ID to verify access for</param>
    /// <returns>Forbid result if access denied, null if access allowed</returns>
    public static async Task<IActionResult?> VerifyClubMemberAccessAsync(
        this ControllerBase controller,
        IClubAuthorizationService authService,
        int clubId)
    {
        if (!await authService.CanAccessClubAsMemberAsync(controller.User, clubId))
        {
            return controller.Forbid();
        }
        return null;
    }

    /// <summary>
    /// Verifies that the club has access to Grow tier features
    /// </summary>
    /// <param name="controller">The controller instance</param>
    /// <param name="authService">The authorization service</param>
    /// <param name="clubId">The club ID to verify tier for</param>
    /// <returns>Forbid result if access denied, null if access allowed</returns>
    public static async Task<IActionResult?> VerifyGrowTierAccessAsync(
        this ControllerBase controller,
        IClubAuthorizationService authService,
        int clubId)
    {
        if (!await authService.CanAccessGrowFeaturesAsync(clubId))
        {
            return controller.Forbid();
        }
        return null;
    }

    /// <summary>
    /// Verifies that the club has access to Unlimited tier features
    /// </summary>
    /// <param name="controller">The controller instance</param>
    /// <param name="authService">The authorization service</param>
    /// <param name="clubId">The club ID to verify tier for</param>
    /// <returns>Forbid result if access denied, null if access allowed</returns>
    public static async Task<IActionResult?> VerifyUnlimitedTierAccessAsync(
        this ControllerBase controller,
        IClubAuthorizationService authService,
        int clubId)
    {
        if (!await authService.CanAccessUnlimitedFeaturesAsync(clubId))
        {
            return controller.Forbid();
        }
        return null;
    }

    /// <summary>
    /// Gets the current user's club ID from claims
    /// </summary>
    /// <param name="controller">The controller instance</param>
    /// <param name="authService">The authorization service</param>
    /// <returns>Club ID if found, null otherwise</returns>
    public static int? GetUserClubId(
        this ControllerBase controller,
        IClubAuthorizationService authService)
    {
        return authService.GetClubIdFromClaims(controller.User);
    }

    /// <summary>
    /// Gets the current user's ID from claims
    /// </summary>
    /// <param name="controller">The controller instance</param>
    /// <param name="authService">The authorization service</param>
    /// <returns>User ID if found, null otherwise</returns>
    public static int? GetCurrentUserId(
        this ControllerBase controller,
        IClubAuthorizationService authService)
    {
        return authService.GetUserIdFromClaims(controller.User);
    }
}