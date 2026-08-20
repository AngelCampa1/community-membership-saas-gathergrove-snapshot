namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Interface for QR code generation
/// </summary>
public interface IQRCodeGenerator
{
    /// <summary>
    /// Generate QR code image as Base64 string
    /// </summary>
    Task<string> GenerateQRCodeImageAsync(string data);

    /// <summary>
    /// Generate QR code image with custom size
    /// </summary>
    Task<string> GenerateQRCodeImageAsync(string data, int width, int height);

    /// <summary>
    /// Generate QR code as byte array
    /// </summary>
    Task<byte[]> GenerateQRCodeBytesAsync(string data);

    /// <summary>
    /// Validate QR code data format
    /// </summary>
    bool ValidateQRCodeData(string data);
}