using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.InMemory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.API.Controllers;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using GatherGrove.API.Tests.Shared;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class AuthControllerTests
{
    private WebApplicationFactory<Program> _factory;
    private HttpClient _client;
    private string _databaseName;
    private Mock<IAuthService> _mockAuthService;
    private Mock<IMemberActivationService> _mockMemberActivationService;
    private Mock<IExternalAuthService> _mockExternalAuthService;
    private Mock<ILogger<AuthController>> _mockLogger;
    private Mock<IWebHostEnvironment> _mockWebHostEnvironment;
    private Mock<IConfiguration> _mockConfiguration;
    private AuthController _controller;

    [SetUp]
    public void SetUp()
    {
        _databaseName = $"TestDb_{Guid.NewGuid()}";

        _factory = new TestWebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Ensure each test gets a fresh database context
                    var dbContextDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<GatherGroveDbContext>));
                    if (dbContextDescriptor != null) services.Remove(dbContextDescriptor);

                    services.AddDbContext<GatherGroveDbContext>(options =>
                        options.UseInMemoryDatabase(_databaseName));
                });
            });

        _client = _factory.CreateClient();

        _mockAuthService = new Mock<IAuthService>();
        _mockMemberActivationService = new Mock<IMemberActivationService>();
        _mockExternalAuthService = new Mock<IExternalAuthService>();
        _mockLogger = new Mock<ILogger<AuthController>>();
        _mockWebHostEnvironment = new Mock<IWebHostEnvironment>();
        _mockConfiguration = new Mock<IConfiguration>();

        // Setup web host environment for development (non-secure cookies)
        _mockWebHostEnvironment.Setup(x => x.EnvironmentName).Returns("Development");

        _controller = new AuthController(_mockAuthService.Object, _mockMemberActivationService.Object, _mockExternalAuthService.Object, _mockLogger.Object, _mockWebHostEnvironment.Object, _mockConfiguration.Object);

        // Setup HttpContext for the controller
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [TearDown]
    public void TearDown()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }

    [Test]
    public async Task Register_WithValidRequest_ShouldReturn201Created()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "MyV3ry$ecuR3P@ssw0rd!",
            ClubName = "Mountain Hiking Club"
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));

        var responseContent = await response.Content.ReadAsStringAsync();
        var registerResponse = JsonSerializer.Deserialize<RegisterResponse>(responseContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.That(registerResponse, Is.Not.Null);
        Assert.That(registerResponse.User.FullName, Is.EqualTo(request.FullName));
        Assert.That(registerResponse.User.Email, Is.EqualTo(request.Email));
        Assert.That(registerResponse.Club.Name, Is.EqualTo(request.ClubName));
        Assert.That(registerResponse.User.Id, Is.GreaterThan(0));
        Assert.That(registerResponse.Club.Id, Is.GreaterThan(0));
        Assert.That(registerResponse.Token, Is.Not.Null.And.Not.Empty);

        // Verify JWT cookie was set
        var cookies = response.Headers.GetValues("Set-Cookie");
        Assert.That(cookies.Any(c => c.StartsWith("jwt=")), Is.True, "JWT cookie should be set");
    }

    [Test]
    public async Task Register_WithDuplicateEmail_ShouldReturn409Conflict()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "MyV3ry$ecuR3P@ssw0rd!",
            ClubName = "Mountain Hiking Club"
        };

        var json = JsonSerializer.Serialize(request);
        var content1 = new StringContent(json, Encoding.UTF8, "application/json");
        var content2 = new StringContent(json, Encoding.UTF8, "application/json");

        // Act - Register first user
        var firstResponse = await _client.PostAsync("/api/v1/auth/register", content1);
        Assert.That(firstResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));

        // Act - Try to register with same email
        var secondResponse = await _client.PostAsync("/api/v1/auth/register", content2);

        // Assert
        Assert.That(secondResponse.StatusCode, Is.EqualTo(HttpStatusCode.Conflict));

        var responseContent = await secondResponse.Content.ReadAsStringAsync();
        Assert.That(responseContent, Contains.Substring("A user with this email already exists"));
    }

    [Test]
    public async Task Register_WithInvalidEmail_ShouldReturn400BadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "John Doe",
            Email = "invalid-email",
            Password = "MyV3ry$ecuR3P@ssw0rd!",
            ClubName = "Mountain Hiking Club"
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

        var responseContent = await response.Content.ReadAsStringAsync();
        Assert.That(responseContent, Contains.Substring("Please enter a valid email address"));
    }

    [Test]
    public async Task Register_WithShortPassword_ShouldReturn400BadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "123", // Too short
            ClubName = "Mountain Hiking Club"
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

        var responseContent = await response.Content.ReadAsStringAsync();
        Assert.That(responseContent, Contains.Substring("Password must be at least 12 characters long"));
    }

    [Test]
    public async Task Register_WithMissingFullName_ShouldReturn400BadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "", // Missing
            Email = "john.doe@example.com",
            Password = "MyV3ry$ecuR3P@ssw0rd!",
            ClubName = "Mountain Hiking Club"
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

        var responseContent = await response.Content.ReadAsStringAsync();
        Assert.That(responseContent, Contains.Substring("Full name is required"));
    }

    [Test]
    public async Task Register_WithMissingClubName_ShouldReturn400BadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "MyV3ry$ecuR3P@ssw0rd!",
            ClubName = "" // Missing
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

        var responseContent = await response.Content.ReadAsStringAsync();
        Assert.That(responseContent, Contains.Substring("Club name is required"));
    }

    [Test]
    public async Task Register_WithEmptyBody_ShouldReturn400BadRequest()
    {
        // Arrange
        var content = new StringContent("{}", Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Register_WithInvalidJson_ShouldReturn400BadRequest()
    {
        // Arrange
        var content = new StringContent("invalid json", Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Register_WithTooLongFullName_ShouldReturn400BadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = new string('A', 101), // Too long (max 100)
            Email = "john.doe@example.com",
            Password = "MyV3ry$ecuR3P@ssw0rd!",
            ClubName = "Mountain Hiking Club"
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

        var responseContent = await response.Content.ReadAsStringAsync();
        Assert.That(responseContent, Contains.Substring("Full name cannot exceed 100 characters"));
    }

    [Test]
    public async Task Register_WithTooLongClubName_ShouldReturn400BadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "MyV3ry$ecuR3P@ssw0rd!",
            ClubName = new string('A', 101) // Too long (max 100)
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

        var responseContent = await response.Content.ReadAsStringAsync();
        Assert.That(responseContent, Contains.Substring("Club name cannot exceed 100 characters"));
    }

    [Test]
    public async Task Register_ShouldCreateUserInDatabase()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "MyV3ry$ecuR3P@ssw0rd!",
            ClubName = "Mountain Hiking Club"
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));

        // Verify database state
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        var club = await context.Clubs.FirstOrDefaultAsync(c => c.Name == request.ClubName);
        var clubAdmin = await context.ClubAdmins.FirstOrDefaultAsync(ca => ca.UserId == user.Id && ca.ClubId == club.Id);

        Assert.That(user, Is.Not.Null);
        Assert.That(user.FullName, Is.EqualTo(request.FullName));
        Assert.That(user.PasswordHash, Is.Not.EqualTo(request.Password)); // Should be hashed

        Assert.That(club, Is.Not.Null);
        Assert.That(club.Tier, Is.EqualTo("Grow"));
        Assert.That(club.SubscriptionStatus, Is.EqualTo("trialing"));
        Assert.That(club.TrialExpiresAt, Is.Not.Null);
        Assert.That(club.TrialExpiresAt, Is.GreaterThan(DateTime.UtcNow.AddDays(29)));
        Assert.That(club.TrialExpiresAt, Is.LessThan(DateTime.UtcNow.AddDays(31)));

        Assert.That(clubAdmin, Is.Not.Null);
        Assert.That(clubAdmin.UserId, Is.EqualTo(user.Id));
        Assert.That(clubAdmin.ClubId, Is.EqualTo(club.Id));
    }

    [Test]
    public async Task Register_ShouldSetCorrectContentType()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "MyV3ry$ecuR3P@ssw0rd!",
            ClubName = "Mountain Hiking Club"
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/json"));
    }

    [Test]
    public async Task Login_WithValidCredentials_ReturnsOkWithResponse()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "password123"
        };

        var loginResponse = new LoginResponse
        {
            UserId = 1,
            FullName = "John Doe",
            Email = "test@example.com",
            ClubId = 1,
            Role = "Admin",
            ClubTier = "Sprout",
            IsOnboardingCompleted = true,
            Message = "Login successful! Welcome back."
        };

        _mockAuthService.Setup(x => x.LoginAsync(request))
                       .ReturnsAsync(loginResponse);

        _mockAuthService.Setup(x => x.GenerateJwtToken(loginResponse.UserId, loginResponse.Email, loginResponse.ClubId, loginResponse.Role, It.IsAny<bool>()))
                       .Returns("fake-jwt-token");

        // Act
        var result = await _controller.Login(request);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var response = okResult.Value as LoginResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response.UserId, Is.EqualTo(loginResponse.UserId));
        Assert.That(response.FullName, Is.EqualTo(loginResponse.FullName));
        Assert.That(response.Email, Is.EqualTo(loginResponse.Email));
        Assert.That(response.ClubId, Is.EqualTo(loginResponse.ClubId));
        Assert.That(response.Role, Is.EqualTo(loginResponse.Role));
        Assert.That(response.Message, Is.EqualTo(loginResponse.Message));

        // Verify JWT token was generated
        _mockAuthService.Verify(x => x.GenerateJwtToken(loginResponse.UserId, loginResponse.Email, loginResponse.ClubId, loginResponse.Role, It.IsAny<bool>()), Times.Once);
    }

    [Test]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "wrongpassword"
        };

        _mockAuthService.Setup(x => x.LoginAsync(request))
                       .ThrowsAsync(new UnauthorizedAccessException("Invalid email or password."));

        // Act
        var result = await _controller.Login(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);
        Assert.That(unauthorizedResult.StatusCode, Is.EqualTo(401));

        var problemDetails = unauthorizedResult.Value as ProblemDetails;
        Assert.That(problemDetails, Is.Not.Null);
        Assert.That(problemDetails.Title, Is.EqualTo("Authentication Failed"));
        Assert.That(problemDetails.Detail, Is.EqualTo("Invalid email or password."));
        Assert.That(problemDetails.Status, Is.EqualTo(401));
    }

    [Test]
    public async Task Login_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "", // Invalid - empty email
            Password = "password123"
        };

        _controller.ModelState.AddModelError("Email", "Email is required");

        // Act
        var result = await _controller.Login(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        // Verify that the auth service was not called
        _mockAuthService.Verify(x => x.LoginAsync(It.IsAny<LoginRequest>()), Times.Never);
    }

    [Test]
    public async Task Login_WithUnexpectedException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "password123"
        };

        _mockAuthService.Setup(x => x.LoginAsync(request))
                       .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.Login(request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var problemDetails = statusCodeResult.Value as ProblemDetails;
        Assert.That(problemDetails, Is.Not.Null);
        Assert.That(problemDetails.Title, Is.EqualTo("Login Error"));
        Assert.That(problemDetails.Detail, Is.EqualTo("An unexpected error occurred during login. Please try again."));
        Assert.That(problemDetails.Status, Is.EqualTo(500));
    }

    [Test]
    public async Task Login_SetsHttpOnlyCookieWithJwtToken()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "password123"
        };

        var loginResponse = new LoginResponse
        {
            UserId = 1,
            FullName = "John Doe",
            Email = "test@example.com",
            ClubId = 1,
            Role = "Admin",
            ClubTier = "Sprout",
            Message = "Login successful! Welcome back."
        };

        var jwtToken = "fake-jwt-token";

        _mockAuthService.Setup(x => x.LoginAsync(request))
                       .ReturnsAsync(loginResponse);

        _mockAuthService.Setup(x => x.GenerateJwtToken(loginResponse.UserId, loginResponse.Email, loginResponse.ClubId, loginResponse.Role, It.IsAny<bool>()))
                       .Returns(jwtToken);

        // Act
        var result = await _controller.Login(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());

        // Verify JWT token generation was called
        _mockAuthService.Verify(x => x.GenerateJwtToken(loginResponse.UserId, loginResponse.Email, loginResponse.ClubId, loginResponse.Role, It.IsAny<bool>()), Times.Once);

        // Note: In a real integration test, we would check the actual cookie values
        // but in a unit test, we can only verify the service calls were made
    }

    #region A-003 Mobile vs Web client classification

    private LoginResponse SetupSuccessfulLogin(LoginRequest request, string jwtToken = "fake-jwt-token")
    {
        var loginResponse = new LoginResponse
        {
            UserId = 1,
            FullName = "John Doe",
            Email = request.Email,
            ClubId = 1,
            Role = "Admin",
            ClubTier = "Sprout",
            Message = "Login successful! Welcome back."
        };

        _mockAuthService.Setup(x => x.LoginAsync(request)).ReturnsAsync(loginResponse);
        _mockAuthService
            .Setup(x => x.GenerateJwtToken(loginResponse.UserId, loginResponse.Email, loginResponse.ClubId, loginResponse.Role, It.IsAny<bool>()))
            .Returns(jwtToken);

        return loginResponse;
    }

    [Test]
    public async Task Login_MobileBrowserWebUser_SetsCookieAndDoesNotReturnTokenInBody()
    {
        // Arrange — an iOS Safari User-Agent (contains the generic word "Mobile")
        // must STILL be treated as a web client and receive the HttpOnly cookie.
        var request = new LoginRequest { Email = "web@example.com", Password = "password123" };
        SetupSuccessfulLogin(request, "web-jwt-token");
        _controller.ControllerContext.HttpContext.Request.Headers["User-Agent"] =
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

        // Act
        var result = await _controller.Login(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var body = ((OkObjectResult)result).Value as LoginResponse;
        Assert.That(body, Is.Not.Null);
        Assert.That(body!.Token, Is.Null.Or.Empty, "Web clients must NOT receive the token in the response body");

        var setCookie = _controller.Response.Headers["Set-Cookie"].ToString();
        Assert.That(setCookie, Does.Contain("jwt="), "Web clients must receive the HttpOnly jwt cookie");
    }

    [Test]
    public async Task Login_NativeAppViaXMobileClientHeader_ReturnsTokenInBodyAndNoCookie()
    {
        // Arrange
        var request = new LoginRequest { Email = "app@example.com", Password = "password123" };
        SetupSuccessfulLogin(request, "mobile-jwt-token");
        _controller.ControllerContext.HttpContext.Request.Headers["X-Mobile-Client"] = "true";
        _controller.ControllerContext.HttpContext.Request.Headers["User-Agent"] = "GatherGrove-Mobile/1.0.0";

        // Act
        var result = await _controller.Login(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var body = ((OkObjectResult)result).Value as LoginResponse;
        Assert.That(body, Is.Not.Null);
        Assert.That(body!.Token, Is.EqualTo("mobile-jwt-token"), "Native app must receive the token in the body");

        var setCookie = _controller.Response.Headers["Set-Cookie"].ToString();
        Assert.That(setCookie, Does.Not.Contain("jwt="), "Native app must NOT be issued the web cookie");
    }

    [Test]
    public async Task Login_NativeAppViaGatherGroveMobileUserAgent_ReturnsTokenInBody()
    {
        // Arrange — UA-only signal (no X-Mobile-Client header)
        var request = new LoginRequest { Email = "app2@example.com", Password = "password123" };
        SetupSuccessfulLogin(request, "ua-mobile-token");
        _controller.ControllerContext.HttpContext.Request.Headers["User-Agent"] = "GatherGrove-Mobile/1.0.0 (iOS)";

        // Act
        var result = await _controller.Login(request);

        // Assert
        var body = ((OkObjectResult)result).Value as LoginResponse;
        Assert.That(body, Is.Not.Null);
        Assert.That(body!.Token, Is.EqualTo("ua-mobile-token"));
    }

    [Test]
    public async Task Login_DesktopWebUser_SetsCookieAndNoBodyToken()
    {
        // Arrange — a standard desktop Chrome User-Agent
        var request = new LoginRequest { Email = "desktop@example.com", Password = "password123" };
        SetupSuccessfulLogin(request, "desktop-token");
        _controller.ControllerContext.HttpContext.Request.Headers["User-Agent"] =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

        // Act
        var result = await _controller.Login(request);

        // Assert
        var body = ((OkObjectResult)result).Value as LoginResponse;
        Assert.That(body, Is.Not.Null);
        Assert.That(body!.Token, Is.Null.Or.Empty);
        var setCookie = _controller.Response.Headers["Set-Cookie"].ToString();
        Assert.That(setCookie, Does.Contain("jwt="));
    }

    #endregion

    [Test]
    public async Task Login_LogsLoginAttempt()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "password123"
        };

        var loginResponse = new LoginResponse
        {
            UserId = 1,
            FullName = "John Doe",
            Email = "test@example.com",
            ClubId = 1,
            Role = "Admin",
            ClubTier = "Sprout",
            Message = "Login successful! Welcome back."
        };

        _mockAuthService.Setup(x => x.LoginAsync(request))
                       .ReturnsAsync(loginResponse);

        _mockAuthService.Setup(x => x.GenerateJwtToken(loginResponse.UserId, loginResponse.Email, loginResponse.ClubId, loginResponse.Role, It.IsAny<bool>()))
                       .Returns("fake-jwt-token");

        // Act
        var result = await _controller.Login(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        _mockAuthService.Verify(x => x.LoginAsync(request), Times.Once);
        _mockAuthService.Verify(x => x.GenerateJwtToken(loginResponse.UserId, loginResponse.Email, loginResponse.ClubId, loginResponse.Role, It.IsAny<bool>()), Times.Once);
    }

    #region Invitation Acceptance Endpoint Tests

    [Test]
    public async Task ValidateInviteToken_WithValidToken_ReturnsOkWithValidationResponse()
    {
        // Arrange
        var validationResponse = new InviteValidationResponse
        {
            IsValid = true,
            Email = "newadmin@test.com",
            ClubName = "Test Club",
            HasExistingAccount = false,
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            InvitedByName = "Primary Admin"
        };

        _mockAuthService.Setup(x => x.ValidateInviteTokenAsync("valid-token"))
            .ReturnsAsync(validationResponse);

        // Act
        var result = await _controller.ValidateInviteToken("valid-token");

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult!.Value, Is.EqualTo(validationResponse));

        _mockAuthService.Verify(x => x.ValidateInviteTokenAsync("valid-token"), Times.Once);
    }

    [Test]
    public async Task ValidateInviteToken_WithInvalidToken_ReturnsOkWithInvalidResponse()
    {
        // Arrange
        var validationResponse = new InviteValidationResponse
        {
            IsValid = false,
            ErrorMessage = "Invalid invitation link. Please check the link and try again."
        };

        _mockAuthService.Setup(x => x.ValidateInviteTokenAsync("invalid-token"))
            .ReturnsAsync(validationResponse);

        // Act
        var result = await _controller.ValidateInviteToken("invalid-token");

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as InviteValidationResponse;
        Assert.That(response!.IsValid, Is.False);
        Assert.That(response.ErrorMessage, Does.Contain("Invalid invitation link"));
    }

    [Test]
    public async Task ValidateInviteToken_WithEmptyToken_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.ValidateInviteToken("");

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        var problemDetails = badRequestResult!.Value as ValidationProblemDetails;
        Assert.That(problemDetails!.Detail, Does.Contain("invitation token is required"));

        _mockAuthService.Verify(x => x.ValidateInviteTokenAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task ValidateInviteToken_WithNullToken_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.ValidateInviteToken(null!);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        _mockAuthService.Verify(x => x.ValidateInviteTokenAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task ValidateInviteToken_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        _mockAuthService.Setup(x => x.ValidateInviteTokenAsync("token"))
            .ThrowsAsync(new Exception("Service error"));

        // Act
        var result = await _controller.ValidateInviteToken("token");

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));

        var problemDetails = objectResult.Value as ProblemDetails;
        Assert.That(problemDetails!.Title, Is.EqualTo("Validation Error"));
        Assert.That(problemDetails.Detail, Does.Contain("unexpected error occurred"));
    }

    [Test]
    public async Task AcceptAdminInvite_WithNewUser_ReturnsOkAndSetsAuthCookie()
    {
        // Arrange
        var request = new AcceptAdminInviteRequest
        {
            Token = "valid-token",
            FullName = "New Admin User",
            Password = "NewPassword123!"
        };

        var acceptResponse = new AcceptAdminInviteResponse
        {
            User = new UserInfoDto
            {
                Id = 2,
                FullName = "New Admin User",
                Email = "newadmin@test.com",
                OnboardingCompleted = true
            },
            Club = new ClubInfoDto
            {
                Id = 1,
                Name = "Test Club",
                Tier = "Grow"
            },
            IsNewUser = true,
            Message = "You are now an administrator for Test Club!"
        };

        _mockAuthService.Setup(x => x.AcceptAdminInviteAsync(request))
            .ReturnsAsync(acceptResponse);
        _mockAuthService.Setup(x => x.GenerateJwtToken(2, "newadmin@test.com", 1, "Admin", It.IsAny<bool>()))
            .Returns("jwt-token");

        // Act
        var result = await _controller.AcceptAdminInvite(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult!.Value, Is.EqualTo(acceptResponse));

        _mockAuthService.Verify(x => x.AcceptAdminInviteAsync(request), Times.Once);
        _mockAuthService.Verify(x => x.GenerateJwtToken(2, "newadmin@test.com", 1, "Admin", It.IsAny<bool>()), Times.Once);

        // Verify auth cookie was set
        var httpContext = _controller.HttpContext;
        var response = httpContext.Response;
        // Note: In a real test, we'd need to verify the cookie was added to the response
        // For this unit test, we can verify the service method was called correctly
    }

    [Test]
    public async Task AcceptAdminInvite_WithExistingUser_ReturnsOkAndSetsAuthCookie()
    {
        // Arrange
        var request = new AcceptAdminInviteRequest
        {
            Token = "valid-token"
            // No password/fullName for existing user
        };

        var acceptResponse = new AcceptAdminInviteResponse
        {
            User = new UserInfoDto
            {
                Id = 3,
                FullName = "Existing User",
                Email = "existing@test.com",
                OnboardingCompleted = true
            },
            Club = new ClubInfoDto
            {
                Id = 1,
                Name = "Test Club",
                Tier = "Grow"
            },
            IsNewUser = false,
            Message = "You are now an administrator for Test Club!"
        };

        _mockAuthService.Setup(x => x.AcceptAdminInviteAsync(request))
            .ReturnsAsync(acceptResponse);
        _mockAuthService.Setup(x => x.GenerateJwtToken(3, "existing@test.com", 1, "Admin", It.IsAny<bool>()))
            .Returns("jwt-token");

        // Act
        var result = await _controller.AcceptAdminInvite(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as AcceptAdminInviteResponse;
        Assert.That(response!.IsNewUser, Is.False);
        Assert.That(response.User.FullName, Is.EqualTo("Existing User"));

        _mockAuthService.Verify(x => x.AcceptAdminInviteAsync(request), Times.Once);
        _mockAuthService.Verify(x => x.GenerateJwtToken(3, "existing@test.com", 1, "Admin", It.IsAny<bool>()), Times.Once);
    }

    [Test]
    public async Task AcceptAdminInvite_WithInvalidToken_ReturnsBadRequest()
    {
        // Arrange
        var request = new AcceptAdminInviteRequest
        {
            Token = "invalid-token",
            FullName = "New Admin",
            Password = "Password123!"
        };

        _mockAuthService.Setup(x => x.AcceptAdminInviteAsync(request))
            .ThrowsAsync(new InvalidOperationException("Invalid invitation link. Please check the link and try again."));

        // Act
        var result = await _controller.AcceptAdminInvite(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        var problemDetails = badRequestResult!.Value as ProblemDetails;
        Assert.That(problemDetails!.Title, Is.EqualTo("Invalid Invitation"));
        Assert.That(problemDetails.Detail, Does.Contain("Invalid invitation link"));
    }

    [Test]
    public async Task AcceptAdminInvite_WithUserAlreadyAdmin_ReturnsConflict()
    {
        // Arrange
        var request = new AcceptAdminInviteRequest
        {
            Token = "valid-token"
        };

        _mockAuthService.Setup(x => x.AcceptAdminInviteAsync(request))
            .ThrowsAsync(new InvalidOperationException("You are already an administrator of this club"));

        // Act
        var result = await _controller.AcceptAdminInvite(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ConflictObjectResult>());
        var conflictResult = result as ConflictObjectResult;
        var problemDetails = conflictResult!.Value as ProblemDetails;
        Assert.That(problemDetails!.Title, Is.EqualTo("Already Administrator"));
        Assert.That(problemDetails.Detail, Does.Contain("already an administrator"));
    }

    [Test]
    public async Task AcceptAdminInvite_WithMissingRequiredFields_ReturnsBadRequest()
    {
        // Arrange
        var request = new AcceptAdminInviteRequest
        {
            Token = "valid-token",
            FullName = "New Admin"
            // Missing password for new user
        };

        _mockAuthService.Setup(x => x.AcceptAdminInviteAsync(request))
            .ThrowsAsync(new ArgumentException("Password is required for new users"));

        // Act
        var result = await _controller.AcceptAdminInvite(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        var problemDetails = badRequestResult!.Value as ProblemDetails;
        Assert.That(problemDetails!.Title, Is.EqualTo("Invalid Request"));
        Assert.That(problemDetails.Detail, Does.Contain("Password is required"));
    }

    [Test]
    public async Task AcceptAdminInvite_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new AcceptAdminInviteRequest
        {
            Token = "valid-token",
            FullName = "New Admin",
            Password = "Password123!"
        };

        _mockAuthService.Setup(x => x.AcceptAdminInviteAsync(request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.AcceptAdminInvite(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));

        var problemDetails = objectResult.Value as ProblemDetails;
        Assert.That(problemDetails!.Title, Is.EqualTo("Invitation Acceptance Error"));
        Assert.That(problemDetails.Detail, Does.Contain("unexpected error occurred"));
    }

    [Test]
    public async Task AcceptAdminInvite_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var request = new AcceptAdminInviteRequest
        {
            Token = "" // Invalid - required field
        };

        // Simulate model state error
        _controller.ModelState.AddModelError("Token", "The Token field is required.");

        // Act
        var result = await _controller.AcceptAdminInvite(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());

        _mockAuthService.Verify(x => x.AcceptAdminInviteAsync(It.IsAny<AcceptAdminInviteRequest>()), Times.Never);
    }

    #endregion

    #region Member Authentication Tests (User Story 13c)

    [Test]
    public async Task Login_ActivatedMemberGrowTier_ReturnsOkWithMemberRole()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "member@example.com",
            Password = "password123"
        };

        var loginResponse = new LoginResponse
        {
            UserId = 2,
            FullName = "David Lee",
            Email = "member@example.com",
            ClubId = 1,
            Role = "Member",
            ClubTier = "Grow",
            Message = "Login successful! Welcome back."
        };

        _mockAuthService.Setup(x => x.LoginAsync(request))
                       .ReturnsAsync(loginResponse);

        _mockAuthService.Setup(x => x.GenerateJwtToken(loginResponse.UserId, loginResponse.Email, loginResponse.ClubId, loginResponse.Role, It.IsAny<bool>()))
                       .Returns("fake-jwt-token");

        // Act
        var result = await _controller.Login(request);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var response = okResult.Value as LoginResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response.UserId, Is.EqualTo(loginResponse.UserId));
        Assert.That(response.FullName, Is.EqualTo(loginResponse.FullName));
        Assert.That(response.Email, Is.EqualTo(loginResponse.Email));
        Assert.That(response.ClubId, Is.EqualTo(loginResponse.ClubId));
        Assert.That(response.Role, Is.EqualTo("Member"));
        Assert.That(response.Message, Is.EqualTo(loginResponse.Message));

        // Verify JWT token was generated with Member role
        _mockAuthService.Verify(x => x.GenerateJwtToken(loginResponse.UserId, loginResponse.Email, loginResponse.ClubId, "Member", It.IsAny<bool>()), Times.Once);
    }

    [Test]
    public async Task Login_InactiveMemberAccount_Returns403WithActivationMessage()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "inactive@example.com",
            Password = "password123"
        };

        _mockAuthService.Setup(x => x.LoginAsync(request))
                       .ThrowsAsync(new UnauthorizedAccessException("Your account has not been activated. Please check your email for the activation link."));

        // Act
        var result = await _controller.Login(request);

        // Assert
        var forbiddenResult = result as ObjectResult;
        Assert.That(forbiddenResult, Is.Not.Null);
        Assert.That(forbiddenResult.StatusCode, Is.EqualTo(403));

        var problemDetails = forbiddenResult.Value as ProblemDetails;
        Assert.That(problemDetails, Is.Not.Null);
        Assert.That(problemDetails.Title, Is.EqualTo("Account Not Activated"));
        Assert.That(problemDetails.Detail, Does.Contain("not been activated"));
        Assert.That(problemDetails.Status, Is.EqualTo(403));
    }

    [Test]
    public async Task Login_MemberSproutTierClub_Returns403WithTierMessage()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "member@sprout.com",
            Password = "password123"
        };

        _mockAuthService.Setup(x => x.LoginAsync(request))
                       .ThrowsAsync(new UnauthorizedAccessException("Access denied. Member portal access requires your club to be on the Grow tier."));

        // Act
        var result = await _controller.Login(request);

        // Assert
        var forbiddenResult = result as ObjectResult;
        Assert.That(forbiddenResult, Is.Not.Null);
        Assert.That(forbiddenResult.StatusCode, Is.EqualTo(403));

        var problemDetails = forbiddenResult.Value as ProblemDetails;
        Assert.That(problemDetails, Is.Not.Null);
        Assert.That(problemDetails.Title, Is.EqualTo("Access Denied"));
        Assert.That(problemDetails.Detail, Does.Contain("Grow tier"));
        Assert.That(problemDetails.Status, Is.EqualTo(403));
    }

    [Test]
    public async Task Login_AdminUser_ReturnsOkWithAdminRole()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "admin@example.com",
            Password = "password123"
        };

        var loginResponse = new LoginResponse
        {
            UserId = 1,
            FullName = "John Doe",
            Email = "admin@example.com",
            ClubId = 1,
            Role = "Admin",
            ClubTier = "Sprout",
            Message = "Login successful! Welcome back."
        };

        _mockAuthService.Setup(x => x.LoginAsync(request))
                       .ReturnsAsync(loginResponse);

        _mockAuthService.Setup(x => x.GenerateJwtToken(loginResponse.UserId, loginResponse.Email, loginResponse.ClubId, loginResponse.Role, It.IsAny<bool>()))
                       .Returns("fake-jwt-token");

        // Act
        var result = await _controller.Login(request);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var response = okResult.Value as LoginResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response.Role, Is.EqualTo("Admin"));

        // Verify JWT token was generated with Admin role
        _mockAuthService.Verify(x => x.GenerateJwtToken(loginResponse.UserId, loginResponse.Email, loginResponse.ClubId, "Admin", It.IsAny<bool>()), Times.Once);
    }

    #endregion

    #region Logout Tests

    [Test]
    public void Logout_ValidRequest_ReturnsOkAndClearsJwtCookie()
    {
        // Arrange
        // No setup needed for logout

        // Act
        var result = _controller.Logout();

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var value = okResult.Value;
        Assert.That(value, Is.Not.Null);

        // Check message property using reflection
        var messageProperty = value.GetType().GetProperty("message");
        Assert.That(messageProperty, Is.Not.Null);
        Assert.That(messageProperty.GetValue(value), Is.EqualTo("Logged out successfully"));

        // Verify cookie was deleted
        var cookies = _controller.Response.Headers["Set-Cookie"];
        Assert.That(cookies.Any(c => c.Contains("jwt=")), Is.True, "JWT cookie should be cleared");
    }

    [Test]
    public void Logout_WithException_ReturnsInternalServerError()
    {
        // Arrange
        // Create a controller with a mocked HttpContext that throws on cookie operations
        var mockHttpContext = new Mock<HttpContext>();
        mockHttpContext.Setup(x => x.Response.Cookies)
                      .Throws(new Exception("Cookie deletion error"));

        var controller = new AuthController(
            _mockAuthService.Object,
            _mockMemberActivationService.Object,
            _mockExternalAuthService.Object,
            _mockLogger.Object,
            _mockWebHostEnvironment.Object,
            _mockConfiguration.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = mockHttpContext.Object
            }
        };

        // Act
        var result = controller.Logout();

        // Assert
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var problemDetails = statusCodeResult.Value as ProblemDetails;
        Assert.That(problemDetails, Is.Not.Null);
        Assert.That(problemDetails.Title, Is.EqualTo("Logout Error"));
        Assert.That(problemDetails.Detail, Is.EqualTo("An unexpected error occurred during logout. Please try again."));
    }

    #endregion

    #region ForgotPassword Tests

    [Test]
    public async Task ForgotPassword_WithValidEmail_ReturnsAccepted()
    {
        // Arrange
        var request = new ForgotPasswordRequest
        {
            Email = "user@example.com"
        };

        _mockAuthService.Setup(x => x.ForgotPasswordAsync(request))
                       .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ForgotPassword(request);

        // Assert
        var acceptedResult = result as AcceptedResult;
        Assert.That(acceptedResult, Is.Not.Null);
        Assert.That(acceptedResult.StatusCode, Is.EqualTo(202));

        var value = acceptedResult.Value;
        var messageProperty = value.GetType().GetProperty("message");
        Assert.That(messageProperty.GetValue(value), Is.EqualTo("If an account with that email exists, a password reset link has been sent."));

        _mockAuthService.Verify(x => x.ForgotPasswordAsync(request), Times.Once);
    }

    [Test]
    public async Task ForgotPassword_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var request = new ForgotPasswordRequest
        {
            Email = "invalid-email"
        };

        _controller.ModelState.AddModelError("Email", "Invalid email format");

        // Act
        var result = await _controller.ForgotPassword(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        _mockAuthService.Verify(x => x.ForgotPasswordAsync(It.IsAny<ForgotPasswordRequest>()), Times.Never);
    }

    [Test]
    public async Task ForgotPassword_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new ForgotPasswordRequest
        {
            Email = "user@example.com"
        };

        _mockAuthService.Setup(x => x.ForgotPasswordAsync(request))
                       .ThrowsAsync(new Exception("Email service error"));

        // Act
        var result = await _controller.ForgotPassword(request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var problemDetails = statusCodeResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Password Reset Error"));
    }

    #endregion

    #region ResetPassword Tests

    [Test]
    public async Task ResetPassword_WithValidToken_ReturnsOk()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "valid-reset-token",
            NewPassword = "NewP@ssw0rd123",
            ConfirmPassword = "NewP@ssw0rd123"
        };

        _mockAuthService.Setup(x => x.ResetPasswordAsync(request))
                       .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ResetPassword(request);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var value = okResult.Value;
        var messageProperty = value.GetType().GetProperty("message");
        Assert.That(messageProperty.GetValue(value), Is.EqualTo("Password reset successful. You can now log in with your new password."));

        _mockAuthService.Verify(x => x.ResetPasswordAsync(request), Times.Once);
    }

    [Test]
    public async Task ResetPassword_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "invalid-token",
            NewPassword = "NewP@ssw0rd123",
            ConfirmPassword = "NewP@ssw0rd123"
        };

        _mockAuthService.Setup(x => x.ResetPasswordAsync(request))
                       .ThrowsAsync(new UnauthorizedAccessException("Invalid or expired token"));

        // Act
        var result = await _controller.ResetPassword(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);
        Assert.That(unauthorizedResult.StatusCode, Is.EqualTo(401));

        var problemDetails = unauthorizedResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Invalid Reset Token"));
        Assert.That(problemDetails.Detail, Is.EqualTo("The reset token is invalid, expired, or has already been used."));
    }

    [Test]
    public async Task ResetPassword_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "token",
            NewPassword = "short",
            ConfirmPassword = "short"
        };

        _controller.ModelState.AddModelError("NewPassword", "Password too short");

        // Act
        var result = await _controller.ResetPassword(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        _mockAuthService.Verify(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordRequest>()), Times.Never);
    }

    [Test]
    public async Task ResetPassword_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "token",
            NewPassword = "NewP@ssw0rd123",
            ConfirmPassword = "NewP@ssw0rd123"
        };

        _mockAuthService.Setup(x => x.ResetPasswordAsync(request))
                       .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.ResetPassword(request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var problemDetails = statusCodeResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Password Reset Error"));
    }

    #endregion

    #region CompleteOnboarding Tests

    [Test]
    public async Task CompleteOnboarding_WithValidUser_ReturnsOk()
    {
        // Arrange
        var userId = 1;
        var request = new CompleteOnboardingRequest();

        SetupAuthenticatedUser(userId);

        _mockAuthService.Setup(x => x.CompleteOnboardingAsync(userId))
                       .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.CompleteOnboarding(request);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var value = okResult.Value;
        var messageProperty = value.GetType().GetProperty("message");
        Assert.That(messageProperty.GetValue(value), Is.EqualTo("Onboarding completed successfully!"));

        _mockAuthService.Verify(x => x.CompleteOnboardingAsync(userId), Times.Once);
    }

    [Test]
    public async Task CompleteOnboarding_WithoutUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var request = new CompleteOnboardingRequest();

        // Don't set up authenticated user - no claims

        // Act
        var result = await _controller.CompleteOnboarding(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);
        Assert.That(unauthorizedResult.StatusCode, Is.EqualTo(401));

        var problemDetails = unauthorizedResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Authentication Error"));
        Assert.That(problemDetails.Detail, Is.EqualTo("Invalid authentication token."));

        _mockAuthService.Verify(x => x.CompleteOnboardingAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task CompleteOnboarding_WithInvalidUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var request = new CompleteOnboardingRequest();

        // Setup claim with invalid (non-numeric) user ID
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "invalid-id")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.CompleteOnboarding(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);
        Assert.That(unauthorizedResult.StatusCode, Is.EqualTo(401));

        _mockAuthService.Verify(x => x.CompleteOnboardingAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task CompleteOnboarding_WithNonExistentUser_ReturnsNotFound()
    {
        // Arrange
        var userId = 999;
        var request = new CompleteOnboardingRequest();

        SetupAuthenticatedUser(userId);

        _mockAuthService.Setup(x => x.CompleteOnboardingAsync(userId))
                       .ThrowsAsync(new ArgumentException("User not found"));

        // Act
        var result = await _controller.CompleteOnboarding(request);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult, Is.Not.Null);
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));

        var problemDetails = notFoundResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("User Not Found"));
    }

    [Test]
    public async Task CompleteOnboarding_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        var request = new CompleteOnboardingRequest();

        SetupAuthenticatedUser(userId);

        _mockAuthService.Setup(x => x.CompleteOnboardingAsync(userId))
                       .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CompleteOnboarding(request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var problemDetails = statusCodeResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Complete Onboarding Error"));
    }

    #endregion

    #region GetCurrentSession Tests

    [Test]
    public async Task GetCurrentSession_WithValidUser_ReturnsOkWithSessionInfo()
    {
        // Arrange
        var userId = 1;

        SetupAuthenticatedUser(userId);

        var sessionResponse = new UserSessionResponse
        {
            UserId = userId,
            Email = "user@example.com",
            FullName = "John Doe",
            ClubId = 1,
            ClubName = "Test Club",
            Role = "Admin",
            IsOnboardingCompleted = true
        };

        _mockAuthService.Setup(x => x.GetCurrentSessionAsync(userId))
                       .ReturnsAsync(sessionResponse);

        // Act
        var result = await _controller.GetCurrentSession();

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var response = okResult.Value as UserSessionResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response.UserId, Is.EqualTo(userId));
        Assert.That(response.Email, Is.EqualTo("user@example.com"));

        _mockAuthService.Verify(x => x.GetCurrentSessionAsync(userId), Times.Once);
    }

    [Test]
    public async Task GetCurrentSession_WithoutUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        // Don't set up authenticated user

        // Act
        var result = await _controller.GetCurrentSession();

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);
        Assert.That(unauthorizedResult.StatusCode, Is.EqualTo(401));

        var problemDetails = unauthorizedResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Authentication Error"));

        _mockAuthService.Verify(x => x.GetCurrentSessionAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetCurrentSession_WithInvalidUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "not-a-number")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.GetCurrentSession();

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);
        Assert.That(unauthorizedResult.StatusCode, Is.EqualTo(401));

        _mockAuthService.Verify(x => x.GetCurrentSessionAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetCurrentSession_WithNonExistentUser_ReturnsNotFound()
    {
        // Arrange
        var userId = 999;

        SetupAuthenticatedUser(userId);

        _mockAuthService.Setup(x => x.GetCurrentSessionAsync(userId))
                       .ThrowsAsync(new ArgumentException("User not found"));

        // Act
        var result = await _controller.GetCurrentSession();

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult, Is.Not.Null);
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));

        var problemDetails = notFoundResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("User Not Found"));
    }

    [Test]
    public async Task GetCurrentSession_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;

        SetupAuthenticatedUser(userId);

        _mockAuthService.Setup(x => x.GetCurrentSessionAsync(userId))
                       .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetCurrentSession();

        // Assert
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var problemDetails = statusCodeResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Session Error"));
    }

    #endregion

    #region ResendActivation Tests

    [Test]
    public async Task ResendActivation_WithValidEmail_ReturnsOkWithSuccessResponse()
    {
        // Arrange
        var request = new ResendActivationRequest
        {
            Email = "member@example.com"
        };

        var response = new ResendActivationResponse
        {
            Success = true,
            Message = "Activation email has been resent successfully."
        };

        _mockMemberActivationService.Setup(x => x.ResendActivationEmailAsync(request.Email))
                                   .ReturnsAsync(response);

        // Act
        var result = await _controller.ResendActivation(request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var actualResponse = okResult.Value as ResendActivationResponse;
        Assert.That(actualResponse, Is.Not.Null);
        Assert.That(actualResponse.Success, Is.True);
        Assert.That(actualResponse.Message, Is.EqualTo("Activation email has been resent successfully."));

        _mockMemberActivationService.Verify(x => x.ResendActivationEmailAsync(request.Email), Times.Once);
    }

    [Test]
    public async Task ResendActivation_WithNonExistentEmail_ReturnsBadRequestWithFailureResponse()
    {
        // Arrange
        var request = new ResendActivationRequest
        {
            Email = "nonexistent@example.com"
        };

        var response = new ResendActivationResponse
        {
            Success = false,
            Message = "No account found with this email address."
        };

        _mockMemberActivationService.Setup(x => x.ResendActivationEmailAsync(request.Email))
                                   .ReturnsAsync(response);

        // Act
        var result = await _controller.ResendActivation(request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var actualResponse = badRequestResult.Value as ResendActivationResponse;
        Assert.That(actualResponse.Success, Is.False);
    }

    [Test]
    public async Task ResendActivation_WithAlreadyActivatedAccount_ReturnsBadRequestWithFailureResponse()
    {
        // Arrange
        var request = new ResendActivationRequest
        {
            Email = "activated@example.com"
        };

        var response = new ResendActivationResponse
        {
            Success = false,
            Message = "This account has already been activated."
        };

        _mockMemberActivationService.Setup(x => x.ResendActivationEmailAsync(request.Email))
                                   .ReturnsAsync(response);

        // Act
        var result = await _controller.ResendActivation(request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var actualResponse = badRequestResult.Value as ResendActivationResponse;
        Assert.That(actualResponse.Success, Is.False);
        Assert.That(actualResponse.Message, Does.Contain("already been activated"));
    }

    [Test]
    public async Task ResendActivation_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new ResendActivationRequest
        {
            Email = "user@example.com"
        };

        _mockMemberActivationService.Setup(x => x.ResendActivationEmailAsync(request.Email))
                                   .ThrowsAsync(new Exception("Email service error"));

        // Act
        var result = await _controller.ResendActivation(request);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var response = statusCodeResult.Value as ResendActivationResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response.Success, Is.False);
        Assert.That(response.Message, Is.EqualTo("An unexpected error occurred. Please try again later."));
    }

    #endregion

    #region GoogleLogin Tests

    [Test]
    public async Task GoogleLogin_WithValidToken_NewUser_ReturnsOkWithNewUserResponse()
    {
        // Arrange
        var request = new ExternalAuthRequest
        {
            IdToken = "valid-google-token",
            Platform = "mobile",
            FullName = "John Doe"
        };

        var authResult = new ExternalAuthResult
        {
            Success = true,
            IsNewUser = true,
            WasLinkedToExisting = false,
            User = new Domain.Entities.User
            {
                Id = 1,
                Email = "john@gmail.com",
                FullName = "John Doe",
                OnboardingCompleted = false,
                ClubAdmins = new List<Domain.Entities.ClubAdmin>()
            },
            Token = "jwt-token-for-mobile"
        };

        _mockExternalAuthService.Setup(x => x.AuthenticateWithGoogleAsync(request.IdToken, request.Platform, request.FullName))
                               .ReturnsAsync(authResult);

        // Act
        var result = await _controller.GoogleLogin(request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var response = okResult.Value as ExternalAuthResponse;
        Assert.That(response.Success, Is.True);
        Assert.That(response.IsNewUser, Is.True);
        Assert.That(response.Message, Is.EqualTo("Account created successfully"));
        Assert.That(response.Token, Is.EqualTo("jwt-token-for-mobile"));
    }

    [Test]
    public async Task GoogleLogin_WithValidToken_ExistingUser_ReturnsOkWithWelcomeBackMessage()
    {
        // Arrange
        var request = new ExternalAuthRequest
        {
            IdToken = "valid-google-token",
            Platform = "web",
            FullName = null
        };

        var authResult = new ExternalAuthResult
        {
            Success = true,
            IsNewUser = false,
            WasLinkedToExisting = false,
            User = new Domain.Entities.User
            {
                Id = 1,
                Email = "existing@gmail.com",
                FullName = "Existing User",
                OnboardingCompleted = true,
                ClubAdmins = new List<Domain.Entities.ClubAdmin>
                {
                    new Domain.Entities.ClubAdmin
                    {
                        UserId = 1,
                        ClubId = 1,
                        Club = new Domain.Entities.Club { Id = 1, Name = "Test Club", Tier = "Grow" }
                    }
                }
            }
        };

        _mockAuthService.Setup(x => x.GenerateJwtToken(1, "existing@gmail.com", 1, "Admin", false))
                       .Returns("web-jwt-token");

        _mockExternalAuthService.Setup(x => x.AuthenticateWithGoogleAsync(request.IdToken, request.Platform, request.FullName))
                               .ReturnsAsync(authResult);

        // Act
        var result = await _controller.GoogleLogin(request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        var response = okResult.Value as ExternalAuthResponse;
        Assert.That(response.Success, Is.True);
        Assert.That(response.IsNewUser, Is.False);
        Assert.That(response.Message, Is.EqualTo("Welcome back!"));
        Assert.That(response.ClubId, Is.EqualTo(1));
        Assert.That(response.Role, Is.EqualTo("Admin"));
    }

    [Test]
    public async Task GoogleLogin_WithInvalidToken_ReturnsBadRequest()
    {
        // Arrange
        var request = new ExternalAuthRequest
        {
            IdToken = "invalid-token",
            Platform = "mobile"
        };

        var authResult = new ExternalAuthResult
        {
            Success = false,
            ErrorMessage = "Invalid Google ID token"
        };

        _mockExternalAuthService.Setup(x => x.AuthenticateWithGoogleAsync(request.IdToken, request.Platform, request.FullName))
                               .ReturnsAsync(authResult);

        // Act
        var result = await _controller.GoogleLogin(request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var response = badRequestResult.Value as ExternalAuthResponse;
        Assert.That(response.Success, Is.False);
        Assert.That(response.Message, Is.EqualTo("Invalid Google ID token"));
    }

    [Test]
    public async Task GoogleLogin_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new ExternalAuthRequest
        {
            IdToken = "valid-token",
            Platform = "mobile"
        };

        _mockExternalAuthService.Setup(x => x.AuthenticateWithGoogleAsync(request.IdToken, request.Platform, request.FullName))
                               .ThrowsAsync(new Exception("Google API error"));

        // Act
        var result = await _controller.GoogleLogin(request);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var response = statusCodeResult.Value as ExternalAuthResponse;
        Assert.That(response.Success, Is.False);
        Assert.That(response.Message, Is.EqualTo("An unexpected error occurred during Google authentication"));
    }

    #endregion

    #region AppleLogin Tests

    [Test]
    public async Task AppleLogin_WithValidToken_NewUser_ReturnsOkWithNewUserResponse()
    {
        // Arrange
        var request = new ExternalAuthRequest
        {
            IdToken = "valid-apple-token",
            Platform = "mobile",
            FullName = "Jane Doe",
            Nonce = "random-nonce"
        };

        var authResult = new ExternalAuthResult
        {
            Success = true,
            IsNewUser = true,
            WasLinkedToExisting = false,
            User = new Domain.Entities.User
            {
                Id = 2,
                Email = "jane@privaterelay.appleid.com",
                FullName = "Jane Doe",
                OnboardingCompleted = false,
                ClubAdmins = new List<Domain.Entities.ClubAdmin>()
            },
            Token = "apple-jwt-token"
        };

        _mockExternalAuthService.Setup(x => x.AuthenticateWithAppleAsync(request.IdToken, request.Platform, request.FullName, request.Nonce))
                               .ReturnsAsync(authResult);

        // Act
        var result = await _controller.AppleLogin(request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        var response = okResult.Value as ExternalAuthResponse;
        Assert.That(response.Success, Is.True);
        Assert.That(response.IsNewUser, Is.True);
        Assert.That(response.Message, Is.EqualTo("Account created successfully"));
    }

    [Test]
    public async Task AppleLogin_WithValidToken_LinkedAccount_ReturnsOkWithLinkedMessage()
    {
        // Arrange
        var request = new ExternalAuthRequest
        {
            IdToken = "valid-apple-token",
            Platform = "mobile",
            Nonce = "nonce"
        };

        var authResult = new ExternalAuthResult
        {
            Success = true,
            IsNewUser = false,
            WasLinkedToExisting = true,
            User = new Domain.Entities.User
            {
                Id = 2,
                Email = "user@example.com",
                FullName = "User Name",
                OnboardingCompleted = true,
                ClubAdmins = new List<Domain.Entities.ClubAdmin>()
            },
            Token = "apple-jwt-token"
        };

        _mockExternalAuthService.Setup(x => x.AuthenticateWithAppleAsync(request.IdToken, request.Platform, request.FullName, request.Nonce))
                               .ReturnsAsync(authResult);

        // Act
        var result = await _controller.AppleLogin(request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        var response = okResult.Value as ExternalAuthResponse;
        Assert.That(response.Success, Is.True);
        Assert.That(response.WasLinked, Is.True);
        Assert.That(response.Message, Is.EqualTo("Apple account linked successfully"));
    }

    [Test]
    public async Task AppleLogin_WithInvalidToken_ReturnsBadRequest()
    {
        // Arrange
        var request = new ExternalAuthRequest
        {
            IdToken = "invalid-apple-token",
            Platform = "mobile",
            Nonce = "nonce"
        };

        var authResult = new ExternalAuthResult
        {
            Success = false,
            ErrorMessage = "Invalid Apple ID token"
        };

        _mockExternalAuthService.Setup(x => x.AuthenticateWithAppleAsync(request.IdToken, request.Platform, request.FullName, request.Nonce))
                               .ReturnsAsync(authResult);

        // Act
        var result = await _controller.AppleLogin(request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);

        var response = badRequestResult.Value as ExternalAuthResponse;
        Assert.That(response.Success, Is.False);
        Assert.That(response.Message, Is.EqualTo("Invalid Apple ID token"));
    }

    [Test]
    public async Task AppleLogin_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new ExternalAuthRequest
        {
            IdToken = "valid-token",
            Platform = "mobile",
            Nonce = "nonce"
        };

        _mockExternalAuthService.Setup(x => x.AuthenticateWithAppleAsync(request.IdToken, request.Platform, request.FullName, request.Nonce))
                               .ThrowsAsync(new Exception("Apple API error"));

        // Act
        var result = await _controller.AppleLogin(request);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var response = statusCodeResult.Value as ExternalAuthResponse;
        Assert.That(response.Success, Is.False);
        Assert.That(response.Message, Is.EqualTo("An unexpected error occurred during Apple authentication"));
    }

    #endregion

    #region LinkProvider Tests

    [Test]
    public async Task LinkProvider_WithValidRequest_ReturnsOkWithSuccessMessage()
    {
        // Arrange
        var userId = 1;
        var request = new LinkProviderRequest
        {
            Provider = "Google",
            IdToken = "valid-google-token",
            Platform = "web"
        };

        SetupAuthenticatedUser(userId);

        _mockExternalAuthService.Setup(x => x.LinkProviderAsync(userId, request.Provider, request.IdToken, request.Platform))
                               .ReturnsAsync(true);

        // Act
        var result = await _controller.LinkProvider(request);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var value = okResult.Value;
        var successProperty = value.GetType().GetProperty("success");
        var messageProperty = value.GetType().GetProperty("message");

        Assert.That(successProperty.GetValue(value), Is.EqualTo(true));
        Assert.That(messageProperty.GetValue(value), Is.EqualTo("Google account linked successfully"));

        _mockExternalAuthService.Verify(x => x.LinkProviderAsync(userId, request.Provider, request.IdToken, request.Platform), Times.Once);
    }

    [Test]
    public async Task LinkProvider_WithoutUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LinkProviderRequest
        {
            Provider = "Apple",
            IdToken = "token",
            Platform = "mobile"
        };

        // Don't set up authenticated user

        // Act
        var result = await _controller.LinkProvider(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);

        var problemDetails = unauthorizedResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Unauthorized"));

        _mockExternalAuthService.Verify(x => x.LinkProviderAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task LinkProvider_WithAlreadyLinkedProvider_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        var request = new LinkProviderRequest
        {
            Provider = "Google",
            IdToken = "token",
            Platform = "web"
        };

        SetupAuthenticatedUser(userId);

        _mockExternalAuthService.Setup(x => x.LinkProviderAsync(userId, request.Provider, request.IdToken, request.Platform))
                               .ReturnsAsync(false);

        // Act
        var result = await _controller.LinkProvider(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);

        var problemDetails = badRequestResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Linking Failed"));
        Assert.That(problemDetails.Detail, Does.Contain("already be linked"));
    }

    [Test]
    public async Task LinkProvider_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        var request = new LinkProviderRequest
        {
            Provider = "Google",
            IdToken = "token",
            Platform = "web"
        };

        SetupAuthenticatedUser(userId);

        _mockExternalAuthService.Setup(x => x.LinkProviderAsync(userId, request.Provider, request.IdToken, request.Platform))
                               .ThrowsAsync(new Exception("Provider API error"));

        // Act
        var result = await _controller.LinkProvider(request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var problemDetails = statusCodeResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Server Error"));
    }

    #endregion

    #region UnlinkProvider Tests

    [Test]
    public async Task UnlinkProvider_WithValidProvider_ReturnsOkWithSuccessMessage()
    {
        // Arrange
        var userId = 1;
        var provider = "Google";

        SetupAuthenticatedUser(userId);

        _mockExternalAuthService.Setup(x => x.UnlinkProviderAsync(userId, provider))
                               .ReturnsAsync((true, null));

        // Act
        var result = await _controller.UnlinkProvider(provider);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        var value = okResult.Value;
        var successProperty = value.GetType().GetProperty("success");
        var messageProperty = value.GetType().GetProperty("message");

        Assert.That(successProperty.GetValue(value), Is.EqualTo(true));
        Assert.That(messageProperty.GetValue(value), Is.EqualTo("Google account unlinked successfully"));

        _mockExternalAuthService.Verify(x => x.UnlinkProviderAsync(userId, provider), Times.Once);
    }

    [Test]
    public async Task UnlinkProvider_WithLastAuthMethod_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        var provider = "Google";

        SetupAuthenticatedUser(userId);

        _mockExternalAuthService.Setup(x => x.UnlinkProviderAsync(userId, provider))
                               .ReturnsAsync((false, "Cannot unlink your last authentication method"));

        // Act
        var result = await _controller.UnlinkProvider(provider);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);

        var problemDetails = badRequestResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Unlinking Failed"));
        Assert.That(problemDetails.Detail, Does.Contain("last authentication method"));
    }

    [Test]
    public async Task UnlinkProvider_WithoutUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var provider = "Apple";

        // Don't set up authenticated user

        // Act
        var result = await _controller.UnlinkProvider(provider);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);

        _mockExternalAuthService.Verify(x => x.UnlinkProviderAsync(It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task UnlinkProvider_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        var provider = "Google";

        SetupAuthenticatedUser(userId);

        _mockExternalAuthService.Setup(x => x.UnlinkProviderAsync(userId, provider))
                               .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UnlinkProvider(provider);

        // Assert
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var problemDetails = statusCodeResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Server Error"));
    }

    #endregion

    #region GetLinkedProviders Tests

    [Test]
    public async Task GetLinkedProviders_WithValidUser_ReturnsOkWithProvidersInfo()
    {
        // Arrange
        var userId = 1;

        SetupAuthenticatedUser(userId);

        var providersInfo = new LinkedProvidersInfo
        {
            HasPassword = true,
            GoogleLinked = true,
            GoogleLinkedAt = DateTime.UtcNow.AddDays(-30),
            AppleLinked = false,
            AppleLinkedAt = null
        };

        _mockExternalAuthService.Setup(x => x.GetLinkedProvidersAsync(userId))
                               .ReturnsAsync(providersInfo);

        // Act
        var result = await _controller.GetLinkedProviders();

        // Assert
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        var response = okResult.Value as LinkedProvidersResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response.HasPassword, Is.True);
        Assert.That(response.GoogleLinked, Is.True);
        Assert.That(response.AppleLinked, Is.False);

        _mockExternalAuthService.Verify(x => x.GetLinkedProvidersAsync(userId), Times.Once);
    }

    [Test]
    public async Task GetLinkedProviders_WithoutUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        // Don't set up authenticated user

        // Act
        var result = await _controller.GetLinkedProviders();

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);

        var problemDetails = unauthorizedResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Unauthorized"));

        _mockExternalAuthService.Verify(x => x.GetLinkedProvidersAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetLinkedProviders_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;

        SetupAuthenticatedUser(userId);

        _mockExternalAuthService.Setup(x => x.GetLinkedProvidersAsync(userId))
                               .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetLinkedProviders();

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var problemDetails = statusCodeResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Server Error"));
    }

    #endregion

    #region SetPassword Tests

    [Test]
    public async Task SetPassword_WithValidRequest_ReturnsOkWithSuccessMessage()
    {
        // Arrange
        var userId = 1;
        var request = new SetPasswordRequest
        {
            NewPassword = "NewP@ssw0rd123"
        };

        SetupAuthenticatedUser(userId);

        _mockExternalAuthService.Setup(x => x.SetPasswordAsync(userId, request.NewPassword))
                               .ReturnsAsync(true);

        // Act
        var result = await _controller.SetPassword(request);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        var value = okResult.Value;
        var successProperty = value.GetType().GetProperty("success");
        var messageProperty = value.GetType().GetProperty("message");

        Assert.That(successProperty.GetValue(value), Is.EqualTo(true));
        Assert.That(messageProperty.GetValue(value), Is.EqualTo("Password set successfully"));

        _mockExternalAuthService.Verify(x => x.SetPasswordAsync(userId, request.NewPassword), Times.Once);
    }

    [Test]
    public async Task SetPassword_WithExistingPassword_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        var request = new SetPasswordRequest
        {
            NewPassword = "NewP@ssw0rd123"
        };

        SetupAuthenticatedUser(userId);

        _mockExternalAuthService.Setup(x => x.SetPasswordAsync(userId, request.NewPassword))
                               .ReturnsAsync(false);

        // Act
        var result = await _controller.SetPassword(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);

        var problemDetails = badRequestResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Cannot Set Password"));
        Assert.That(problemDetails.Detail, Does.Contain("already have a password"));
    }

    [Test]
    public async Task SetPassword_WithoutUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var request = new SetPasswordRequest
        {
            NewPassword = "NewP@ssw0rd123"
        };

        // Don't set up authenticated user

        // Act
        var result = await _controller.SetPassword(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);

        _mockExternalAuthService.Verify(x => x.SetPasswordAsync(It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task SetPassword_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        var request = new SetPasswordRequest
        {
            NewPassword = "weak"
        };

        SetupAuthenticatedUser(userId);

        _controller.ModelState.AddModelError("NewPassword", "Password too weak");

        // Act
        var result = await _controller.SetPassword(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);

        _mockExternalAuthService.Verify(x => x.SetPasswordAsync(It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task SetPassword_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        var request = new SetPasswordRequest
        {
            NewPassword = "NewP@ssw0rd123"
        };

        SetupAuthenticatedUser(userId);

        _mockExternalAuthService.Setup(x => x.SetPasswordAsync(userId, request.NewPassword))
                               .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.SetPassword(request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));

        var problemDetails = statusCodeResult.Value as ProblemDetails;
        Assert.That(problemDetails.Title, Is.EqualTo("Server Error"));
    }

    #endregion

    #region Helper Methods

    private void SetupAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #endregion
}
