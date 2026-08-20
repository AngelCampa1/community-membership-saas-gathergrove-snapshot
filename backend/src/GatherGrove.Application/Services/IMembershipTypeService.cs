using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for membership type operations
/// </summary>
public interface IMembershipTypeService
{
    /// <summary>
    /// Creates a new membership type for a club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The membership type creation request</param>
    /// <returns>The created membership type</returns>
    Task<MembershipTypeResponse> CreateMembershipTypeAsync(int clubId, CreateMembershipTypeRequest request);

    /// <summary>
    /// Gets all membership types for a club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <returns>List of membership types</returns>
    Task<List<MembershipTypeResponse>> GetMembershipTypesByClubAsync(int clubId);

    /// <summary>
    /// Gets a specific membership type by ID
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="membershipTypeId">The ID of the membership type</param>
    /// <returns>The membership type if found</returns>
    Task<MembershipTypeResponse?> GetMembershipTypeByIdAsync(int clubId, int membershipTypeId);

    /// <summary>
    /// Updates an existing membership type
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="membershipTypeId">The ID of the membership type to update</param>
    /// <param name="request">The membership type update request</param>
    /// <returns>The updated membership type</returns>
    Task<MembershipTypeResponse> UpdateMembershipTypeAsync(int clubId, int membershipTypeId, UpdateMembershipTypeRequest request);

    /// <summary>
    /// Deletes a membership type
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="membershipTypeId">The ID of the membership type to delete</param>
    /// <returns>True if deletion was successful</returns>
    Task<bool> DeleteMembershipTypeAsync(int clubId, int membershipTypeId);
}