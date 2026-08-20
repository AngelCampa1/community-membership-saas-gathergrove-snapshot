using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace GatherGrove.Application.Validation;

/// <summary>
/// Custom validation attribute for strong password requirements
/// </summary>
public class PasswordRequirementAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is not string password)
        {
            return false;
        }

        // Minimum length of 12 characters
        if (password.Length < 12)
        {
            ErrorMessage = "Password must be at least 12 characters long";
            return false;
        }

        // Maximum length of 128 characters
        if (password.Length > 128)
        {
            ErrorMessage = "Password cannot exceed 128 characters";
            return false;
        }

        // Must contain at least one uppercase letter
        if (!Regex.IsMatch(password, @"[A-Z]"))
        {
            ErrorMessage = "Password must contain at least one uppercase letter";
            return false;
        }

        // Must contain at least one lowercase letter
        if (!Regex.IsMatch(password, @"[a-z]"))
        {
            ErrorMessage = "Password must contain at least one lowercase letter";
            return false;
        }

        // Must contain at least one digit
        if (!Regex.IsMatch(password, @"[0-9]"))
        {
            ErrorMessage = "Password must contain at least one number";
            return false;
        }

        // Must contain at least one special character
        if (!Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]"))
        {
            ErrorMessage = "Password must contain at least one special character";
            return false;
        }

        // Check against common weak passwords
        if (IsCommonPassword(password))
        {
            ErrorMessage = "Password is too common. Please choose a more secure password";
            return false;
        }

        return true;
    }

    private static bool IsCommonPassword(string password)
    {
        // List of common weak passwords (in production, use a comprehensive dictionary)
        var commonPasswords = new[]
        {
            "password123!", "Password123!", "123456789!", "qwerty123!",
            "admin123456!", "welcome123!", "letmein123!", "password1!",
            "123456789abc!", "password@123", "admin@123456", "welcome@123"
        };

        return commonPasswords.Contains(password, StringComparer.OrdinalIgnoreCase);
    }
}