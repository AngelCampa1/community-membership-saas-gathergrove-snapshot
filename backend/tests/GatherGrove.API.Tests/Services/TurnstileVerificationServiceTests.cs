using System.Net;
using FluentAssertions;
using GatherGrove.API.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;

namespace GatherGrove.API.Tests.Services;

[TestFixture]
public class TurnstileVerificationServiceTests
{
    [Test]
    public async Task VerifyAsync_ProductionWithoutSecret_FailsClosed()
    {
        // Arrange
        var service = CreateService(environmentName: Environments.Production);

        // Act
        var result = await service.VerifyAsync("token", "203.0.113.44");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task VerifyAsync_NonProductionWithoutSecret_AllowsLocalBypass()
    {
        // Arrange
        var service = CreateService(environmentName: Environments.Development);

        // Act
        var result = await service.VerifyAsync(null, "203.0.113.44");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task VerifyAsync_ConfiguredSecretWithoutToken_FailsClosed()
    {
        // Arrange
        var service = CreateService(environmentName: Environments.Production, secret: "secret");

        // Act
        var result = await service.VerifyAsync(null, "203.0.113.44");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task VerifyAsync_SiteVerifyReturnsNonSuccess_FailsClosed()
    {
        // Arrange
        var service = CreateService(
            environmentName: Environments.Production,
            secret: "secret",
            response: new HttpResponseMessage(HttpStatusCode.BadGateway));

        // Act
        var result = await service.VerifyAsync("token", "203.0.113.44");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task VerifyAsync_SiteVerifySuccess_ReturnsTrue()
    {
        // Arrange
        var service = CreateService(
            environmentName: Environments.Production,
            secret: "secret",
            response: new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"success":true}""")
            });

        // Act
        var result = await service.VerifyAsync("token", "203.0.113.44");

        // Assert
        result.Should().BeTrue();
    }

    private static TurnstileVerificationService CreateService(
        string environmentName,
        string? secret = null,
        HttpResponseMessage? response = null)
    {
        var configurationValues = new Dictionary<string, string?>();
        if (secret is not null)
        {
            configurationValues["Turnstile:SecretKey"] = secret;
        }

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationValues)
            .Build();

        var environment = new Mock<IHostEnvironment>();
        environment.SetupGet(e => e.EnvironmentName).Returns(environmentName);

        return new TurnstileVerificationService(
            new HttpClient(new StubHttpMessageHandler(response ?? new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"success":false}""")
            })),
            configuration,
            environment.Object,
            Mock.Of<ILogger<TurnstileVerificationService>>());
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly HttpResponseMessage _response;

        public StubHttpMessageHandler(HttpResponseMessage response)
        {
            _response = response;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(_response);
        }
    }
}
