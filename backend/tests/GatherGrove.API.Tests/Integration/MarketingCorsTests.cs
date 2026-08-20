using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using GatherGrove.API.Services;
using GatherGrove.API.Tests.Shared;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace GatherGrove.API.Tests.Integration;

[TestFixture]
public class MarketingCorsTests
{
    private WebApplicationFactory<Program>? _factory;

    [TearDown]
    public void TearDown()
    {
        _factory?.Dispose();
    }

    [Test]
    public async Task MarketingLeadTurnstileFailure_PreservesCorsHeaders()
    {
        // Arrange
        var turnstile = new Mock<ITurnstileVerificationService>();
        turnstile
            .Setup(s => s.VerifyAsync(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _factory = CreateFactory(services =>
        {
            services.RemoveAll<ITurnstileVerificationService>();
            services.AddSingleton(turnstile.Object);
        });
        var client = _factory.CreateClient();
        var request = CreateLeadRequest();

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        response.Headers.GetValues("Access-Control-Allow-Origin").Should().Contain("http://localhost:3000");
    }

    [Test]
    public async Task MarketingLeadRateLimitFailure_PreservesCorsHeaders()
    {
        // Arrange
        var turnstile = new Mock<ITurnstileVerificationService>();
        turnstile
            .Setup(s => s.VerifyAsync(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var limiter = new Mock<IMarketingLeadRateLimiter>();
        limiter
            .Setup(s => s.CheckAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(MarketingLeadRateLimitResult.Denied(TimeSpan.FromMinutes(10)));

        _factory = CreateFactory(services =>
        {
            services.RemoveAll<ITurnstileVerificationService>();
            services.RemoveAll<IMarketingLeadRateLimiter>();
            services.AddSingleton(turnstile.Object);
            services.AddSingleton(limiter.Object);
        });
        var client = _factory.CreateClient();
        var request = CreateLeadRequest();

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be((HttpStatusCode)429);
        response.Headers.GetValues("Access-Control-Allow-Origin").Should().Contain("http://localhost:3000");
    }

    private static WebApplicationFactory<Program> CreateFactory(Action<IServiceCollection> configureServices)
    {
        return new TestWebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.ConfigureServices(configureServices));
    }

    private static HttpRequestMessage CreateLeadRequest()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/marketing/leads")
        {
            Content = JsonContent.Create(new
            {
                email = "cors@example.com",
                source = "newsletter",
                turnstileToken = "token"
            })
        };
        request.Headers.Add("Origin", "http://localhost:3000");
        return request;
    }
}
