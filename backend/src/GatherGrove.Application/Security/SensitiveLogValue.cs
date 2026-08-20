using System.Security.Cryptography;
using System.Text;

namespace GatherGrove.Application.Security;

/// <summary>
/// Creates stable, non-secret identifiers for sensitive values that may need correlation in logs.
/// </summary>
public static class SensitiveLogValue
{
    public static string Fingerprint(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return "[empty]";
        }

        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return $"sha256:{Convert.ToHexString(hash.AsSpan(0, 8)).ToLowerInvariant()}";
    }
}
