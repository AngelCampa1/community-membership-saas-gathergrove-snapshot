using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

public interface IEncryptionService
{
    Task<byte[]> EncryptAsync(byte[] data);
    Task<byte[]> EncryptAsync(byte[] data, string encryptionKey);
    Task<byte[]> EncryptAsync(byte[] data, string encryptionKey, string algorithm);
    Task<byte[]> DecryptAsync(byte[] encryptedData);
    string EncryptString(string plainText);
    string DecryptString(string encryptedText);

    // Additional methods expected by tests
    Task<SecureTokenValidationResult> ValidateSecureDownloadTokenAsync(string token);
    Task<SecureTokenValidationResult> ValidateSecureDownloadTokenAsync(string token, int userId);
    Task<string> GenerateSecureDownloadTokenAsync(int exportId, int userId);
    Task<string> GenerateSecureDownloadTokenAsync(string exportId, int userId);
}