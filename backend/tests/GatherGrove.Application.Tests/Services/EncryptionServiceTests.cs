using GatherGrove.Application.Services;
using GatherGrove.Domain.Enums;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using System.Security.Cryptography;
using System.Text;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class EncryptionServiceTests
{
    private ILogger<EncryptionService> _logger = null!;
    private IMemoryCache _memoryCache = null!;
    private IConfiguration _configuration = null!;
    private EncryptionService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _logger = NullLogger<EncryptionService>.Instance;
        _memoryCache = new MemoryCache(new MemoryCacheOptions());

        // Generate valid AES-256 keys
        var key = new byte[32]; // 256 bits
        var iv = new byte[16];  // 128 bits
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(key);
            rng.GetBytes(iv);
        }

        var configData = new Dictionary<string, string?>
        {
            { "Encryption:MasterKey", Convert.ToBase64String(key) },
            { "Encryption:InitializationVector", Convert.ToBase64String(iv) }
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        _service = new EncryptionService(_logger, _configuration, _memoryCache);
    }

    [TearDown]
    public void TearDown()
    {
        _memoryCache.Dispose();
    }

    #region EncryptAsync and DecryptAsync Tests

    [Test]
    public async Task EncryptAsync_DecryptAsync_RoundTrip_Succeeds()
    {
        // Arrange
        var originalData = Encoding.UTF8.GetBytes("Hello, World!");

        // Act
        var encrypted = await _service.EncryptAsync(originalData);
        var decrypted = await _service.DecryptAsync(encrypted);

        // Assert
        Assert.That(decrypted, Is.EqualTo(originalData));
    }

    [Test]
    public async Task EncryptAsync_ProducesDifferentOutput()
    {
        // Arrange
        var data = Encoding.UTF8.GetBytes("Test Data");

        // Act
        var encrypted = await _service.EncryptAsync(data);

        // Assert
        Assert.That(encrypted, Is.Not.EqualTo(data));
        Assert.That(encrypted.Length, Is.GreaterThan(0));
    }

    [Test]
    public async Task EncryptAsync_SameDataProducesSameOutput()
    {
        // Arrange
        var data = Encoding.UTF8.GetBytes("Consistent Data");

        // Act
        var encrypted1 = await _service.EncryptAsync(data);
        var encrypted2 = await _service.EncryptAsync(data);

        // Assert - Same key and IV should produce same output
        Assert.That(encrypted1, Is.EqualTo(encrypted2));
    }

    [Test]
    public void EncryptAsync_NullData_ThrowsException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentNullException>(async () =>
            await _service.EncryptAsync(null!));
    }

    [Test]
    public void EncryptAsync_EmptyData_ThrowsException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentNullException>(async () =>
            await _service.EncryptAsync(Array.Empty<byte>()));
    }

    [Test]
    public void DecryptAsync_NullData_ThrowsException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentNullException>(async () =>
            await _service.DecryptAsync(null!));
    }

    [Test]
    public void DecryptAsync_EmptyData_ThrowsException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentNullException>(async () =>
            await _service.DecryptAsync(Array.Empty<byte>()));
    }

    [Test]
    public async Task EncryptAsync_WithCustomKey_Works()
    {
        // Arrange
        var data = Encoding.UTF8.GetBytes("Custom Key Test");
        var customKey = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(customKey);
        }
        var keyBase64 = Convert.ToBase64String(customKey);

        // Act
        var encrypted = await _service.EncryptAsync(data, keyBase64);

        // Assert
        Assert.That(encrypted, Is.Not.Null);
        Assert.That(encrypted.Length, Is.GreaterThan(0));
    }

    [Test]
    public async Task EncryptAsync_WithAlgorithm_AES256_Works()
    {
        // Arrange
        var data = Encoding.UTF8.GetBytes("Algorithm Test");
        var key = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(key);
        }
        var keyBase64 = Convert.ToBase64String(key);

        // Act
        var encrypted = await _service.EncryptAsync(data, keyBase64, "AES-256");

        // Assert
        Assert.That(encrypted, Is.Not.Null);
        Assert.That(encrypted.Length, Is.GreaterThan(0));
    }

    [Test]
    public void EncryptAsync_WithUnsupportedAlgorithm_ThrowsException()
    {
        // Arrange
        var data = Encoding.UTF8.GetBytes("Test");
        var key = Convert.ToBase64String(new byte[32]);

        // Act & Assert
        var ex = Assert.ThrowsAsync<NotSupportedException>(async () =>
            await _service.EncryptAsync(data, key, "RSA"));

        Assert.That(ex.Message, Does.Contain("not supported"));
    }

    [Test]
    public async Task EncryptAsync_LargeData_Works()
    {
        // Arrange
        var largeData = new byte[1024 * 100]; // 100KB
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(largeData);
        }

        // Act
        var encrypted = await _service.EncryptAsync(largeData);
        var decrypted = await _service.DecryptAsync(encrypted);

        // Assert
        Assert.That(decrypted, Is.EqualTo(largeData));
    }

    #endregion

    #region EncryptString and DecryptString Tests

    [Test]
    public void EncryptString_DecryptString_RoundTrip_Succeeds()
    {
        // Arrange
        var originalText = "Hello, World!";

        // Act
        var encrypted = _service.EncryptString(originalText);
        var decrypted = _service.DecryptString(encrypted);

        // Assert
        Assert.That(decrypted, Is.EqualTo(originalText));
    }

    [Test]
    public void EncryptString_ProducesBase64Output()
    {
        // Arrange
        var text = "Test String";

        // Act
        var encrypted = _service.EncryptString(text);

        // Assert
        Assert.That(encrypted, Is.Not.Null);
        Assert.DoesNotThrow(() => Convert.FromBase64String(encrypted));
    }

    [Test]
    public void EncryptString_NullInput_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() =>
            _service.EncryptString(null!));
    }

    [Test]
    public void EncryptString_EmptyInput_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() =>
            _service.EncryptString(""));
    }

    [Test]
    public void DecryptString_NullInput_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() =>
            _service.DecryptString(null!));
    }

    [Test]
    public void DecryptString_EmptyInput_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() =>
            _service.DecryptString(""));
    }

    [Test]
    public void EncryptString_UnicodeText_Works()
    {
        // Arrange
        var unicodeText = "Hello 世界 🌍 مرحبا";

        // Act
        var encrypted = _service.EncryptString(unicodeText);
        var decrypted = _service.DecryptString(encrypted);

        // Assert
        Assert.That(decrypted, Is.EqualTo(unicodeText));
    }

    [Test]
    public void EncryptString_LongText_Works()
    {
        // Arrange
        var longText = new string('A', 10000);

        // Act
        var encrypted = _service.EncryptString(longText);
        var decrypted = _service.DecryptString(encrypted);

        // Assert
        Assert.That(decrypted, Is.EqualTo(longText));
    }

    #endregion

    #region GenerateSecureDownloadTokenAsync Tests

    [Test]
    public async Task GenerateSecureDownloadTokenAsync_ReturnsNonEmptyToken()
    {
        // Arrange
        var exportId = 123;
        var userId = 456;

        // Act
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Assert
        Assert.That(token, Is.Not.Null);
        Assert.That(token, Is.Not.Empty);
    }

    [Test]
    public async Task GenerateSecureDownloadTokenAsync_ReturnsUrlSafeToken()
    {
        // Arrange
        var exportId = 123;
        var userId = 456;

        // Act
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Assert - URL-safe characters only
        Assert.That(token, Does.Not.Contain("+"));
        Assert.That(token, Does.Not.Contain("/"));
        Assert.That(token, Does.Not.Contain("="));
    }

    [Test]
    public async Task GenerateSecureDownloadTokenAsync_DifferentCallsProduceDifferentTokens()
    {
        // Arrange
        var exportId = 123;
        var userId = 456;

        // Act
        var token1 = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);
        var token2 = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Assert - Each token should be unique
        Assert.That(token1, Is.Not.EqualTo(token2));
    }

    [Test]
    public async Task GenerateSecureDownloadTokenAsync_WithStringExportId_Works()
    {
        // Arrange
        var exportId = "789";
        var userId = 456;

        // Act
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Assert
        Assert.That(token, Is.Not.Null);
        Assert.That(token, Is.Not.Empty);
    }

    [Test]
    public void GenerateSecureDownloadTokenAsync_InvalidExportId_ThrowsException()
    {
        // Arrange
        var invalidExportId = "not-a-number";
        var userId = 456;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.GenerateSecureDownloadTokenAsync(invalidExportId, userId));

        Assert.That(ex.ParamName, Is.EqualTo("exportId"));
    }

    #endregion

    #region ValidateSecureDownloadTokenAsync Tests

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_ValidToken_ReturnsValid()
    {
        // Arrange
        var exportId = 123;
        var userId = 456;
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Act
        var result = await _service.ValidateSecureDownloadTokenAsync(token);

        // Assert
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.ValidationType, Is.EqualTo(TokenValidationType.Valid));
        Assert.That(result.ExportId, Is.EqualTo(exportId));
        Assert.That(result.UserId, Is.EqualTo(userId));
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_ValidTokenWithCorrectUser_ReturnsValid()
    {
        // Arrange
        var exportId = 123;
        var userId = 456;
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Act
        var result = await _service.ValidateSecureDownloadTokenAsync(token, userId);

        // Assert
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.ValidationType, Is.EqualTo(TokenValidationType.Valid));
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_ValidTokenWithWrongUser_ReturnsInvalid()
    {
        // Arrange
        var exportId = 123;
        var userId = 456;
        var wrongUserId = 999;
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Act
        var result = await _service.ValidateSecureDownloadTokenAsync(token, wrongUserId);

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationType, Is.EqualTo(TokenValidationType.Invalid));
        Assert.That(result.ErrorMessage, Does.Contain("user"));
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_NonExistentToken_ReturnsNotFound()
    {
        // Arrange
        var fakeToken = "non-existent-token";

        // Act
        var result = await _service.ValidateSecureDownloadTokenAsync(fakeToken);

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationType, Is.EqualTo(TokenValidationType.NotFound));
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_NullToken_ReturnsInvalid()
    {
        // Act
        var result = await _service.ValidateSecureDownloadTokenAsync(null!);

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationType, Is.EqualTo(TokenValidationType.Invalid));
        Assert.That(result.ErrorMessage, Does.Contain("null or empty"));
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_EmptyToken_ReturnsInvalid()
    {
        // Act
        var result = await _service.ValidateSecureDownloadTokenAsync("");

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationType, Is.EqualTo(TokenValidationType.Invalid));
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_ReturnsTokenMetadata()
    {
        // Arrange
        var exportId = 123;
        var userId = 456;
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Act
        var result = await _service.ValidateSecureDownloadTokenAsync(token);

        // Assert
        Assert.That(result.TokenMetadata, Is.Not.Null);
        Assert.That(result.TokenMetadata.ContainsKey("ExportId"), Is.True);
        Assert.That(result.TokenMetadata.ContainsKey("UserId"), Is.True);
        Assert.That(result.TokenMetadata.ContainsKey("ExpiresAt"), Is.True);
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_ReturnsExpiresAt()
    {
        // Arrange
        var exportId = 123;
        var userId = 456;
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Act
        var result = await _service.ValidateSecureDownloadTokenAsync(token);

        // Assert
        Assert.That(result.ExpiresAt, Is.Not.Null);
        Assert.That(result.ExpiresAt.Value, Is.GreaterThan(DateTime.UtcNow));
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_ZeroUserId_SkipsUserValidation()
    {
        // Arrange
        var exportId = 123;
        var userId = 456;
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Act - Pass 0 as userId which should skip user validation
        var result = await _service.ValidateSecureDownloadTokenAsync(token, 0);

        // Assert
        Assert.That(result.IsValid, Is.True);
    }

    #endregion

    #region Constructor and Initialization Tests

    [Test]
    public void Constructor_WithValidConfig_Succeeds()
    {
        // Arrange
        var key = new byte[32];
        var iv = new byte[16];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(key);
            rng.GetBytes(iv);
        }

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Encryption:MasterKey", Convert.ToBase64String(key) },
                { "Encryption:InitializationVector", Convert.ToBase64String(iv) }
            })
            .Build();

        // Act & Assert
        Assert.DoesNotThrow(() => new EncryptionService(_logger, config, _memoryCache));
    }

    [Test]
    public void Constructor_WithInvalidKeySize_ThrowsException()
    {
        // Arrange
        var invalidKey = new byte[16]; // Should be 32 bytes
        var iv = new byte[16];

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Encryption:MasterKey", Convert.ToBase64String(invalidKey) },
                { "Encryption:InitializationVector", Convert.ToBase64String(iv) }
            })
            .Build();

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() =>
            new EncryptionService(_logger, config, _memoryCache));

        Assert.That(ex.Message, Does.Contain("32 bytes"));
    }

    [Test]
    public void Constructor_WithInvalidIVSize_ThrowsException()
    {
        // Arrange
        var key = new byte[32];
        var invalidIV = new byte[8]; // Should be 16 bytes

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Encryption:MasterKey", Convert.ToBase64String(key) },
                { "Encryption:InitializationVector", Convert.ToBase64String(invalidIV) }
            })
            .Build();

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() =>
            new EncryptionService(_logger, config, _memoryCache));

        Assert.That(ex.Message, Does.Contain("16 bytes"));
    }

    [Test]
    public void Constructor_WithNoConfig_GeneratesDefaultKeys()
    {
        // Arrange - Empty config (no encryption keys)
        var emptyConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        // Act - Should not throw, will generate default keys
        Assert.DoesNotThrow(() => new EncryptionService(_logger, emptyConfig, _memoryCache));
    }

    #endregion

    #region Additional Edge Case Tests for 95%+ Coverage

    [Test]
    public async Task EncryptAsync_WithAlgorithm_AES_Works()
    {
        // Arrange
        var data = Encoding.UTF8.GetBytes("AES Algorithm Test");
        var key = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(key);
        }
        var keyBase64 = Convert.ToBase64String(key);

        // Act - Test "AES" alias (not just "AES-256")
        var encrypted = await _service.EncryptAsync(data, keyBase64, "AES");

        // Assert
        Assert.That(encrypted, Is.Not.Null);
        Assert.That(encrypted.Length, Is.GreaterThan(0));
    }

    [Test]
    public void DecryptAsync_CorruptedData_ThrowsException()
    {
        // Arrange - Create valid encrypted data then corrupt it
        var data = Encoding.UTF8.GetBytes("Test Data");
        var encrypted = _service.EncryptAsync(data).GetAwaiter().GetResult();

        // Corrupt the data
        encrypted[0] = (byte)~encrypted[0];
        encrypted[encrypted.Length / 2] = (byte)~encrypted[encrypted.Length / 2];

        // Act & Assert - Should throw when trying to decrypt corrupted data
        Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.DecryptAsync(encrypted));
    }

    [Test]
    public void DecryptString_InvalidBase64_ThrowsException()
    {
        // Arrange - Invalid base64 string
        var invalidBase64 = "This is not valid base64!@#$%";

        // Act & Assert
        Assert.Throws<FormatException>(() =>
            _service.DecryptString(invalidBase64));
    }

    [Test]
    public void EncryptAsync_WithInvalidCustomKey_ThrowsException()
    {
        // Arrange
        var data = Encoding.UTF8.GetBytes("Test");
        var invalidKeyBase64 = "not-valid-base64!@#$";

        // Act & Assert
        Assert.ThrowsAsync<FormatException>(async () =>
            await _service.EncryptAsync(data, invalidKeyBase64));
    }

    [Test]
    public async Task EncryptAsync_MultipleCallsWithSameData_ProducesSameResult()
    {
        // Arrange
        var data = Encoding.UTF8.GetBytes("Consistency Test");

        // Act - Multiple encryptions
        var encrypted1 = await _service.EncryptAsync(data);
        var encrypted2 = await _service.EncryptAsync(data);
        var encrypted3 = await _service.EncryptAsync(data);

        // Assert - With same key/IV, should produce identical results
        Assert.That(encrypted1, Is.EqualTo(encrypted2));
        Assert.That(encrypted2, Is.EqualTo(encrypted3));
    }

    [Test]
    public void EncryptString_SpecialCharacters_Works()
    {
        // Arrange
        var specialChars = "!@#$%^&*()_+-={}[]|\\:;\"'<>,.?/~`";

        // Act
        var encrypted = _service.EncryptString(specialChars);
        var decrypted = _service.DecryptString(encrypted);

        // Assert
        Assert.That(decrypted, Is.EqualTo(specialChars));
    }

    [Test]
    public async Task GenerateSecureDownloadTokenAsync_IntOverload_Works()
    {
        // Arrange
        var exportId = int.MaxValue;
        var userId = 999;

        // Act
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Assert
        Assert.That(token, Is.Not.Null);
        Assert.That(token, Is.Not.Empty);

        // Validate the token
        var validation = await _service.ValidateSecureDownloadTokenAsync(token, userId);
        Assert.That(validation.IsValid, Is.True);
        Assert.That(validation.ExportId, Is.EqualTo(exportId));
    }

    [Test]
    public async Task GenerateSecureDownloadTokenAsync_MinimumValues_Works()
    {
        // Arrange
        var exportId = 1;
        var userId = 1;

        // Act
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Assert
        Assert.That(token, Is.Not.Null);
        Assert.That(token, Is.Not.Empty);
    }

    [Test]
    public void GenerateSecureDownloadTokenAsync_EmptyStringExportId_ThrowsException()
    {
        // Arrange
        var emptyExportId = "";
        var userId = 456;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.GenerateSecureDownloadTokenAsync(emptyExportId, userId));

        Assert.That(ex.ParamName, Is.EqualTo("exportId"));
    }

    [Test]
    public async Task GenerateSecureDownloadTokenAsync_NegativeNumberString_Works()
    {
        // Arrange - int.TryParse will successfully parse negative numbers
        var negativeExportId = "-123";
        var userId = 456;

        // Act - Service accepts negative exportIds (no business rule against it)
        var token = await _service.GenerateSecureDownloadTokenAsync(negativeExportId, userId);

        // Assert
        Assert.That(token, Is.Not.Null);
        Assert.That(token, Is.Not.Empty);

        // Validate token works correctly
        var validation = await _service.ValidateSecureDownloadTokenAsync(token, userId);
        Assert.That(validation.IsValid, Is.True);
        Assert.That(validation.ExportId, Is.EqualTo(-123));
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_TokenMetadata_ContainsCorrectExportId()
    {
        // Arrange
        var exportId = 999;
        var userId = 777;
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Act
        var result = await _service.ValidateSecureDownloadTokenAsync(token);

        // Assert
        Assert.That(result.TokenMetadata["ExportId"], Is.EqualTo(exportId.ToString()));
        Assert.That(result.TokenMetadata["UserId"], Is.EqualTo(userId.ToString()));
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_TokenMetadata_ExpiresAtIsISO8601()
    {
        // Arrange
        var exportId = 123;
        var userId = 456;
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Act
        var result = await _service.ValidateSecureDownloadTokenAsync(token);

        // Assert
        var expiresAtString = result.TokenMetadata["ExpiresAt"];
        Assert.That(expiresAtString, Is.Not.Null);
        Assert.DoesNotThrow(() => DateTime.Parse(expiresAtString));
    }

    [Test]
    public async Task ValidateSecureDownloadTokenAsync_NegativeUserId_SkipsUserValidation()
    {
        // Arrange
        var exportId = 123;
        var userId = 456;
        var token = await _service.GenerateSecureDownloadTokenAsync(exportId, userId);

        // Act - Negative userId should skip validation like zero
        var result = await _service.ValidateSecureDownloadTokenAsync(token, -1);

        // Assert
        Assert.That(result.IsValid, Is.True);
    }

    [Test]
    public async Task EncryptString_WhitespaceOnly_Works()
    {
        // Arrange
        var whitespace = "   \t\n\r   ";

        // Act
        var encrypted = _service.EncryptString(whitespace);
        var decrypted = _service.DecryptString(encrypted);

        // Assert
        Assert.That(decrypted, Is.EqualTo(whitespace));
    }

    [Test]
    public async Task EncryptAsync_ZeroBytes_AfterEncryption_ProducesOutput()
    {
        // Arrange
        var zeroBytes = new byte[] { 0, 0, 0, 0, 0 };

        // Act
        var encrypted = await _service.EncryptAsync(zeroBytes);
        var decrypted = await _service.DecryptAsync(encrypted);

        // Assert
        Assert.That(encrypted, Is.Not.Empty);
        Assert.That(decrypted, Is.EqualTo(zeroBytes));
    }

    [Test]
    public async Task EncryptAsync_SingleByte_Works()
    {
        // Arrange
        var singleByte = new byte[] { 42 };

        // Act
        var encrypted = await _service.EncryptAsync(singleByte);
        var decrypted = await _service.DecryptAsync(encrypted);

        // Assert
        Assert.That(decrypted, Is.EqualTo(singleByte));
    }

    [Test]
    public void EncryptString_VeryLongUnicodeText_Works()
    {
        // Arrange - Mix of various Unicode characters
        var unicodeText = string.Join("", Enumerable.Range(0, 1000)
            .Select(i => $"Test{i}世界🌍مرحبا"));

        // Act
        var encrypted = _service.EncryptString(unicodeText);
        var decrypted = _service.DecryptString(encrypted);

        // Assert
        Assert.That(decrypted, Is.EqualTo(unicodeText));
        Assert.That(decrypted.Length, Is.EqualTo(unicodeText.Length));
    }

    [Test]
    public async Task GenerateSecureDownloadTokenAsync_TokenLength_IsConsistent()
    {
        // Arrange & Act - Generate multiple tokens
        var token1 = await _service.GenerateSecureDownloadTokenAsync(1, 1);
        var token2 = await _service.GenerateSecureDownloadTokenAsync(2, 2);
        var token3 = await _service.GenerateSecureDownloadTokenAsync(3, 3);

        // Assert - All tokens should have similar length (base64 of 32 bytes, minus padding)
        Assert.That(token1.Length, Is.GreaterThan(40)); // At least 40 chars
        Assert.That(Math.Abs(token1.Length - token2.Length), Is.LessThanOrEqualTo(2));
        Assert.That(Math.Abs(token2.Length - token3.Length), Is.LessThanOrEqualTo(2));
    }

    #endregion
}
