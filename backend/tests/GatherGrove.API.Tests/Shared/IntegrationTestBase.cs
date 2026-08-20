using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Headers;
using System.Text;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Base class for integration tests that provides JWT authentication and database setup
/// </summary>
public abstract class IntegrationTestBase
{
    protected TestWebApplicationFactory<Program> _factory = null!;
    protected HttpClient _client = null!;
    protected GatherGroveDbContext _dbContext = null!;

    [SetUp]
    public virtual void SetUp()
    {
        _factory = new TestWebApplicationFactory<Program>();
        _client = _factory.CreateClient();

        // Get the database context for test data setup
        var scope = _factory.Services.CreateScope();
        _dbContext = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        // Ensure database is created for each test
        _dbContext.Database.EnsureCreated();
    }

    [TearDown]
    public virtual void TearDown()
    {
        _client?.Dispose();
        _factory?.Dispose();
        _dbContext?.Dispose();
    }

    /// <summary>
    /// Creates an HttpClient with test authentication headers
    /// </summary>
    /// <param name="userId">The user ID for the token</param>
    /// <param name="clubId">The club ID for the token</param>
    /// <param name="roles">The roles to include in the token</param>
    /// <returns>Authenticated HttpClient</returns>
    protected HttpClient CreateAuthenticatedClient(string userId = "1", string clubId = "1", params string[] roles)
    {
        var client = _factory.CreateClient();

        // Use test authentication instead of JWT
        var role = roles.Length > 0 ? roles[0] : "User";
        var isAdmin = role.Equals("Admin", StringComparison.OrdinalIgnoreCase);

        client.WithTestAuth(
            userId: int.Parse(userId),
            clubId: int.Parse(clubId),
            isAdmin: isAdmin,
            role: role,
            hasUnlimitedTier: false
        );

        return client;
    }

    /// <summary>
    /// Creates an HttpClient with admin authentication
    /// </summary>
    /// <param name="userId">The admin user ID</param>
    /// <param name="clubId">The club ID</param>
    /// <returns>Authenticated HttpClient with admin role</returns>
    protected HttpClient CreateAdminClient(string userId = "1", string clubId = "1")
    {
        return CreateAuthenticatedClient(userId, clubId, "Admin");
    }

    /// <summary>
    /// Creates an HttpClient with user authentication
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="clubId">The club ID</param>
    /// <returns>Authenticated HttpClient with user role</returns>
    protected HttpClient CreateUserClient(string userId = "1", string clubId = "1")
    {
        return CreateAuthenticatedClient(userId, clubId, "User");
    }

    /// <summary>
    /// Sets up test data in the in-memory database
    /// </summary>
    protected virtual async Task SetupTestDataAsync()
    {
        // Override in derived classes to set up specific test data
        await Task.CompletedTask;
    }

    /// <summary>
    /// Cleans up test data from the in-memory database
    /// </summary>
    protected virtual async Task CleanupTestDataAsync()
    {
        // Clear all tables to ensure clean state for each test
        // Whitelist of valid table names to prevent SQL injection
        // SECURITY FIX: Added explicit validation that table name is in whitelist
        // Note: ExecuteSql does NOT parameterize table/column identifiers, only values
        var allowedTables = new[]
        {
            "EventPayments", "EventRsvps", "Events", "Members", "Clubs", "Users"
        };

        foreach (var table in allowedTables)
        {
            // Double-check table is in whitelist (defense in depth)
            if (!allowedTables.Contains(table))
            {
                throw new InvalidOperationException(
                    $"SECURITY: Attempted to delete from table '{table}' which is not in the allowed whitelist");
            }

            try
            {
                // Use ExecuteSql with bracketed identifier for safe table name usage
                // Brackets [] escape the identifier to prevent SQL injection
                _dbContext.Database.ExecuteSql($"DELETE FROM [{table}]");
            }
            catch
            {
                // Table might not exist or be empty, which is fine for cleanup
            }
        }

        await _dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// Creates a JSON string content for HTTP requests
    /// </summary>
    /// <param name="obj">The object to serialize</param>
    /// <returns>StringContent with JSON media type</returns>
    protected StringContent CreateJsonContent(object obj)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(obj);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }
}
