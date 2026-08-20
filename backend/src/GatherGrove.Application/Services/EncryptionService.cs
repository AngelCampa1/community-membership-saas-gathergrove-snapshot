using System.Security.Cryptography;
using System.Text;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;

namespace GatherGrove.Application.Services;

/// <summary>
/// Encryption service implementation using AES-256 encryption
/// Supports configuration-based keys with future Azure Key Vault integration
/// </summary>
public class EncryptionService : IEncryptionService
{
    private readonly ILogger<EncryptionService> _logger;
    private readonly IConfiguration _configuration;
    private readonly byte[] _defaultKey;
    private readonly byte[] _defaultIV;
    // BUG FIX #13: Replace Dictionary with IMemoryCache to prevent memory leaks
    private readonly IMemoryCache _tokenCache;
    private readonly TimeSpan _tokenExpiration = TimeSpan.FromHours(24);

    public EncryptionService(ILogger<EncryptionService> logger, IConfiguration configuration, IMemoryCache memoryCache)
    {
        _logger = logger;
        _configuration = configuration;
        _tokenCache = memoryCache;

        // Get encryption keys from configuration
        // In production, these should come from Azure Key Vault
        var keyString = _configuration["Encryption:MasterKey"] ?? GenerateDefaultKey();
        var ivString = _configuration["Encryption:InitializationVector"] ?? GenerateDefaultIV();

        _defaultKey = Convert.FromBase64String(keyString);
        _defaultIV = Convert.FromBase64String(ivString);

        // Validate key sizes
        if (_defaultKey.Length != 32) // AES-256 requires 32-byte key
        {
            throw new InvalidOperationException("Encryption key must be 32 bytes (256 bits) for AES-256");
        }

        if (_defaultIV.Length != 16) // AES requires 16-byte IV
        {
            throw new InvalidOperationException("Initialization vector must be 16 bytes (128 bits)");
        }

        _logger.LogInformation("Encryption service initialized with AES-256");
    }

    /// <summary>
    /// Encrypts data using default configured key
    /// </summary>
    public async Task<byte[]> EncryptAsync(byte[] data)
    {
        return await EncryptAsync(data, _defaultKey, _defaultIV);
    }

    /// <summary>
    /// Encrypts data using specified key (base64 encoded)
    /// </summary>
    public async Task<byte[]> EncryptAsync(byte[] data, string encryptionKey)
    {
        var keyBytes = Convert.FromBase64String(encryptionKey);
        return await EncryptAsync(data, keyBytes, _defaultIV);
    }

    /// <summary>
    /// Encrypts data using specified key and algorithm
    /// </summary>
    public async Task<byte[]> EncryptAsync(byte[] data, string encryptionKey, string algorithm)
    {
        // For now, we only support AES-256
        // Future: Add support for other algorithms (RSA, etc.)
        if (algorithm != "AES-256" && algorithm != "AES")
        {
            throw new NotSupportedException($"Algorithm '{algorithm}' is not supported. Only AES-256 is currently supported.");
        }

        return await EncryptAsync(data, encryptionKey);
    }

    /// <summary>
    /// Decrypts data using default configured key
    /// </summary>
    public async Task<byte[]> DecryptAsync(byte[] encryptedData)
    {
        return await DecryptAsync(encryptedData, _defaultKey, _defaultIV);
    }

    /// <summary>
    /// Encrypts a string and returns base64 encoded result
    /// </summary>
    public string EncryptString(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
        {
            throw new ArgumentNullException(nameof(plainText));
        }

        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var encryptedBytes = EncryptAsync(plainBytes).GetAwaiter().GetResult();
        return Convert.ToBase64String(encryptedBytes);
    }

    /// <summary>
    /// Decrypts a base64 encoded encrypted string
    /// </summary>
    public string DecryptString(string encryptedText)
    {
        if (string.IsNullOrEmpty(encryptedText))
        {
            throw new ArgumentNullException(nameof(encryptedText));
        }

        var encryptedBytes = Convert.FromBase64String(encryptedText);
        var decryptedBytes = DecryptAsync(encryptedBytes).GetAwaiter().GetResult();
        return Encoding.UTF8.GetString(decryptedBytes);
    }

    /// <summary>
    /// Generates a secure download token for exports
    /// </summary>
    public async Task<string> GenerateSecureDownloadTokenAsync(int exportId, int userId)
    {
        return await GenerateSecureDownloadTokenAsync(exportId.ToString(), userId);
    }

    /// <summary>
    /// Generates a secure download token for exports
    /// </summary>
    public async Task<string> GenerateSecureDownloadTokenAsync(string exportId, int userId)
    {
        // Generate a cryptographically secure random token
        var tokenBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }

        var token = Convert.ToBase64String(tokenBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");

        // BUG FIX #13: Store token metadata with automatic expiration
        var expiresAt = DateTime.UtcNow.Add(_tokenExpiration);

        // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
        if (!int.TryParse(exportId, out var parsedExportId))
        {
            _logger.LogError("Invalid exportId format: {ExportId}", exportId);
            throw new ArgumentException($"Invalid exportId format: {exportId}", nameof(exportId));
        }
        var tokenData = (ExportId: parsedExportId, UserId: userId, ExpiresAt: expiresAt);

        _tokenCache.Set(token, tokenData, new MemoryCacheEntryOptions
        {
            AbsoluteExpiration = expiresAt
        });

        _logger?.LogDebug("Generated secure download token for export {ExportId}, user {UserId}, expires at {ExpiresAt}",
            exportId, userId, expiresAt);

        return await Task.FromResult(token);
    }

    /// <summary>
    /// Validates a secure download token
    /// </summary>
    public async Task<SecureTokenValidationResult> ValidateSecureDownloadTokenAsync(string token)
    {
        return await ValidateSecureDownloadTokenAsync(token, 0);
    }

    /// <summary>
    /// Validates a secure download token for a specific user
    /// </summary>
    public async Task<SecureTokenValidationResult> ValidateSecureDownloadTokenAsync(string token, int userId)
    {
        if (string.IsNullOrEmpty(token))
        {
            return new SecureTokenValidationResult
            {
                IsValid = false,
                ValidationType = TokenValidationType.Invalid,
                ErrorMessage = "Token is null or empty"
            };
        }

        // BUG FIX #13: Check if token exists in cache (IMemoryCache auto-expires)
        if (!_tokenCache.TryGetValue(token, out (int ExportId, int UserId, DateTime ExpiresAt) tokenData))
        {
            _logger.LogWarning("Token validation failed: Token not found or expired");
            return new SecureTokenValidationResult
            {
                IsValid = false,
                ValidationType = TokenValidationType.NotFound,
                ErrorMessage = "Token not found or has expired"
            };
        }

        // Double-check expiration (IMemoryCache should have already removed it, but be safe)
        if (DateTime.UtcNow > tokenData.ExpiresAt)
        {
            _logger.LogWarning("Token validation failed: Token expired at {ExpiresAt}", tokenData.ExpiresAt);
            _tokenCache.Remove(token); // Ensure removal
            return new SecureTokenValidationResult
            {
                IsValid = false,
                ValidationType = TokenValidationType.Expired,
                ErrorMessage = "Token has expired",
                ExpiresAt = tokenData.ExpiresAt
            };
        }

        // Check if userId matches (if provided)
        if (userId > 0 && tokenData.UserId != userId)
        {
            _logger.LogWarning("Token validation failed: User ID mismatch. Expected {ExpectedUserId}, got {ActualUserId}",
                tokenData.UserId, userId);
            return new SecureTokenValidationResult
            {
                IsValid = false,
                ValidationType = TokenValidationType.Invalid,
                ErrorMessage = "Token does not belong to this user"
            };
        }

        _logger?.LogDebug("Token validated successfully for export {ExportId}, user {UserId}",
            tokenData.ExportId, tokenData.UserId);

        return await Task.FromResult(new SecureTokenValidationResult
        {
            IsValid = true,
            ValidationType = TokenValidationType.Valid,
            ExportId = tokenData.ExportId,
            UserId = tokenData.UserId,
            ExpiresAt = tokenData.ExpiresAt,
            TokenMetadata = new Dictionary<string, string>
            {
                { "ExportId", tokenData.ExportId.ToString() },
                { "UserId", tokenData.UserId.ToString() },
                { "ExpiresAt", tokenData.ExpiresAt.ToString("O") }
            }
        });
    }

    #region Private Helper Methods

    /// <summary>
    /// Encrypts data using AES-256
    /// </summary>
    private async Task<byte[]> EncryptAsync(byte[] data, byte[] key, byte[] iv)
    {
        if (data == null || data.Length == 0)
        {
            throw new ArgumentNullException(nameof(data));
        }

        try
        {
            using var aes = Aes.Create();
            aes.Key = key;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
            using var msEncrypt = new MemoryStream();
            using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
            {
                await csEncrypt.WriteAsync(data, 0, data.Length);
                csEncrypt.FlushFinalBlock();
            }

            return msEncrypt.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Encryption failed");
            throw new InvalidOperationException("Encryption operation failed", ex);
        }
    }

    /// <summary>
    /// Decrypts data using AES-256
    /// </summary>
    private async Task<byte[]> DecryptAsync(byte[] encryptedData, byte[] key, byte[] iv)
    {
        if (encryptedData == null || encryptedData.Length == 0)
        {
            throw new ArgumentNullException(nameof(encryptedData));
        }

        try
        {
            using var aes = Aes.Create();
            aes.Key = key;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var msDecrypt = new MemoryStream(encryptedData);
            using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
            using var resultStream = new MemoryStream();

            await csDecrypt.CopyToAsync(resultStream);
            return resultStream.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Decryption failed");
            throw new InvalidOperationException("Decryption operation failed", ex);
        }
    }

    /// <summary>
    /// Generates a default encryption key for development
    /// IMPORTANT: In production, use Azure Key Vault
    /// </summary>
    private string GenerateDefaultKey()
    {
        _logger.LogWarning("Using auto-generated encryption key. Configure 'Encryption:MasterKey' in production!");

        using var rng = RandomNumberGenerator.Create();
        var keyBytes = new byte[32]; // 256 bits
        rng.GetBytes(keyBytes);
        return Convert.ToBase64String(keyBytes);
    }

    /// <summary>
    /// Generates a default IV for development
    /// IMPORTANT: In production, use Azure Key Vault
    /// </summary>
    private string GenerateDefaultIV()
    {
        _logger.LogWarning("Using auto-generated IV. Configure 'Encryption:InitializationVector' in production!");

        using var rng = RandomNumberGenerator.Create();
        var ivBytes = new byte[16]; // 128 bits
        rng.GetBytes(ivBytes);
        return Convert.ToBase64String(ivBytes);
    }

    #endregion
}
