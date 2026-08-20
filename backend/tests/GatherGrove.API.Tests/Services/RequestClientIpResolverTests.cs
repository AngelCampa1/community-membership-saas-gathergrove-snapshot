using System.Net;
using FluentAssertions;
using GatherGrove.API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using NUnit.Framework;

namespace GatherGrove.API.Tests.Services;

[TestFixture]
public class RequestClientIpResolverTests
{
    [Test]
    public void TrustedProxyEnabled_WithUntrustedRemoteAddress_IgnoresSpoofedForwardedHeaders()
    {
        var context = CreateContext("198.51.100.10");
        context.Request.Headers["CF-Connecting-IP"] = "127.0.0.1";
        context.Request.Headers["X-Forwarded-For"] = "203.0.113.55";
        context.Request.Headers["X-Real-IP"] = "203.0.113.56";

        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["TrustedProxy"] = "true",
            ["TrustedProxy:KnownProxies:0"] = "10.0.0.5"
        });

        var clientIp = RequestClientIpResolver.GetClientIp(context, configuration);

        clientIp.Should().Be("198.51.100.10",
            "forwarded headers from arbitrary clients are attacker-controlled and must be ignored");
    }

    [Test]
    public void TrustedProxyEnabled_WithTrustedRemoteAddress_UsesForwardedClientIp()
    {
        var context = CreateContext("10.0.0.5");
        context.Request.Headers["X-Forwarded-For"] = "203.0.113.55, 10.0.0.5";

        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["TrustedProxy"] = "true",
            ["TrustedProxy:KnownProxies:0"] = "10.0.0.5"
        });

        var clientIp = RequestClientIpResolver.GetClientIp(context, configuration);

        clientIp.Should().Be("203.0.113.55");
    }

    [Test]
    public void TrustedProxyEnabled_WithTrustedNetwork_UsesCloudflareConnectingIp()
    {
        var context = CreateContext("10.20.30.40");
        context.Request.Headers["CF-Connecting-IP"] = "203.0.113.44";

        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["TrustedProxy"] = "true",
            ["TrustedProxy:KnownNetworks:0"] = "10.20.0.0/16"
        });

        var clientIp = RequestClientIpResolver.GetClientIp(context, configuration);

        clientIp.Should().Be("203.0.113.44");
    }

    [Test]
    public void TrustedProxyEnabled_WithEnvironmentConfiguredTrustedNetwork_UsesForwardedClientIp()
    {
        var previousValue = Environment.GetEnvironmentVariable("TRUSTED_PROXY_KNOWN_NETWORKS");
        try
        {
            Environment.SetEnvironmentVariable("TRUSTED_PROXY_KNOWN_NETWORKS", "10.30.0.0/16");
            var context = CreateContext("10.30.40.50");
            context.Request.Headers["X-Real-IP"] = "203.0.113.77";

            var configuration = CreateConfiguration(new Dictionary<string, string?>
            {
                ["TrustedProxy"] = "true"
            });

            var clientIp = RequestClientIpResolver.GetClientIp(context, configuration);

            clientIp.Should().Be("203.0.113.77");
        }
        finally
        {
            Environment.SetEnvironmentVariable("TRUSTED_PROXY_KNOWN_NETWORKS", previousValue);
        }
    }

    private static DefaultHttpContext CreateContext(string remoteIp)
    {
        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = IPAddress.Parse(remoteIp);
        return context;
    }

    private static IConfiguration CreateConfiguration(Dictionary<string, string?> values)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }
}
