using FluentAssertions;
using GatherGrove.API.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class WebVitalsControllerTests
{
    private Mock<ILogger<WebVitalsController>> _loggerMock = null!;
    private WebVitalsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _loggerMock = new Mock<ILogger<WebVitalsController>>();
        _controller = new WebVitalsController(_loggerMock.Object);

        // Setup default HTTP context (endpoints are public/anonymous)
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    #region TrackWebVitals Tests

    [Test]
    public void TrackWebVitals_ValidRequest_ReturnsOkWithSuccess()
    {
        // Arrange
        var request = new WebVitalsRequest
        {
            Name = "LCP",
            Value = 1250.5,
            Rating = "good",
            Url = "https://example.com/home",
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            Id = "metric-123",
            NavigationType = "navigate"
        };

        // Act
        var result = _controller.TrackWebVitals(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();

        var successProperty = value!.GetType().GetProperty("success");
        successProperty.Should().NotBeNull();
        successProperty!.GetValue(value).Should().Be(true);

        var messageProperty = value.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Web vital recorded");
    }

    [Test]
    public void TrackWebVitals_MinimalRequest_ReturnsOkWithSuccess()
    {
        // Arrange
        var request = new WebVitalsRequest
        {
            Name = "FCP",
            Value = 800.0
            // Optional fields omitted
        };

        // Act
        var result = _controller.TrackWebVitals(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        var successProperty = value!.GetType().GetProperty("success");
        successProperty!.GetValue(value).Should().Be(true);
    }

    [Test]
    public void TrackWebVitals_NullRequest_ReturnsBadRequest()
    {
        // Arrange
        WebVitalsRequest? request = null;

        // Act
        var result = _controller.TrackWebVitals(request!);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        value.Should().NotBeNull();

        var successProperty = value!.GetType().GetProperty("success");
        successProperty.Should().NotBeNull();
        successProperty!.GetValue(value).Should().Be(false);

        var messageProperty = value.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Invalid web vitals data");
    }

    [Test]
    public void TrackWebVitals_EmptyName_ReturnsBadRequest()
    {
        // Arrange
        var request = new WebVitalsRequest
        {
            Name = "",
            Value = 1000.0
        };

        // Act
        var result = _controller.TrackWebVitals(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid web vitals data");
    }

    [Test]
    [TestCase("FCP", "First Contentful Paint metric")]
    [TestCase("LCP", "Largest Contentful Paint metric")]
    [TestCase("CLS", "Cumulative Layout Shift metric")]
    [TestCase("TTFB", "Time to First Byte metric")]
    [TestCase("FID", "First Input Delay metric")]
    [TestCase("INP", "Interaction to Next Paint metric")]
    public void TrackWebVitals_DifferentMetrics_ReturnsOk(string metricName, string description)
    {
        // Arrange
        var request = new WebVitalsRequest
        {
            Name = metricName,
            Value = 1500.0,
            Rating = "needs-improvement"
        };

        // Act
        var result = _controller.TrackWebVitals(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        var successProperty = value!.GetType().GetProperty("success");
        successProperty!.GetValue(value).Should().Be(true);
    }

    [Test]
    [TestCase("good")]
    [TestCase("needs-improvement")]
    [TestCase("poor")]
    [TestCase(null)]
    public void TrackWebVitals_DifferentRatings_ReturnsOk(string? rating)
    {
        // Arrange
        var request = new WebVitalsRequest
        {
            Name = "LCP",
            Value = 2000.0,
            Rating = rating
        };

        // Act
        var result = _controller.TrackWebVitals(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    [TestCase("navigate")]
    [TestCase("reload")]
    [TestCase("back_forward")]
    [TestCase("prerender")]
    [TestCase(null)]
    public void TrackWebVitals_DifferentNavigationTypes_ReturnsOk(string? navigationType)
    {
        // Arrange
        var request = new WebVitalsRequest
        {
            Name = "FCP",
            Value = 900.0,
            NavigationType = navigationType
        };

        // Act
        var result = _controller.TrackWebVitals(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public void TrackWebVitals_WithAllOptionalFields_ReturnsOk()
    {
        // Arrange
        var request = new WebVitalsRequest
        {
            Name = "INP",
            Value = 350.5,
            Rating = "poor",
            Url = "https://example.com/events/123",
            Timestamp = 1704067200000, // Unix timestamp
            Id = "v3-1704067200000-12345678",
            NavigationType = "back_forward"
        };

        // Act
        var result = _controller.TrackWebVitals(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public void TrackWebVitals_WithoutOptionalFields_ReturnsOk()
    {
        // Arrange
        var request = new WebVitalsRequest
        {
            Name = "CLS",
            Value = 0.15,
            Rating = null,
            Url = null,
            Timestamp = null,
            Id = null,
            NavigationType = null
        };

        // Act
        var result = _controller.TrackWebVitals(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public void TrackWebVitals_ZeroValue_ReturnsOk()
    {
        // Arrange
        var request = new WebVitalsRequest
        {
            Name = "CLS",
            Value = 0.0,
            Rating = "good"
        };

        // Act
        var result = _controller.TrackWebVitals(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public void TrackWebVitals_NegativeValue_ReturnsOk()
    {
        // Arrange - While negative values shouldn't typically occur,
        // the controller doesn't validate this - it just logs the value
        var request = new WebVitalsRequest
        {
            Name = "TTFB",
            Value = -100.0,
            Rating = "poor"
        };

        // Act
        var result = _controller.TrackWebVitals(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public void TrackWebVitals_VeryLargeValue_ReturnsOk()
    {
        // Arrange
        var request = new WebVitalsRequest
        {
            Name = "LCP",
            Value = 999999.99,
            Rating = "poor"
        };

        // Act
        var result = _controller.TrackWebVitals(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    #endregion
}
