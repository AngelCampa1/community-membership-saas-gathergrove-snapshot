using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.Security;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;
using System.Text.Json;

namespace GatherGrove.Application.Services;

public class DataSanitizationService : IDataSanitizationService
{
    private readonly ILogger<DataSanitizationService> _logger;

    public DataSanitizationService(ILogger<DataSanitizationService> logger)
    {
        _logger = logger;
    }

    public async Task<T> SanitizeAsync<T>(T data) where T : class
    {
        var defaultRules = new DataSanitizationRules
        {
            RedactPersonalInfo = true,
            RedactPhoneNumbers = true,
            RedactCreditCardNumbers = true,
            RedactSSN = true
        };

        return await SanitizeAsync(data, defaultRules);
    }

    public async Task<T> SanitizeAsync<T>(T data, DataSanitizationRules rules) where T : class
    {
        try
        {
            if (data == null)
            {
                return default(T)!; // Suppress null warning - caller should handle null input
            }

            _logger.LogDebug("Sanitizing data of type {DataType} with rules: {Rules}",
                typeof(T).Name, JsonSerializer.Serialize(rules));

            // Handle string data directly
            if (data is string stringData)
            {
                var sanitizedString = await SanitizeStringAsync(stringData, rules);
                return (T)(object)sanitizedString;
            }

            // For complex objects, serialize to JSON, sanitize, and deserialize back
            var jsonData = JsonSerializer.Serialize(data);
            var sanitizedJson = await SanitizeStringAsync(jsonData, rules);

            try
            {
                var sanitizedObject = JsonSerializer.Deserialize<T>(sanitizedJson);
                return sanitizedObject ?? data;
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize sanitized JSON, returning sanitized string cast");
                // If deserialization fails, return the sanitized string cast to T
                return (T)(object)sanitizedJson;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sanitizing data of type {DataType}", typeof(T).Name);
            return data; // Return original data if sanitization fails
        }
    }

    public async Task<byte[]> SanitizeFileAsync(byte[] fileData, string fileExtension)
    {
        try
        {
            if (fileData == null || fileData.Length == 0)
            {
                return Array.Empty<byte>();
            }

            _logger.LogDebug("Sanitizing file data of size {FileSize} with extension {FileExtension}",
                fileData.Length, fileExtension);

            // For text-based files, convert to string and sanitize
            var textExtensions = new[] { ".txt", ".csv", ".json", ".xml", ".html", ".htm" };

            if (textExtensions.Contains(fileExtension.ToLower()))
            {
                var text = System.Text.Encoding.UTF8.GetString(fileData);
                var sanitizedText = await SanitizeStringAsync(text, new DataSanitizationRules
                {
                    RedactPersonalInfo = true,
                    RedactPhoneNumbers = true,
                    RedactCreditCardNumbers = true,
                    RedactSSN = true,
                    RedactBankAccountNumbers = true
                });
                return System.Text.Encoding.UTF8.GetBytes(sanitizedText);
            }

            // For binary files, return as-is (could implement binary sanitization later)
            _logger.LogInformation("Binary file sanitization not implemented for extension {Extension}", fileExtension);
            return fileData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sanitizing file data with extension {Extension}", fileExtension);
            return fileData; // Return original data if sanitization fails
        }
    }

    public bool ContainsSensitiveData(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return false;
        }

        try
        {

            // Check for various patterns of sensitive data
            var patterns = new[]
            {
                @"\b\d{3}-\d{2}-\d{4}\b", // SSN
                @"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", // Credit card
                @"\b\d{3}-\d{3}-\d{4}\b", // Phone number
                @"\b\d{8,17}\b", // Bank account number
                @"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", // Email (could be PII in some contexts)
                @"\bpassword\s*[:=]\s*\S+", // Password patterns
                @"\bapi[_-]?key\s*[:=]\s*\S+", // API keys
                @"\bsecret\s*[:=]\s*\S+" // Secret patterns
            };

            foreach (var pattern in patterns)
            {
                if (Regex.IsMatch(content, pattern, RegexOptions.IgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking for sensitive data");
            return true; // Err on the side of caution
        }
    }

    public string RemovePiiData(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return content;
        }

        try
        {
            _logger.LogDebug("Removing PII data from content");

            var sanitized = content;

            // Remove SSN
            sanitized = Regex.Replace(sanitized, @"\b\d{3}-\d{2}-\d{4}\b", "[SSN_REDACTED]");

            // Remove credit card numbers
            sanitized = Regex.Replace(sanitized, @"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "[CARD_REDACTED]");

            // Remove phone numbers
            sanitized = Regex.Replace(sanitized, @"\b\d{3}-\d{3}-\d{4}\b", "[PHONE_REDACTED]");

            // Remove email addresses (in some contexts, emails are PII)
            sanitized = Regex.Replace(sanitized, @"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[EMAIL_REDACTED]");

            // Remove bank account numbers (8-17 digits)
            sanitized = Regex.Replace(sanitized, @"\b\d{8,17}\b", "[ACCOUNT_REDACTED]");

            return sanitized;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing PII data");
            return content; // Return original content if removal fails
        }
    }

    private async Task<string> SanitizeStringAsync(string data, DataSanitizationRules rules)
    {
        var sanitized = data;

        if (rules.RedactSSN)
        {
            sanitized = Regex.Replace(sanitized, @"\b\d{3}-\d{2}-\d{4}\b", "[SSN_REDACTED]");
        }

        if (rules.RedactCreditCardNumbers)
        {
            sanitized = Regex.Replace(sanitized, @"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "[CARD_REDACTED]");
        }

        if (rules.RedactPhoneNumbers)
        {
            sanitized = Regex.Replace(sanitized, @"\b\d{3}-\d{3}-\d{4}\b", "[PHONE_REDACTED]");
            sanitized = Regex.Replace(sanitized, @"\b\(\d{3}\)\s?\d{3}-\d{4}\b", "[PHONE_REDACTED]");
        }

        if (rules.RedactBankAccountNumbers)
        {
            sanitized = Regex.Replace(sanitized, @"\b\d{8,17}\b", "[ACCOUNT_REDACTED]");
        }

        if (rules.RedactPersonalInfo)
        {
            // Remove common PII patterns
            sanitized = Regex.Replace(sanitized, @"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[EMAIL_REDACTED]");
        }

        if (rules.RedactContactInfo)
        {
            // Remove addresses (basic pattern)
            sanitized = Regex.Replace(sanitized, @"\d+\s+[A-Za-z0-9\s,]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b", "[ADDRESS_REDACTED]");
        }

        if (rules.RedactFinancialData)
        {
            // Remove financial amounts
            sanitized = Regex.Replace(sanitized, @"\$[\d,]+\.?\d*", "[AMOUNT_REDACTED]");
        }

        // Security sanitization
        sanitized = await SanitizeSecurityThreatsAsync(sanitized);

        return sanitized;
    }

    private async Task<string> SanitizeSecurityThreatsAsync(string data)
    {
        var sanitized = data;

        // SQL Injection patterns
        var sqlPatterns = new[]
        {
            @"('\s*;\s*DROP\s+TABLE\s+\w+.*?--)",
            @"('\s*;\s*DELETE\s+FROM\s+\w+.*?--)",
            @"('\s*;\s*UPDATE\s+\w+\s+SET.*?--)",
            @"('\s*;\s*INSERT\s+INTO\s+\w+.*?--)",
            @"(\bDROP\s+TABLE\b)",
            @"(\bDELETE\s+FROM\b)",
            @"(\bTRUNCATE\s+TABLE\b)",
            @"(\bEXEC\s*\()",
            @"(\bEXECUTE\s*\()"
        };

        foreach (var pattern in sqlPatterns)
        {
            if (Regex.IsMatch(sanitized, pattern, RegexOptions.IgnoreCase))
            {
                sanitized = Regex.Replace(sanitized, pattern, "[SQL_BLOCKED]", RegexOptions.IgnoreCase);
            }
        }

        // XSS patterns
        var xssPatterns = new[]
        {
            @"(<script[^>]*>.*?</script>)",
            @"(<script[^>]*/>)",
            @"(javascript:)",
            @"(on\w+\s*=)",
            @"(<iframe[^>]*>.*?</iframe>)",
            @"(<object[^>]*>.*?</object>)",
            @"(<embed[^>]*>.*?</embed>)"
        };

        foreach (var pattern in xssPatterns)
        {
            if (Regex.IsMatch(sanitized, pattern, RegexOptions.IgnoreCase))
            {
                sanitized = Regex.Replace(sanitized, pattern, "[XSS_BLOCKED]", RegexOptions.IgnoreCase);
            }
        }

        return await Task.FromResult(sanitized);
    }
}