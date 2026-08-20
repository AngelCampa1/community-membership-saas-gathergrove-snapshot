using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace GatherGrove.API.Tests;

/// <summary>
/// Helper class for creating JWT tokens for testing purposes
/// </summary>
public static class TestAuthenticationHelper
{
    private static readonly JwtSecurityTokenHandler TokenHandler = new();
    private static readonly SymmetricSecurityKey Key = new(
        Encoding.UTF8.GetBytes("GatherGrove-Test-Secret-Key-For-JWT-Token-Generation-2024-Testing-Environment-Secure"));

    /// <summary>
    /// Creates a test JWT token with specified claims
    /// </summary>
    /// <param name="userId">The user ID claim</param>
    /// <param name="clubId">The club ID claim</param>
    /// <param name="roles">The roles to assign to the user</param>
    /// <returns>A signed JWT token string</returns>
    public static string CreateTestToken(string userId, string clubId, params string[] roles)
    {
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim("club_id", clubId),
                new Claim(ClaimTypes.Role, string.Join(",", roles))
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = "GatherGrove",
            Audience = "GatherGrove",
            SigningCredentials = new SigningCredentials(Key, SecurityAlgorithms.HmacSha256Signature)
        };

        var token = TokenHandler.CreateToken(tokenDescriptor);
        return TokenHandler.WriteToken(token);
    }

    /// <summary>
    /// Creates a test JWT token for an admin user
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="clubId">The club ID</param>
    /// <returns>A signed JWT token string with admin role</returns>
    public static string CreateAdminToken(string userId, string clubId)
    {
        return CreateTestToken(userId, clubId, "Admin");
    }

    /// <summary>
    /// Creates a test JWT token for a regular user
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="clubId">The club ID</param>
    /// <returns>A signed JWT token string with user role</returns>
    public static string CreateUserToken(string userId, string clubId)
    {
        return CreateTestToken(userId, clubId, "User");
    }
}
