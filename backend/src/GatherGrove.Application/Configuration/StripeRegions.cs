namespace GatherGrove.Application.Configuration;

/// <summary>
/// Defines Stripe regions and their compatibility for application fees
/// </summary>
public static class StripeRegions
{
    /// <summary>
    /// Countries that support application fees when both platform and connected account are in the same region
    /// </summary>
    public static readonly Dictionary<string, string[]> CompatibleRegions = new()
    {
        // North America region - US platform can use app fees with these countries
        ["US"] = new[] { "US", "CA" },

        // European region - platforms in these countries can use app fees with each other
        ["EU"] = new[] { "AT", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
                         "FR", "GB", "GR", "HR", "HU", "IE", "IT", "LI", "LT", "LU", "LV",
                         "MT", "NL", "NO", "PL", "PT", "RO", "SE", "SI", "SK" },

        // Asia-Pacific region
        ["APAC"] = new[] { "AU", "HK", "JP", "MY", "NZ", "SG" },

        // Other countries that require manual transfers
        ["OTHER"] = new[] { "AE", "BR", "CA", "EG", "GH", "ID", "IN", "KE", "MA", "MX",
                           "NG", "PH", "TH", "TR", "TW", "ZA" }
    };

    /// <summary>
    /// All countries supported by Stripe Connect
    /// </summary>
    public static readonly HashSet<string> SupportedCountries = new()
    {
        // North America
        "US", "CA", "MX",
        
        // Europe
        "AT", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
        "FR", "GB", "GR", "HR", "HU", "IE", "IT", "LI", "LT", "LU", "LV",
        "MT", "NL", "NO", "PL", "PT", "RO", "SE", "SI", "SK",
        
        // Asia-Pacific
        "AU", "HK", "JP", "MY", "NZ", "SG", "ID", "PH", "TH", "TW",
        
        // Middle East & Africa
        "AE", "EG", "GH", "KE", "MA", "NG", "ZA",
        
        // South America
        "BR",
        
        // Other
        "IN", "TR"
    };

    /// <summary>
    /// Checks if application fees are supported between platform and connected account countries
    /// </summary>
    public static bool AreApplicationFeesSupported(string platformCountry, string connectedCountry)
    {
        // Same country always supports application fees
        if (platformCountry == connectedCountry)
            return true;

        // Check US/Canada compatibility
        if ((platformCountry == "US" || platformCountry == "CA") &&
            (connectedCountry == "US" || connectedCountry == "CA"))
            return true;

        // Check European compatibility
        var euCountries = CompatibleRegions["EU"];
        if (euCountries.Contains(platformCountry) && euCountries.Contains(connectedCountry))
            return true;

        // Check APAC compatibility
        var apacCountries = CompatibleRegions["APAC"];
        if (apacCountries.Contains(platformCountry) && apacCountries.Contains(connectedCountry))
            return true;

        // All other combinations require manual transfers
        return false;
    }

    /// <summary>
    /// Gets a user-friendly country name
    /// </summary>
    public static string GetCountryName(string countryCode)
    {
        return countryCode?.ToUpper() switch
        {
            "US" => "United States",
            "CA" => "Canada",
            "MX" => "Mexico",
            "GB" => "United Kingdom",
            "AU" => "Australia",
            "NZ" => "New Zealand",
            "JP" => "Japan",
            "SG" => "Singapore",
            "HK" => "Hong Kong",
            "MY" => "Malaysia",
            "ID" => "Indonesia",
            "PH" => "Philippines",
            "TH" => "Thailand",
            "TW" => "Taiwan",
            "IN" => "India",
            "AE" => "United Arab Emirates",
            "BR" => "Brazil",
            "ZA" => "South Africa",
            "NG" => "Nigeria",
            "KE" => "Kenya",
            "EG" => "Egypt",
            "MA" => "Morocco",
            "GH" => "Ghana",
            "TR" => "Turkey",
            // European countries
            "AT" => "Austria",
            "BE" => "Belgium",
            "BG" => "Bulgaria",
            "CH" => "Switzerland",
            "CY" => "Cyprus",
            "CZ" => "Czech Republic",
            "DE" => "Germany",
            "DK" => "Denmark",
            "EE" => "Estonia",
            "ES" => "Spain",
            "FI" => "Finland",
            "FR" => "France",
            "GR" => "Greece",
            "HR" => "Croatia",
            "HU" => "Hungary",
            "IE" => "Ireland",
            "IT" => "Italy",
            "LI" => "Liechtenstein",
            "LT" => "Lithuania",
            "LU" => "Luxembourg",
            "LV" => "Latvia",
            "MT" => "Malta",
            "NL" => "Netherlands",
            "NO" => "Norway",
            "PL" => "Poland",
            "PT" => "Portugal",
            "RO" => "Romania",
            "SE" => "Sweden",
            "SI" => "Slovenia",
            "SK" => "Slovakia",
            _ => countryCode ?? "Unknown"
        };
    }
}