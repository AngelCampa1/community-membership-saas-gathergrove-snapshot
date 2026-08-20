using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Application.Configuration;
using Microsoft.Extensions.Options;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class StripeConnectControllerTests
{
    private Mock<IStripeConnectService> _mockStripeConnectService;
    private Mock<ILogger<StripeConnectController>> _mockLogger;
    private StripeConnectController _controller;

    [SetUp]
    public void Setup()
    {
        var mockContext = new Mock<GatherGrove.Infrastructure.Data.GatherGroveDbContext>(
            new DbContextOptionsBuilder<GatherGrove.Infrastructure.Data.GatherGroveDbContext>()
                .UseInMemoryDatabase(databaseName: $"StripeConnectControllerTest_{Guid.NewGuid()}")
                .Options);

        var mockConfiguration = new Mock<Microsoft.Extensions.Configuration.IConfiguration>();
        var mockServiceLogger = new Mock<ILogger<StripeConnectService>>();

        _mockStripeConnectService = new Mock<IStripeConnectService>();

        _mockLogger = new Mock<ILogger<StripeConnectController>>();

        var stripeSettings = new StripeSettings
        {
            PlatformCountry = "US",
            DefaultCountry = "US"
        };
        var mockOptions = new Mock<IOptions<StripeSettings>>();
        mockOptions.Setup(x => x.Value).Returns(stripeSettings);

        _controller = new StripeConnectController(_mockStripeConnectService.Object, _mockLogger.Object, mockOptions.Object);
    }

    private void SetupControllerContext(int clubId)
    {
        var claims = new List<Claim>
        {
            new Claim("ClubId", clubId.ToString()),
            new Claim(ClaimTypes.Email, "admin@example.com")
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };
    }

    [Test]
    public async Task GetStripeConnectLink_ValidClubId_ReturnsOkWithLink()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        var expectedResponse = new StripeConnectLinkResponse
        {
            OnboardingUrl = "https://connect.stripe.com/setup/test"
        };

        _mockStripeConnectService
            .Setup(x => x.GenerateConnectLinkAsync(clubId, It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetStripeConnectLink(null);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    // Note: Tests for invalid ClubId and missing ClubId claims have been removed
    // as these scenarios are now handled by the ClubAdmin authorization policy
    // and will return 403 Forbidden before the controller action is called.

    [Test]
    public async Task GetStripeConnectLink_ServiceThrowsInvalidOperationException_ReturnsNotFound()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        _mockStripeConnectService
            .Setup(x => x.GenerateConnectLinkAsync(clubId, It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Club not found"));

        // Act
        var result = await _controller.GetStripeConnectLink(null);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result.Result as NotFoundObjectResult;
        Assert.That(notFoundResult?.Value, Is.Not.Null);

        // The controller now returns an anonymous object with error property
        var valueString = notFoundResult!.Value?.ToString();
        Assert.That(valueString, Does.Contain("Club not found"));
    }

    [Test]
    public async Task GetStripeConnectLink_ServiceThrowsStripeConnectNotEnabledError_ReturnsServiceUnavailable()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        _mockStripeConnectService
            .Setup(x => x.GenerateConnectLinkAsync(clubId, It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Stripe Connect is not enabled. Please contact support to enable payment processing for your club."));

        // Act
        var result = await _controller.GetStripeConnectLink(null);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(503));
        var valueString = objectResult!.Value?.ToString();
        Assert.That(valueString, Does.Contain("Stripe Connect is not enabled"));
    }

    [Test]
    public async Task GetStripeConnectLink_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        _mockStripeConnectService
            .Setup(x => x.GenerateConnectLinkAsync(clubId, It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("Stripe API error"));

        // Act
        var result = await _controller.GetStripeConnectLink(null);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
        var valueString = objectResult!.Value?.ToString();
        Assert.That(valueString, Does.Contain("error occurred while generating the payment setup link"));
    }

    [Test]
    public async Task GetStripeConnectStatus_ValidClubId_ReturnsOkWithStatus()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        var expectedResponse = new StripeConnectStatusResponse
        {
            IsConnected = true,
            StripeAccountId = "acct_test123"
        };

        _mockStripeConnectService
            .Setup(x => x.GetConnectStatusAsync(clubId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetStripeConnectStatus();

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task GetStripeConnectStatus_ServiceThrowsInvalidOperationException_ReturnsNotFound()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        _mockStripeConnectService
            .Setup(x => x.GetConnectStatusAsync(clubId))
            .ThrowsAsync(new InvalidOperationException("Club not found"));

        // Act
        var result = await _controller.GetStripeConnectStatus();

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task DisconnectStripe_ValidClubId_ReturnsOkWithMessage()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        _mockStripeConnectService
            .Setup(x => x.DisconnectAsync(clubId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DisconnectStripe();

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;

        // Check that the response contains the success message
        var responseValue = okResult.Value;
        Assert.That(responseValue, Is.Not.Null);

        // Use reflection to check the anonymous object
        var messageProperty = responseValue.GetType().GetProperty("message");
        Assert.That(messageProperty, Is.Not.Null);
        Assert.That(messageProperty.GetValue(responseValue), Is.EqualTo("Stripe account disconnected successfully"));
    }

    [Test]
    public async Task DisconnectStripe_ServiceThrowsInvalidOperationException_ReturnsNotFound()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        _mockStripeConnectService
            .Setup(x => x.DisconnectAsync(clubId))
            .ThrowsAsync(new InvalidOperationException("Club not found"));

        // Act
        var result = await _controller.DisconnectStripe();

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task DisconnectStripe_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        _mockStripeConnectService
            .Setup(x => x.DisconnectAsync(clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.DisconnectStripe();

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #region GetStripeConnectLink - Additional Tests

    [Test]
    public async Task GetStripeConnectLink_NoClubIdClaim_ReturnsUnauthorized()
    {
        // Arrange - Setup without ClubId claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, "admin@example.com")
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };

        // Act
        var result = await _controller.GetStripeConnectLink(null);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult?.Value, Is.EqualTo("Club ID not found in user claims"));
    }

    [Test]
    public async Task GetStripeConnectLink_InvalidClubIdClaim_ReturnsUnauthorized()
    {
        // Arrange - Setup with invalid ClubId claim
        var claims = new List<Claim>
        {
            new Claim("ClubId", "invalid"),
            new Claim(ClaimTypes.Email, "admin@example.com")
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };

        // Act
        var result = await _controller.GetStripeConnectLink(null);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task GetStripeConnectLink_NoEmailClaim_ReturnsBadRequest()
    {
        // Arrange - Setup without Email claim
        var claims = new List<Claim>
        {
            new Claim("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };

        // Act
        var result = await _controller.GetStripeConnectLink(null);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult?.Value, Is.EqualTo("User email not found"));
    }

    [Test]
    public async Task GetStripeConnectLink_WithCountryParameter_PassesCountryToService()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        var request = new StripeConnectLinkRequest { Country = "GB" };
        var expectedResponse = new StripeConnectLinkResponse
        {
            OnboardingUrl = "https://connect.stripe.com/setup/test"
        };

        _mockStripeConnectService
            .Setup(x => x.GenerateConnectLinkAsync(clubId, It.IsAny<string>(), "GB"))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetStripeConnectLink(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        _mockStripeConnectService.Verify(x => x.GenerateConnectLinkAsync(clubId, "admin@example.com", "GB"), Times.Once);
    }

    [Test]
    public async Task GetStripeConnectLink_FailedToCreatePaymentAccount_ReturnsBadRequest()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        _mockStripeConnectService
            .Setup(x => x.GenerateConnectLinkAsync(clubId, It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Failed to create payment account: Country not supported"));

        // Act
        var result = await _controller.GetStripeConnectLink(null);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);

        var valueString = badRequestResult!.Value?.ToString();
        Assert.That(valueString, Does.Contain("Failed to create payment account"));
        Assert.That(valueString, Does.Contain("isRetryable"));
    }

    #endregion

    #region GetStripeConnectStatus - Additional Tests

    [Test]
    public async Task GetStripeConnectStatus_NoClubIdClaim_ReturnsUnauthorized()
    {
        // Arrange - Setup without ClubId claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, "admin@example.com")
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };

        // Act
        var result = await _controller.GetStripeConnectStatus();

        // Assert
        Assert.That(result.Result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task GetStripeConnectStatus_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        const int clubId = 1;
        SetupControllerContext(clubId);

        _mockStripeConnectService
            .Setup(x => x.GetConnectStatusAsync(clubId))
            .ThrowsAsync(new Exception("Stripe API error"));

        // Act
        var result = await _controller.GetStripeConnectStatus();

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region DisconnectStripe - Additional Tests

    [Test]
    public async Task DisconnectStripe_NoClubIdClaim_ReturnsUnauthorized()
    {
        // Arrange - Setup without ClubId claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, "admin@example.com")
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };

        // Act
        var result = await _controller.DisconnectStripe();

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    #endregion

    #region GetSupportedCountries Tests

    [Test]
    public void GetSupportedCountries_ReturnsOkWithCountriesList()
    {
        // Arrange - Anonymous user (AllowAnonymous endpoint)
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        var result = _controller.GetSupportedCountries();

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        var response = okResult!.Value as SupportedCountriesResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response!.Countries, Is.Not.Null);
        Assert.That(response.Countries.Count, Is.GreaterThan(0));
    }

    [Test]
    public void GetSupportedCountries_ReturnsCountriesWithCorrectProperties()
    {
        // Arrange
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        var result = _controller.GetSupportedCountries();

        // Assert
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as SupportedCountriesResponse;

        // Check that each country has required properties
        foreach (var country in response!.Countries)
        {
            Assert.That(country.Code, Is.Not.Null);
            Assert.That(country.Code, Is.Not.Empty);
            Assert.That(country.Name, Is.Not.Null);
            Assert.That(country.Name, Is.Not.Empty);
        }
    }

    [Test]
    public void GetSupportedCountries_ReturnsCountriesSortedByName()
    {
        // Arrange
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        var result = _controller.GetSupportedCountries();

        // Assert
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as SupportedCountriesResponse;

        // Verify countries are sorted by name
        var countryNames = response!.Countries.Select(c => c.Name).ToList();
        var sortedNames = countryNames.OrderBy(n => n).ToList();
        Assert.That(countryNames, Is.EqualTo(sortedNames));
    }

    #endregion
}