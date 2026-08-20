using Ganss.Xss;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace GatherGrove.Application.Services.Security;

/// <summary>
/// BUG FIX #22: Server-side content sanitization service
/// Provides HTML and CSS sanitization to prevent XSS attacks
/// Ensures security even if frontend validation is bypassed via direct API calls
/// </summary>
public interface IContentSanitizationService
{
    /// <summary>
    /// Sanitizes HTML content, removing potentially dangerous elements and attributes
    /// </summary>
    string SanitizeHtml(string html, SanitizationLevel level = SanitizationLevel.Standard);

    /// <summary>
    /// Sanitizes CSS content, removing dangerous patterns and expressions
    /// </summary>
    string SanitizeCss(string css);

    /// <summary>
    /// Validates if HTML content is safe without modification
    /// </summary>
    bool IsHtmlSafe(string html);

    /// <summary>
    /// Validates if CSS content is safe without modification
    /// </summary>
    bool IsCssSafe(string css);
}

/// <summary>
/// Sanitization levels for different use cases
/// </summary>
public enum SanitizationLevel
{
    /// <summary>
    /// Strict sanitization - only basic formatting tags allowed
    /// Use for: User comments, feedback, member-generated content
    /// </summary>
    Strict,

    /// <summary>
    /// Standard sanitization - common formatting and structure tags allowed
    /// Use for: Event descriptions, email templates, announcements
    /// </summary>
    Standard,

    /// <summary>
    /// Permissive sanitization - more tags allowed but still secure
    /// Use for: Admin-created content, branded emails, custom pages
    /// </summary>
    Permissive
}

public class ContentSanitizationService : IContentSanitizationService
{
    private readonly ILogger<ContentSanitizationService> _logger;
    private readonly HtmlSanitizer _strictSanitizer;
    private readonly HtmlSanitizer _standardSanitizer;
    private readonly HtmlSanitizer _permissiveSanitizer;

    // Dangerous CSS patterns that should always be removed
    private static readonly Regex[] DangerousCssPatterns = new[]
    {
        new Regex(@"javascript\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"data\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"vbscript\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"expression\s*\(", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"behavior\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"@import", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"binding\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"-moz-binding", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"<\s*script", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"<\s*iframe", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"<\s*object", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"<\s*embed", RegexOptions.IgnoreCase | RegexOptions.Compiled)
    };

    public ContentSanitizationService(ILogger<ContentSanitizationService> logger)
    {
        _logger = logger;

        // Configure Strict Sanitizer - minimal tags only
        _strictSanitizer = new HtmlSanitizer();
        _strictSanitizer.AllowedTags.Clear();
        _strictSanitizer.AllowedTags.Add("p");
        _strictSanitizer.AllowedTags.Add("br");
        _strictSanitizer.AllowedTags.Add("strong");
        _strictSanitizer.AllowedTags.Add("em");
        _strictSanitizer.AllowedTags.Add("b");
        _strictSanitizer.AllowedTags.Add("i");
        _strictSanitizer.AllowedTags.Add("u");

        _strictSanitizer.AllowedAttributes.Clear();
        // No attributes allowed in strict mode

        // Configure Standard Sanitizer - common formatting
        _standardSanitizer = new HtmlSanitizer();
        _standardSanitizer.AllowedTags.Clear();
        _standardSanitizer.AllowedTags.Add("p");
        _standardSanitizer.AllowedTags.Add("br");
        _standardSanitizer.AllowedTags.Add("strong");
        _standardSanitizer.AllowedTags.Add("em");
        _standardSanitizer.AllowedTags.Add("b");
        _standardSanitizer.AllowedTags.Add("i");
        _standardSanitizer.AllowedTags.Add("u");
        _standardSanitizer.AllowedTags.Add("ul");
        _standardSanitizer.AllowedTags.Add("ol");
        _standardSanitizer.AllowedTags.Add("li");
        _standardSanitizer.AllowedTags.Add("h1");
        _standardSanitizer.AllowedTags.Add("h2");
        _standardSanitizer.AllowedTags.Add("h3");
        _standardSanitizer.AllowedTags.Add("h4");
        _standardSanitizer.AllowedTags.Add("h5");
        _standardSanitizer.AllowedTags.Add("h6");
        _standardSanitizer.AllowedTags.Add("a");
        _standardSanitizer.AllowedTags.Add("img");
        _standardSanitizer.AllowedTags.Add("div");
        _standardSanitizer.AllowedTags.Add("span");
        _standardSanitizer.AllowedTags.Add("blockquote");

        _standardSanitizer.AllowedAttributes.Clear();
        _standardSanitizer.AllowedAttributes.Add("href");
        _standardSanitizer.AllowedAttributes.Add("src");
        _standardSanitizer.AllowedAttributes.Add("alt");
        _standardSanitizer.AllowedAttributes.Add("title");
        _standardSanitizer.AllowedAttributes.Add("class");

        _standardSanitizer.AllowedSchemes.Clear();
        _standardSanitizer.AllowedSchemes.Add("http");
        _standardSanitizer.AllowedSchemes.Add("https");
        _standardSanitizer.AllowedSchemes.Add("mailto");

        // Configure Permissive Sanitizer - more tags but still secure
        _permissiveSanitizer = new HtmlSanitizer();
        _permissiveSanitizer.AllowedTags.Clear();

        // Add all standard tags
        foreach (var tag in _standardSanitizer.AllowedTags)
        {
            _permissiveSanitizer.AllowedTags.Add(tag);
        }

        // Add additional tags for permissive mode
        _permissiveSanitizer.AllowedTags.Add("table");
        _permissiveSanitizer.AllowedTags.Add("thead");
        _permissiveSanitizer.AllowedTags.Add("tbody");
        _permissiveSanitizer.AllowedTags.Add("tr");
        _permissiveSanitizer.AllowedTags.Add("td");
        _permissiveSanitizer.AllowedTags.Add("th");
        _permissiveSanitizer.AllowedTags.Add("pre");
        _permissiveSanitizer.AllowedTags.Add("code");
        _permissiveSanitizer.AllowedTags.Add("hr");

        _permissiveSanitizer.AllowedAttributes.Clear();
        _permissiveSanitizer.AllowedAttributes.Add("href");
        _permissiveSanitizer.AllowedAttributes.Add("src");
        _permissiveSanitizer.AllowedAttributes.Add("alt");
        _permissiveSanitizer.AllowedAttributes.Add("title");
        _permissiveSanitizer.AllowedAttributes.Add("class");
        _permissiveSanitizer.AllowedAttributes.Add("id");
        _permissiveSanitizer.AllowedAttributes.Add("style");
        _permissiveSanitizer.AllowedAttributes.Add("colspan");
        _permissiveSanitizer.AllowedAttributes.Add("rowspan");

        _permissiveSanitizer.AllowedSchemes.Clear();
        _permissiveSanitizer.AllowedSchemes.Add("http");
        _permissiveSanitizer.AllowedSchemes.Add("https");
        _permissiveSanitizer.AllowedSchemes.Add("mailto");

        // Block dangerous attributes across all sanitizers
        foreach (var sanitizer in new[] { _strictSanitizer, _standardSanitizer, _permissiveSanitizer })
        {
            sanitizer.AllowedAttributes.Remove("onclick");
            sanitizer.AllowedAttributes.Remove("onload");
            sanitizer.AllowedAttributes.Remove("onerror");
            sanitizer.AllowedAttributes.Remove("onmouseover");
            sanitizer.AllowedAttributes.Remove("onfocus");
            sanitizer.AllowedAttributes.Remove("onblur");
        }
    }

    public string SanitizeHtml(string html, SanitizationLevel level = SanitizationLevel.Standard)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return string.Empty;
        }

        try
        {
            var sanitizer = level switch
            {
                SanitizationLevel.Strict => _strictSanitizer,
                SanitizationLevel.Standard => _standardSanitizer,
                SanitizationLevel.Permissive => _permissiveSanitizer,
                _ => _standardSanitizer
            };

            var sanitized = sanitizer.Sanitize(html);

            // Log if content was modified (potential XSS attempt)
            if (!string.Equals(html, sanitized, StringComparison.Ordinal))
            {
                _logger.LogWarning(
                    "HTML content was sanitized (level: {Level}). Removed potentially dangerous content. " +
                    "Original length: {OriginalLength}, Sanitized length: {SanitizedLength}",
                    level, html.Length, sanitized.Length);
            }

            return sanitized;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sanitizing HTML content. Returning empty string for safety.");
            return string.Empty;
        }
    }

    public string SanitizeCss(string css)
    {
        if (string.IsNullOrWhiteSpace(css))
        {
            return string.Empty;
        }

        try
        {
            var sanitized = css;
            var wasModified = false;

            // Remove dangerous patterns
            foreach (var pattern in DangerousCssPatterns)
            {
                var matches = pattern.Matches(sanitized);
                if (matches.Count > 0)
                {
                    sanitized = pattern.Replace(sanitized, string.Empty);
                    wasModified = true;
                }
            }

            // Remove any @-rules except @media and @keyframes
            sanitized = Regex.Replace(sanitized, @"@(?!media|keyframes)\w+", string.Empty, RegexOptions.IgnoreCase);

            // Remove url() with javascript: or data: schemes
            sanitized = Regex.Replace(sanitized, @"url\s*\(\s*['""]?(javascript|data|vbscript):", "url(", RegexOptions.IgnoreCase);

            if (wasModified)
            {
                _logger.LogWarning(
                    "CSS content was sanitized. Removed potentially dangerous patterns. " +
                    "Original length: {OriginalLength}, Sanitized length: {SanitizedLength}",
                    css.Length, sanitized.Length);
            }

            return sanitized;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sanitizing CSS content. Returning empty string for safety.");
            return string.Empty;
        }
    }

    public bool IsHtmlSafe(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return true;
        }

        try
        {
            var sanitized = SanitizeHtml(html, SanitizationLevel.Standard);
            return string.Equals(html, sanitized, StringComparison.Ordinal);
        }
        catch
        {
            return false;
        }
    }

    public bool IsCssSafe(string css)
    {
        if (string.IsNullOrWhiteSpace(css))
        {
            return true;
        }

        try
        {
            var sanitized = SanitizeCss(css);
            return string.Equals(css, sanitized, StringComparison.Ordinal);
        }
        catch
        {
            return false;
        }
    }
}
