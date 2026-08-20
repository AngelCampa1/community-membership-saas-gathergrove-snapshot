using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Helper class for generating JWT tokens for testing purposes
/// </summary>
public static class JwtTestHelper
{
    private const string TestSecretKey = "TestSecretKeyThatIsAtLeast32CharactersLongForTesting123!";
    private const string TestIssuer = "GatherGrove";
    private const string TestAudience = "GatherGrove";

    /// <summary>
    /// Generate a JWT token for testing with specified user information
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="email">User email</param>
    /// <param name="role">User role (Admin, Member, etc.)</param>
    /// <param name="clubId">Club ID (optional)</param>
    /// <param name="expiryMinutes">Token expiry in minutes (default: 60)</param>
    /// <returns>JWT token string</returns>
    public static string GenerateTestJwtToken(
        int userId = 1,
        string email = "claude.test@gathergrove.club",
        string role = "Admin",
        int? clubId = null,
        int expiryMinutes = 60)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(TestSecretKey);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, role),
            new("full_name", "Claude Code Test"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat,
                new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        // Add club ID if provided
        if (clubId.HasValue)
        {
            claims.Add(new Claim("club_id", clubId.Value.ToString()));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Issuer = TestIssuer,
            Audience = TestAudience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    /// <summary>
    /// Generate a JWT token for a specific club admin
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="clubId">Club ID</param>
    /// <param name="email">User email</param>
    /// <returns>JWT token string</returns>
    public static string GenerateClubAdminToken(int userId = 1, int clubId = 1, string email = "claude.test@gathergrove.club")
    {
        return GenerateTestJwtToken(userId, email, "Admin", clubId);
    }

    /// <summary>
    /// Generate a JWT token for a club member
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="clubId">Club ID</param>
    /// <param name="email">User email</param>
    /// <returns>JWT token string</returns>
    public static string GenerateClubMemberToken(int userId = 2, int clubId = 1, string email = "member.test@gathergrove.club")
    {
        return GenerateTestJwtToken(userId, email, "Member", clubId);
    }

    /// <summary>
    /// Generate an expired JWT token for testing authentication failures
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="email">User email</param>
    /// <returns>Expired JWT token string</returns>
    public static string GenerateExpiredToken(int userId = 1, string email = "claude.test@gathergrove.club")
    {
        return GenerateTestJwtToken(userId, email, "Admin", expiryMinutes: -60); // Expired 1 hour ago
    }

    /// <summary>
    /// Generate a JWT token with invalid signature for testing
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="email">User email</param>
    /// <returns>JWT token with invalid signature</returns>
    public static string GenerateInvalidSignatureToken(int userId = 1, string email = "claude.test@gathergrove.club")
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var invalidKey = Encoding.UTF8.GetBytes("InvalidSecretKeyThatIsAtLeast32CharactersLongForTesting123!");

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, "Admin")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(60),
            Issuer = TestIssuer,
            Audience = TestAudience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(invalidKey),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}