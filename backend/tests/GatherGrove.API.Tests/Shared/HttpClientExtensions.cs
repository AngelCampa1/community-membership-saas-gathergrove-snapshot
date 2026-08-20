using System.Net.Http;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Extension methods for HttpClient to add test authentication headers
/// </summary>
public static class HttpClientExtensions
{
    /// <summary>
    /// Adds test authentication headers to simulate an authenticated admin user
    /// </summary>
    public static HttpClient WithTestAuth(this HttpClient client,
        int userId = 1,
        int clubId = 1,
        bool isAdmin = true,
        string role = "Admin",
        bool hasUnlimitedTier = true)
    {
        // Add test headers for the new authentication handler
        client.DefaultRequestHeaders.Add("X-Test-UserId", userId.ToString());
        client.DefaultRequestHeaders.Add("X-Test-ClubId", clubId.ToString());
        client.DefaultRequestHeaders.Add("X-Test-IsAdmin", isAdmin.ToString().ToLower());
        client.DefaultRequestHeaders.Add("X-Test-Role", role);
        client.DefaultRequestHeaders.Add("X-Test-UnlimitedTier", hasUnlimitedTier.ToString().ToLower());

        // Also add Authorization header for backward compatibility
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Test");

        return client;
    }

    /// <summary>
    /// Adds test authentication headers to simulate an authenticated member user
    /// </summary>
    public static HttpClient WithMemberAuth(this HttpClient client,
        int userId = 2,
        int clubId = 1)
    {
        return client.WithTestAuth(userId, clubId, isAdmin: false, role: "Member", hasUnlimitedTier: false);
    }

    /// <summary>
    /// Adds test authentication headers to simulate a grow tier admin
    /// </summary>
    public static HttpClient WithGrowTierAuth(this HttpClient client,
        int userId = 3,
        int clubId = 2)
    {
        return client.WithTestAuth(userId, clubId, isAdmin: true, role: "Admin", hasUnlimitedTier: false);
    }

    /// <summary>
    /// Removes all test authentication headers
    /// </summary>
    public static HttpClient WithoutAuth(this HttpClient client)
    {
        client.DefaultRequestHeaders.Remove("X-Test-UserId");
        client.DefaultRequestHeaders.Remove("X-Test-ClubId");
        client.DefaultRequestHeaders.Remove("X-Test-IsAdmin");
        client.DefaultRequestHeaders.Remove("X-Test-Role");
        client.DefaultRequestHeaders.Remove("X-Test-UnlimitedTier");
        client.DefaultRequestHeaders.Authorization = null;
        return client;
    }
}