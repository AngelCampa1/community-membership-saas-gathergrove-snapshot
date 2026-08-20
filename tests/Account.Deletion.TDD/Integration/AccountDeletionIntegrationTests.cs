using Xunit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc.Testing;
using GatherGrove.API;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using System.Net.Http.Json;
using System.Text.Json;
using System.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Tests.Account.Deletion.TDD.Integration;

/// <summary>
/// TDD Integration Tests for Account Deletion API Endpoints
/// Tests full HTTP request/response cycle with database interactions
/// </summary>
public class AccountDeletionIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly IServiceScope _scope;
    private readonly GatherGroveDbContext _dbContext;

    public AccountDeletionIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((context, config) =>
            {
                config.AddInMemoryCollection(new[]
                {
                    new KeyValuePair<string, string>("ConnectionStrings:DefaultConnection", 
                        "Data Source=:memory:"),
                    new KeyValuePair<string, string>("Testing:Environment", "Integration")
                });
            });

            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext registration
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<GatherGroveDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                // Add in-memory database for testing
                services.AddDbContext<GatherGroveDbContext>(options =>
                {
                    options.UseInMemoryDatabase($"IntegrationTest_{Guid.NewGuid()}");
                });

                // Register account deletion service
                services.AddScoped<IUserAccountDeletionService, UserAccountDeletionService>();
            });
        });

        _client = _factory.CreateClient();
        _scope = _factory.Services.CreateScope();
        _dbContext = _scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
    }

    #region RED Phase Integration Tests

    [Fact]
    public async Task POST_UsersMe_Delete_WithValidAuth_ShouldDeleteAccountSuccessfully()
    {
        // Arrange
        var testUser = await CreateAndSeedTestUserAsync();
        var authToken = await GetAuthTokenAsync(testUser.Email, "TestPassword123!");
        
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var response = await _client.PostAsync("/api/v1/users/me/delete", null);

        // Assert - Test should fail initially (RED phase)
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<AccountDeletionResult>(responseContent, 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        result.Success.Should().BeTrue();
        result.Message.Should().Contain("successfully deleted");

        // Verify user is actually deleted from database
        var deletedUser = await _dbContext.Users.FindAsync(testUser.Id);
        deletedUser.Should().BeNull();
    }

    [Fact]
    public async Task POST_UsersMe_Delete_WithoutAuth_ShouldReturnUnauthorized()
    {
        // Arrange
        // No authentication header

        // Act
        var response = await _client.PostAsync("/api/v1/users/me/delete", null);

        // Assert - Test should fail initially (RED phase)
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GET_UsersMe_DeletionValidation_ShouldReturnValidationResult()
    {
        // Arrange
        var testUser = await CreateAndSeedTestUserAsync();
        var club = await CreateTestClubWithActiveSubscriptionAsync(testUser.Id);
        var authToken = await GetAuthTokenAsync(testUser.Email, "TestPassword123!");
        
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var response = await _client.GetAsync("/api/v1/users/me/deletion-validation");

        // Assert - Test should fail initially (RED phase)
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        var validation = JsonSerializer.Deserialize<AccountDeletionValidation>(responseContent,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        validation.CanDelete.Should().BeFalse();
        validation.BlockingReasons.Should().Contain(r => r.Contains("subscription"));
    }

    [Fact]
    public async Task GET_UsersMe_DeletionImpact_ShouldReturnImpactAnalysis()
    {
        // Arrange
        var testUser = await CreateAndSeedTestUserAsync();
        var club = await CreateTestClubAsync(testUser.Id);
        var members = await CreateTestMembersAsync(club.Id, 5);
        var events = await CreateTestEventsAsync(club.Id, 3);
        
        var authToken = await GetAuthTokenAsync(testUser.Email, "TestPassword123!");
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var response = await _client.GetAsync("/api/v1/users/me/deletion-impact");

        // Assert - Test should fail initially (RED phase)
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        var impact = JsonSerializer.Deserialize<AccountDeletionImpact>(responseContent,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        impact.AffectedClubs.Should().Be(1);
        impact.AffectedMembers.Should().Be(5);
        impact.AffectedEvents.Should().Be(3);
    }

    [Fact]
    public async Task POST_UsersMe_Delete_WithActiveSubscription_ShouldReturnBadRequest()
    {
        // Arrange
        var testUser = await CreateAndSeedTestUserAsync();
        var club = await CreateTestClubWithActiveSubscriptionAsync(testUser.Id);
        
        var authToken = await GetAuthTokenAsync(testUser.Email, "TestPassword123!");
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var response = await _client.PostAsync("/api/v1/users/me/delete", null);

        // Assert - Test should fail initially (RED phase)
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("active subscription");

        // Verify user is NOT deleted
        var stillExistingUser = await _dbContext.Users.FindAsync(testUser.Id);
        stillExistingUser.Should().NotBeNull();
    }

    #endregion

    #region Data Cascade Integration Tests

    [Fact]
    public async Task DELETE_Account_ShouldCascadeDeleteAllRelatedEntities()
    {
        // Arrange
        var testUser = await CreateAndSeedTestUserAsync();
        var club = await CreateTestClubAsync(testUser.Id);
        var members = await CreateTestMembersAsync(club.Id, 3);
        var events = await CreateTestEventsAsync(club.Id, 2);
        var payments = await CreateTestPaymentsAsync(members.First().Id, club.Id, 2);
        var deviceTokens = await CreateTestDeviceTokensAsync(testUser.Id, 2);
        var resetTokens = await CreateTestPasswordResetTokensAsync(testUser.Id, 1);

        var authToken = await GetAuthTokenAsync(testUser.Email, "TestPassword123!");
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var response = await _client.PostAsync("/api/v1/users/me/delete", null);

        // Assert - Test should fail initially (RED phase)
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify cascade deletions
        var remainingClubAdmins = await _dbContext.ClubAdmins
            .Where(ca => ca.UserId == testUser.Id)
            .CountAsync();
        remainingClubAdmins.Should().Be(0);

        var remainingDeviceTokens = await _dbContext.UserDeviceTokens
            .Where(dt => dt.UserId == testUser.Id)
            .CountAsync();
        remainingDeviceTokens.Should().Be(0);

        var remainingResetTokens = await _dbContext.PasswordResetTokens
            .Where(prt => prt.UserId == testUser.Id)
            .CountAsync();
        remainingResetTokens.Should().Be(0);

        // Verify club ownership transfer or deletion
        var updatedClub = await _dbContext.Clubs.FindAsync(club.Id);
        if (updatedClub != null)
        {
            updatedClub.CreatedByUserId.Should().NotBe(testUser.Id);
        }
    }

    [Fact]
    public async Task DELETE_Account_WithClubTransfer_ShouldTransferOwnershipCorrectly()
    {
        // Arrange
        var originalOwner = await CreateAndSeedTestUserAsync();
        var newOwner = await CreateAndSeedTestUserAsync("newowner@test.com", "New Owner");
        var club = await CreateTestClubAsync(originalOwner.Id);
        
        // Make new owner a club admin
        await AddClubAdminAsync(newOwner.Id, club.Id);

        var authToken = await GetAuthTokenAsync(originalOwner.Email, "TestPassword123!");
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);

        var deleteOptions = new AccountDeletionOptions
        {
            TransferClubOwnership = true,
            NewOwnerId = newOwner.Id
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/users/me/delete", deleteOptions);

        // Assert - Test should fail initially (RED phase)
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedClub = await _dbContext.Clubs.FindAsync(club.Id);
        updatedClub.Should().NotBeNull();
        updatedClub.CreatedByUserId.Should().Be(newOwner.Id);

        // Original owner should be deleted
        var deletedOwner = await _dbContext.Users.FindAsync(originalOwner.Id);
        deletedOwner.Should().BeNull();
    }

    #endregion

    #region Performance Integration Tests

    [Fact]
    public async Task DELETE_Account_WithLargeDataset_ShouldCompleteWithinReasonableTime()
    {
        // Arrange
        var testUser = await CreateAndSeedTestUserAsync();
        var club = await CreateTestClubAsync(testUser.Id);
        var members = await CreateTestMembersAsync(club.Id, 100);
        var events = await CreateTestEventsAsync(club.Id, 50);

        var authToken = await GetAuthTokenAsync(testUser.Email, "TestPassword123!");
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var response = await _client.PostAsync("/api/v1/users/me/delete", null);
        stopwatch.Stop();

        // Assert - Test should fail initially (RED phase)
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(10000); // 10 second timeout for integration test
    }

    [Fact]
    public async Task DELETE_Account_ConcurrentRequests_ShouldHandleGracefully()
    {
        // Arrange
        var testUser = await CreateAndSeedTestUserAsync();
        var authToken = await GetAuthTokenAsync(testUser.Email, "TestPassword123!");

        var client1 = _factory.CreateClient();
        var client2 = _factory.CreateClient();

        client1.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);
        client2.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var task1 = client1.PostAsync("/api/v1/users/me/delete", null);
        var task2 = client2.PostAsync("/api/v1/users/me/delete", null);

        var responses = await Task.WhenAll(task1, task2);

        // Assert - Test should fail initially (RED phase)
        var successfulResponses = responses.Count(r => r.StatusCode == HttpStatusCode.OK);
        var errorResponses = responses.Count(r => r.StatusCode >= HttpStatusCode.BadRequest);

        successfulResponses.Should().Be(1);
        errorResponses.Should().Be(1);
    }

    #endregion

    #region Security Integration Tests

    [Fact]
    public async Task DELETE_Account_ShouldNotAllowCrossUserDeletion()
    {
        // Arrange
        var user1 = await CreateAndSeedTestUserAsync("user1@test.com", "User 1");
        var user2 = await CreateAndSeedTestUserAsync("user2@test.com", "User 2");

        var user1Token = await GetAuthTokenAsync(user1.Email, "TestPassword123!");
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", user1Token);

        // Act - Try to delete user2's account using user1's token
        var maliciousRequest = new { UserId = user2.Id };
        var response = await _client.PostAsJsonAsync("/api/v1/users/me/delete", maliciousRequest);

        // Assert - Should only delete the authenticated user's account
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var deletedUser1 = await _dbContext.Users.FindAsync(user1.Id);
        var stillExistingUser2 = await _dbContext.Users.FindAsync(user2.Id);

        deletedUser1.Should().BeNull(); // User1 deleted (own account)
        stillExistingUser2.Should().NotBeNull(); // User2 still exists (security protection)
    }

    [Fact]
    public async Task DELETE_Account_WithInvalidToken_ShouldReturnUnauthorized()
    {
        // Arrange
        var testUser = await CreateAndSeedTestUserAsync();
        var invalidToken = "invalid.jwt.token";

        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", invalidToken);

        // Act
        var response = await _client.PostAsync("/api/v1/users/me/delete", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // User should still exist
        var stillExistingUser = await _dbContext.Users.FindAsync(testUser.Id);
        stillExistingUser.Should().NotBeNull();
    }

    [Fact]
    public async Task DELETE_Account_ShouldLogDeletionActivity()
    {
        // Arrange
        var testUser = await CreateAndSeedTestUserAsync();
        var authToken = await GetAuthTokenAsync(testUser.Email, "TestPassword123!");

        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var response = await _client.PostAsync("/api/v1/users/me/delete", null);

        // Assert - Test should fail initially (RED phase)
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify audit log creation (would need access to audit logs in real implementation)
        // For now, we verify the response indicates proper logging
        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<AccountDeletionResult>(responseContent,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        result.Metadata.Should().ContainKey("AuditLogId");
        result.Metadata["AuditLogId"].Should().NotBeNull();
    }

    #endregion

    #region Test Data Helper Methods

    private async Task<User> CreateAndSeedTestUserAsync(string email = "test@example.com", string fullName = "Test User")
    {
        var user = new User
        {
            Email = email,
            FullName = fullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("TestPassword123!"),
            IsActive = true,
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();
        return user;
    }

    private async Task<Club> CreateTestClubAsync(int createdByUserId)
    {
        var club = new Club
        {
            Name = "Test Club",
            CreatedByUserId = createdByUserId,
            Tier = "Grow",
            SubscriptionStatus = "inactive",
            CreatedAt = DateTime.UtcNow.AddDays(-25),
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Clubs.Add(club);

        // Add club admin relationship
        var clubAdmin = new ClubAdmin
        {
            UserId = createdByUserId,
            ClubId = club.Id,
            CreatedAt = DateTime.UtcNow.AddDays(-25)
        };
        
        _dbContext.ClubAdmins.Add(clubAdmin);
        await _dbContext.SaveChangesAsync();
        
        return club;
    }

    private async Task<Club> CreateTestClubWithActiveSubscriptionAsync(int createdByUserId)
    {
        var club = await CreateTestClubAsync(createdByUserId);
        club.SubscriptionStatus = "active";
        club.StripeCustomerId = "cus_test123";
        club.StripeSubscriptionId = "sub_test123";
        
        await _dbContext.SaveChangesAsync();
        return club;
    }

    private async Task<List<Member>> CreateTestMembersAsync(int clubId, int count)
    {
        var members = new List<Member>();
        for (int i = 1; i <= count; i++)
        {
            var member = new Member
            {
                ClubId = clubId,
                MembershipTypeId = 1,
                FullName = $"Test Member {i}",
                Email = $"member{i}@test.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddDays(-20),
                CreatedAt = DateTime.UtcNow.AddDays(-20),
                UpdatedAt = DateTime.UtcNow
            };
            members.Add(member);
        }

        _dbContext.Members.AddRange(members);
        await _dbContext.SaveChangesAsync();
        return members;
    }

    private async Task<List<Event>> CreateTestEventsAsync(int clubId, int count)
    {
        var events = new List<Event>();
        for (int i = 1; i <= count; i++)
        {
            var testEvent = new Event
            {
                ClubId = clubId,
                Name = $"Test Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(i),
                Location = "Test Location",
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                UpdatedAt = DateTime.UtcNow
            };
            events.Add(testEvent);
        }

        _dbContext.Events.AddRange(events);
        await _dbContext.SaveChangesAsync();
        return events;
    }

    private async Task<List<Payment>> CreateTestPaymentsAsync(int memberId, int clubId, int count)
    {
        var payments = new List<Payment>();
        for (int i = 1; i <= count; i++)
        {
            var payment = new Payment
            {
                MemberId = memberId,
                ClubId = clubId,
                Amount = 50.00m * i,
                PaymentDate = DateTime.UtcNow.AddDays(-i),
                PaymentMethod = "Stripe",
                CreatedAt = DateTime.UtcNow.AddDays(-i)
            };
            payments.Add(payment);
        }

        _dbContext.Payments.AddRange(payments);
        await _dbContext.SaveChangesAsync();
        return payments;
    }

    private async Task<List<UserDeviceToken>> CreateTestDeviceTokensAsync(int userId, int count)
    {
        var tokens = new List<UserDeviceToken>();
        for (int i = 1; i <= count; i++)
        {
            var token = new UserDeviceToken
            {
                UserId = userId,
                DeviceToken = $"device_token_{i}",
                DeviceType = i % 2 == 0 ? "iOS" : "Android",
                LastLogin = DateTime.UtcNow.AddHours(-i),
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                UpdatedAt = DateTime.UtcNow
            };
            tokens.Add(token);
        }

        _dbContext.UserDeviceTokens.AddRange(tokens);
        await _dbContext.SaveChangesAsync();
        return tokens;
    }

    private async Task<List<PasswordResetToken>> CreateTestPasswordResetTokensAsync(int userId, int count)
    {
        var tokens = new List<PasswordResetToken>();
        for (int i = 1; i <= count; i++)
        {
            var token = new PasswordResetToken
            {
                UserId = userId,
                TokenHash = BCrypt.Net.BCrypt.HashPassword($"reset_token_{i}"),
                ExpiresAt = DateTime.UtcNow.AddHours(i),
                IsUsed = false,
                CreatedAt = DateTime.UtcNow.AddHours(-i)
            };
            tokens.Add(token);
        }

        _dbContext.PasswordResetTokens.AddRange(tokens);
        await _dbContext.SaveChangesAsync();
        return tokens;
    }

    private async Task AddClubAdminAsync(int userId, int clubId)
    {
        var clubAdmin = new ClubAdmin
        {
            UserId = userId,
            ClubId = clubId,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ClubAdmins.Add(clubAdmin);
        await _dbContext.SaveChangesAsync();
    }

    private async Task<string> GetAuthTokenAsync(string email, string password)
    {
        // Mock JWT token generation for testing
        // In real implementation, this would call the actual auth endpoint
        var loginRequest = new { Email = email, Password = password };
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        
        if (loginResponse.IsSuccessStatusCode)
        {
            var loginResult = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
            return loginResult.Token;
        }

        // For tests, return a mock token that would be validated by test auth middleware
        return GenerateTestJwtToken(email);
    }

    private string GenerateTestJwtToken(string email)
    {
        // Mock JWT token for testing - in real implementation this would be properly signed
        return $"test.jwt.token.for.{email.Replace("@", ".").Replace(".", "_")}";
    }

    public void Dispose()
    {
        _scope?.Dispose();
        _client?.Dispose();
    }
}

/// <summary>
/// Login response DTO for integration tests
/// </summary>
public class LoginResponse
{
    public string Token { get; set; }
    public string RefreshToken { get; set; }
    public DateTime ExpiresAt { get; set; }
}