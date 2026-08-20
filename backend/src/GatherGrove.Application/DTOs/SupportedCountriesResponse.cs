using GatherGrove.Application.Configuration;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing supported countries for Stripe Connect
/// </summary>
public class SupportedCountriesResponse
{
    /// <summary>
    /// List of supported countries with their details
    /// </summary>
    public List<CountryInfo> Countries { get; set; } = new();
}

/// <summary>
/// Information about a supported country
/// </summary>
public class CountryInfo
{
    /// <summary>
    /// Two-letter country code (e.g., "US", "CA", "MX")
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Full country name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Whether this country supports application fees with the platform
    /// </summary>
    public bool SupportsApplicationFees { get; set; }
}