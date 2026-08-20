using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using GatherGrove.API;
using Microsoft.AspNetCore.Hosting;

namespace GatherGrove.Application.Tests.Shared;

/// <summary>
/// Base class for integration tests with proper JWT authentication setup
/// Provides common functionality for all integration tests
/// </summary>
[TestFixture]
public abstract class IntegrationTestBase
{
    protected WebApplicationFactory<Program> Factory = null!;
    protected HttpClient Client = null!;
    protected string AuthToken = null!;

    private const string TestSecretKey = "TestSecretKeyThatIsAtLeast32CharactersLongForTesting123!";
    private const string TestIssuer = "GatherGrove";
    private const string TestAudience = "GatherGrove";

    [SetUp]
    public virtual void SetUp()
    {
        // Create factory with proper JWT configuration
        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                // Set environment variables for proper JWT configuration
                Environment.SetEnvironmentVariable("JWT_SECRET_KEY", TestSecretKey);
                Environment.SetEnvironmentVariable("USE_INMEMORY_DB", "true");
                Environment.SetEnvironmentVariable("SKIP_DB_SEEDING", "true");
                Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");

                builder.UseEnvironment("Testing");

                builder.ConfigureAppConfiguration((context, config) =>
                {
                    config.AddInMemoryCollection(new KeyValuePair<string, string?>[]
                    {
                        KeyValuePair.Create<string, string?>("JwtSettings:SecretKey", TestSecretKey),
                        KeyValuePair.Create<string, string?>("JwtSettings:Issuer", TestIssuer),
                        KeyValuePair.Create<string, string?>("JwtSettings:Audience", TestAudience),
                        KeyValuePair.Create<string, string?>("JwtSettings:ExpiryMinutes", "60"),
                        KeyValuePair.Create<string, string?>("Stripe:SecretKey", "sk_test_123456789"),
                        KeyValuePair.Create<string, string?>("Stripe:PublishableKey", "pk_test_123456789"),
                        KeyValuePair.Create<string, string?>("App:FrontendUrl", "http://localhost:3000"),
                        KeyValuePair.Create<string, string?>("App:ApiUrl", "http://localhost:5284")
                    });
                });

                // Allow derived classes to configure additional services
                ConfigureTestServices(builder);
            });

        Client = Factory.CreateClient();
        AuthToken = GenerateTestJwtToken();
        Client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", AuthToken);
    }

    [TearDown]
    public virtual void TearDown()
    {
        Client?.Dispose();
        Factory?.Dispose();
    }

    /// <summary>
    /// Override this method in derived classes to configure additional test services
    /// </summary>
    protected virtual void ConfigureTestServices(IWebHostBuilder builder)
    {
        // Default implementation does nothing
        // Derived classes can override to add mock services
    }

    /// <summary>
    /// Generate a JWT token for testing with specified user information
    /// </summary>
    protected string GenerateTestJwtToken(
        int userId = 1,
        string email = "claude.test@gathergrove.club",
        string role = "Admin",
        int? clubId = 1,
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
                new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64)
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
    protected string GenerateClubAdminToken(int userId = 1, int clubId = 1, string email = "claude.test@gathergrove.club")
    {
        return GenerateTestJwtToken(userId, email, "Admin", clubId);
    }

    /// <summary>
    /// Generate a JWT token for a club member
    /// </summary>
    protected string GenerateClubMemberToken(int userId = 2, int clubId = 1, string email = "member.test@gathergrove.club")
    {
        return GenerateTestJwtToken(userId, email, "Member", clubId);
    }

    /// <summary>
    /// Generate an expired JWT token for testing authentication failures
    /// </summary>
    protected string GenerateExpiredToken(int userId = 1, string email = "claude.test@gathergrove.club")
    {
        return GenerateTestJwtToken(userId, email, "Admin", expiryMinutes: -60); // Expired 1 hour ago
    }

    /// <summary>
    /// Helper method to create HTTP content from object
    /// </summary>
    protected static StringContent CreateJsonContent(object obj)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(obj, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
        });
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    /// <summary>
    /// Helper method to deserialize HTTP response content
    /// </summary>
    protected static async Task<T?> DeserializeResponse<T>(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return System.Text.Json.JsonSerializer.Deserialize<T>(content, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }
}