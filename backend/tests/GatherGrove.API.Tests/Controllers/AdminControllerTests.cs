using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using System.Net.Http.Json;
using System.Net;
using GatherGrove.Application.DTOs;
using Newtonsoft.Json;
using FluentAssertions;
using NUnit.Framework;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.API.Tests.Shared;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class AdminControllerTests
{
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;
    private string _databaseName = null!;
    private Mock<IAdminService> _mockAdminService = null!;
    private readonly string _testClassName = nameof(AdminControllerTests);

    [SetUp]
    public void SetUp()
    {
        _databaseName = Guid.NewGuid().ToString();
        _mockAdminService = new Mock<IAdminService>();

        _factory = new TestWebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Replace the database context with one that uses a unique database name
                    var dbContextDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<GatherGroveDbContext>));
                    if (dbContextDescriptor != null)
                        services.Remove(dbContextDescriptor);

                    var dbContextServiceDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(GatherGroveDbContext));
                    if (dbContextServiceDescriptor != null)
                        services.Remove(dbContextServiceDescriptor);

                    // Add DbContext with unique database name for this test class
                    services.AddDbContext<GatherGroveDbContext>(options =>
                        options.UseInMemoryDatabase($"AdminControllerTests_{_databaseName}"));

                    // Replace the admin service with our mock
                    var adminDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(IAdminService));
                    if (adminDescriptor != null)
                        services.Remove(adminDescriptor);

                    services.AddScoped(_ => _mockAdminService.Object);
                });
            });

        _client = _factory.CreateClient();
    }

    [TearDown]
    public void TearDown()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }

    private async Task<(User user, Club club)> CreateTestUserAndClub()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        var user = new User
        {
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = "password",
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var clubAdmin = new ClubAdmin
        {
            User = user,
            Club = club,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        context.Clubs.Add(club);
        context.ClubAdmins.Add(clubAdmin);
        await context.SaveChangesAsync();

        return (user, club);
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync(User user)
    {
        // Get the club ID for this user from the same context
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        var clubAdmin = await context.ClubAdmins
            .Include(ca => ca.Club)
            .FirstOrDefaultAsync(ca => ca.UserId == user.Id);

        if (clubAdmin == null)
        {
            throw new InvalidOperationException($"No ClubAdmin found for user ID {user.Id}");
        }

        var clubId = clubAdmin.ClubId;

        // Use test authentication headers instead of JWT tokens
        var client = _factory.CreateClient();
        client.WithTestAuth(
            userId: user.Id,
            clubId: clubId,
            isAdmin: true,
            role: "Admin",
            hasUnlimitedTier: true
        );

        return client;
    }

    #region GET /api/v1/clubs/{clubId}/admins

    [Test]
    public async Task GetClubAdmins_Should_Return_All_Admins_For_Club()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var expectedAdmins = new List<ClubAdminResponse>
        {
            new() { UserId = 1, FullName = "Primary Admin", Email = "primary@test.com", Role = "Primary", IsCurrentUser = true, CreatedAt = DateTime.UtcNow },
            new() { UserId = 2, FullName = "Regular Admin", Email = "admin@test.com", Role = "Admin", IsCurrentUser = false, CreatedAt = DateTime.UtcNow }
        };

        _mockAdminService
            .Setup(x => x.GetClubAdminsAsync(club.Id, user.Id))
            .ReturnsAsync(expectedAdmins);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.GetAsync($"/api/v1/clubs/{club.Id}/admins");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var admins = JsonConvert.DeserializeObject<List<ClubAdminResponse>>(content);

        admins.Should().HaveCount(2);
        admins.Should().Contain(a => a.FullName == "Primary Admin" && a.Role == "Primary");
        admins.Should().Contain(a => a.FullName == "Regular Admin" && a.Role == "Admin");

        _mockAdminService.Verify(x => x.GetClubAdminsAsync(club.Id, user.Id), Times.Once);
    }

    [Test]
    public async Task GetClubAdmins_Should_Return_Empty_List_For_NonExistent_Club()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockAdminService
            .Setup(x => x.GetClubAdminsAsync(999, user.Id))
            .ReturnsAsync(new List<ClubAdminResponse>());

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.GetAsync("/api/v1/clubs/999/admins");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var admins = JsonConvert.DeserializeObject<List<ClubAdminResponse>>(content);

        admins.Should().BeEmpty();

        _mockAdminService.Verify(x => x.GetClubAdminsAsync(999, user.Id), Times.Once);
    }

    #endregion

    #region POST /api/v1/clubs/{clubId}/admins/invite

    [Test]
    public async Task CreateAdminInvite_Should_Create_Invite_For_Valid_Request()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new CreateAdminInviteRequest { Email = "newadmin@test.com" };
        var expectedInvite = new AdminInviteResponse
        {
            InviteId = 1,
            Email = "newadmin@test.com",
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddHours(72),
            CreatedAt = DateTime.UtcNow,
            InvitedByName = "Test User"
        };

        _mockAdminService
            .Setup(x => x.CreateAdminInviteAsync(club.Id, user.Id, It.IsAny<CreateAdminInviteRequest>()))
            .ReturnsAsync(expectedInvite);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/admins/invites", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var content = await response.Content.ReadAsStringAsync();
        var invite = JsonConvert.DeserializeObject<AdminInviteResponse>(content);

        invite.Should().NotBeNull();
        invite!.Email.Should().Be("newadmin@test.com");
        invite.Status.Should().Be("Pending");
        invite.InvitedByName.Should().Be("Test User");

        _mockAdminService.Verify(x => x.CreateAdminInviteAsync(club.Id, user.Id, It.Is<CreateAdminInviteRequest>(r => r.Email == "newadmin@test.com")), Times.Once);
    }

    [Test]
    public async Task CreateAdminInvite_Should_Return_BadRequest_For_Sprout_Tier()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new CreateAdminInviteRequest { Email = "newadmin@test.com" };

        _mockAdminService
            .Setup(x => x.CreateAdminInviteAsync(club.Id, user.Id, It.IsAny<CreateAdminInviteRequest>()))
            .ThrowsAsync(new InvalidOperationException("Admin invitations are only available for clubs on the Grow tier"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/admins/invites", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Admin invitations are only available for clubs on the Grow tier");
    }

    [Test]
    public async Task CreateAdminInvite_Should_Return_BadRequest_For_Invalid_Email()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new CreateAdminInviteRequest { Email = "invalid-email" };
        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/admins/invites", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task CreateAdminInvite_Should_Return_BadRequest_When_At_Admin_Limit()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new CreateAdminInviteRequest { Email = "newadmin@test.com" };

        _mockAdminService
            .Setup(x => x.CreateAdminInviteAsync(club.Id, user.Id, It.IsAny<CreateAdminInviteRequest>()))
            .ThrowsAsync(new InvalidOperationException("Club has reached the maximum number of administrators (3)"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/admins/invites", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Club has reached the maximum number of administrators");
    }

    #endregion

    #region GET /api/v1/clubs/{clubId}/admins/invites

    [Test]
    public async Task GetPendingInvites_Should_Return_Only_Pending_Invites()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var expectedInvites = new List<AdminInviteResponse>
        {
            new() { InviteId = 1, Email = "pending@test.com", Status = "Pending", ExpiresAt = DateTime.UtcNow.AddHours(24), CreatedAt = DateTime.UtcNow, InvitedByName = "Test User" }
        };

        _mockAdminService
            .Setup(x => x.GetPendingInvitesAsync(club.Id))
            .ReturnsAsync(expectedInvites);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.GetAsync($"/api/v1/clubs/{club.Id}/admins/invites");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var invites = JsonConvert.DeserializeObject<List<AdminInviteResponse>>(content);

        invites.Should().HaveCount(1);
        invites!.First().Email.Should().Be("pending@test.com");
        invites.First().Status.Should().Be("Pending");

        _mockAdminService.Verify(x => x.GetPendingInvitesAsync(club.Id), Times.Once);
    }

    #endregion

    #region PUT /api/v1/clubs/{clubId}/admins/invites/{inviteId}/cancel

    [Test]
    public async Task CancelInvite_Should_Cancel_Pending_Invite()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockAdminService
            .Setup(x => x.CancelInviteAsync(club.Id, 1, user.Id))
            .ReturnsAsync(true);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.DeleteAsync($"/api/v1/clubs/{club.Id}/admins/invites/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        _mockAdminService.Verify(x => x.CancelInviteAsync(club.Id, 1, user.Id), Times.Once);
    }

    [Test]
    public async Task CancelInvite_Should_Return_NotFound_For_NonExistent_Invite()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockAdminService
            .Setup(x => x.CancelInviteAsync(club.Id, 999, user.Id))
            .ReturnsAsync(false);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.DeleteAsync($"/api/v1/clubs/{club.Id}/admins/invites/999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        _mockAdminService.Verify(x => x.CancelInviteAsync(club.Id, 999, user.Id), Times.Once);
    }

    #endregion

    #region DELETE /api/v1/clubs/{clubId}/admins/{userId}

    [Test]
    public async Task RemoveAdmin_Should_Remove_Regular_Admin()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockAdminService
            .Setup(x => x.RemoveAdminAsync(club.Id, 2, user.Id))
            .ReturnsAsync(true);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.DeleteAsync($"/api/v1/clubs/{club.Id}/admins/2");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        _mockAdminService.Verify(x => x.RemoveAdminAsync(club.Id, 2, user.Id), Times.Once);
    }

    [Test]
    public async Task RemoveAdmin_Should_Return_BadRequest_For_Primary_Admin()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockAdminService
            .Setup(x => x.RemoveAdminAsync(club.Id, user.Id, user.Id))
            .ThrowsAsync(new InvalidOperationException("The primary administrator cannot be removed"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.DeleteAsync($"/api/v1/clubs/{club.Id}/admins/{user.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("The primary administrator cannot be removed");
    }

    [Test]
    public async Task RemoveAdmin_Should_Return_NotFound_For_NonExistent_Admin()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockAdminService
            .Setup(x => x.RemoveAdminAsync(club.Id, 999, user.Id))
            .ReturnsAsync(false);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.DeleteAsync($"/api/v1/clubs/{club.Id}/admins/999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        _mockAdminService.Verify(x => x.RemoveAdminAsync(club.Id, 999, user.Id), Times.Once);
    }

    [Test]
    public async Task GetClubAdmins_Should_Return_InternalServerError_On_Exception()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockAdminService
            .Setup(x => x.GetClubAdminsAsync(club.Id, user.Id))
            .ThrowsAsync(new Exception("Database connection failed"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.GetAsync($"/api/v1/clubs/{club.Id}/admins");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);

        _mockAdminService.Verify(x => x.GetClubAdminsAsync(club.Id, user.Id), Times.Once);
    }

    #endregion

    #region POST /api/v1/clubs/{clubId}/admins/invites - Additional Tests

    [Test]
    public async Task CreateAdminInvite_Should_Return_InternalServerError_On_Exception()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var request = new CreateAdminInviteRequest
        {
            Email = "newadmin@example.com"
        };

        _mockAdminService
            .Setup(x => x.CreateAdminInviteAsync(club.Id, user.Id, It.IsAny<CreateAdminInviteRequest>()))
            .ThrowsAsync(new Exception("Email service unavailable"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/admins/invites", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);

        _mockAdminService.Verify(
            x => x.CreateAdminInviteAsync(club.Id, user.Id, It.IsAny<CreateAdminInviteRequest>()),
            Times.Once);
    }

    #endregion

    #region GET /api/v1/clubs/{clubId}/admins/invites - Additional Tests

    [Test]
    public async Task GetPendingInvites_Should_Return_InternalServerError_On_Exception()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockAdminService
            .Setup(x => x.GetPendingInvitesAsync(club.Id))
            .ThrowsAsync(new Exception("Database error"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.GetAsync($"/api/v1/clubs/{club.Id}/admins/invites");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);

        _mockAdminService.Verify(x => x.GetPendingInvitesAsync(club.Id), Times.Once);
    }

    #endregion

    #region DELETE /api/v1/clubs/{clubId}/admins/invites/{inviteId} - Additional Tests

    [Test]
    public async Task CancelInvite_Should_Return_BadRequest_On_InvalidOperation()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var inviteId = 1;

        _mockAdminService
            .Setup(x => x.CancelInviteAsync(club.Id, inviteId, user.Id))
            .ThrowsAsync(new InvalidOperationException("Invitation has already been accepted"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.DeleteAsync($"/api/v1/clubs/{club.Id}/admins/invites/{inviteId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        _mockAdminService.Verify(x => x.CancelInviteAsync(club.Id, inviteId, user.Id), Times.Once);
    }

    [Test]
    public async Task CancelInvite_Should_Return_InternalServerError_On_Exception()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var inviteId = 1;

        _mockAdminService
            .Setup(x => x.CancelInviteAsync(club.Id, inviteId, user.Id))
            .ThrowsAsync(new Exception("Database connection failed"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.DeleteAsync($"/api/v1/clubs/{club.Id}/admins/invites/{inviteId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);

        _mockAdminService.Verify(x => x.CancelInviteAsync(club.Id, inviteId, user.Id), Times.Once);
    }

    #endregion

    #region DELETE /api/v1/clubs/{clubId}/admins/{userIdToRemove} - Additional Tests

    [Test]
    public async Task RemoveAdmin_Should_Return_BadRequest_On_InvalidOperation()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var userIdToRemove = 2;

        _mockAdminService
            .Setup(x => x.RemoveAdminAsync(club.Id, userIdToRemove, user.Id))
            .ThrowsAsync(new InvalidOperationException("Cannot remove yourself as admin"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.DeleteAsync($"/api/v1/clubs/{club.Id}/admins/{userIdToRemove}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        _mockAdminService.Verify(x => x.RemoveAdminAsync(club.Id, userIdToRemove, user.Id), Times.Once);
    }

    [Test]
    public async Task RemoveAdmin_Should_Return_InternalServerError_On_Exception()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var userIdToRemove = 2;

        _mockAdminService
            .Setup(x => x.RemoveAdminAsync(club.Id, userIdToRemove, user.Id))
            .ThrowsAsync(new Exception("Database error"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.DeleteAsync($"/api/v1/clubs/{club.Id}/admins/{userIdToRemove}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);

        _mockAdminService.Verify(x => x.RemoveAdminAsync(club.Id, userIdToRemove, user.Id), Times.Once);
    }

    #endregion
}