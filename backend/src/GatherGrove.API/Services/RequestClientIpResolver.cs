using System.Net;

namespace GatherGrove.API.Services;

public static class RequestClientIpResolver
{
    public static string GetClientIp(HttpContext context, IConfiguration configuration)
    {
        var trustProxy = configuration.GetValue<bool>("TrustedProxy")
            || string.Equals(Environment.GetEnvironmentVariable("TRUSTED_PROXY"), "true", StringComparison.OrdinalIgnoreCase);
        var remoteIpAddress = context.Connection.RemoteIpAddress;

        if (trustProxy && IsTrustedProxy(remoteIpAddress, configuration))
        {
            var cloudflareIp = context.Request.Headers["CF-Connecting-IP"].FirstOrDefault();
            if (IsValidIp(cloudflareIp))
            {
                return cloudflareIp!;
            }

            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            var leftMostForwardedIp = forwardedFor?.Split(',')[0].Trim();
            if (IsValidIp(leftMostForwardedIp))
            {
                return leftMostForwardedIp!;
            }

            var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (IsValidIp(realIp))
            {
                return realIp!;
            }
        }

        return remoteIpAddress?.ToString() ?? "unknown";
    }

    private static bool IsValidIp(string? value)
    {
        return !string.IsNullOrWhiteSpace(value) && IPAddress.TryParse(value, out _);
    }

    private static bool IsTrustedProxy(IPAddress? remoteIpAddress, IConfiguration configuration)
    {
        if (remoteIpAddress is null)
        {
            return false;
        }

        var knownProxies = GetConfiguredValues(configuration, "TrustedProxy:KnownProxies", "TRUSTED_PROXY_KNOWN_PROXIES");
        if (knownProxies.Any(proxy => IPAddress.TryParse(proxy, out var proxyAddress) && proxyAddress.Equals(remoteIpAddress)))
        {
            return true;
        }

        var knownNetworks = GetConfiguredValues(configuration, "TrustedProxy:KnownNetworks", "TRUSTED_PROXY_KNOWN_NETWORKS");
        return knownNetworks.Any(network => IsInCidrRange(remoteIpAddress, network));
    }

    private static string[] GetConfiguredValues(IConfiguration configuration, string sectionName, string environmentVariableName)
    {
        var configuredValues = configuration.GetSection(sectionName).Get<string[]>() ?? Array.Empty<string>();
        var environmentValues = (Environment.GetEnvironmentVariable(environmentVariableName) ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return configuredValues
            .Concat(environmentValues)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static bool IsInCidrRange(IPAddress address, string cidr)
    {
        var parts = cidr.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length != 2 ||
            !IPAddress.TryParse(parts[0], out var networkAddress) ||
            !int.TryParse(parts[1], out var prefixLength))
        {
            return false;
        }

        var addressBytes = address.GetAddressBytes();
        var networkBytes = networkAddress.GetAddressBytes();
        if (addressBytes.Length != networkBytes.Length || prefixLength < 0 || prefixLength > addressBytes.Length * 8)
        {
            return false;
        }

        var fullBytes = prefixLength / 8;
        var remainingBits = prefixLength % 8;

        for (var i = 0; i < fullBytes; i++)
        {
            if (addressBytes[i] != networkBytes[i])
            {
                return false;
            }
        }

        if (remainingBits == 0)
        {
            return true;
        }

        var mask = (byte)(0xFF << (8 - remainingBits));
        return (addressBytes[fullBytes] & mask) == (networkBytes[fullBytes] & mask);
    }
}
