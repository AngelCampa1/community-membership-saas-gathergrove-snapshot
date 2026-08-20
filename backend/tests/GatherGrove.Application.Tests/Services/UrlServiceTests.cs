using GatherGrove.Application.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class UrlServiceTests
{
    private ILogger<UrlService> _logger = null!;

    [SetUp]
    public void SetUp()
    {
        _logger = NullLogger<UrlService>.Instance;
    }

    private IConfiguration CreateConfiguration(string? frontendUrl = null, string? apiUrl = null)
    {
        var configData = new Dictionary<string, string?>();

        if (frontendUrl != null)
            configData["App:FrontendUrl"] = frontendUrl;

        if (apiUrl != null)
            configData["App:ApiUrl"] = apiUrl;

        return new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();
    }

    #region Constructor Tests

    [Test]
    public void Constructor_WithValidConfiguration_InitializesCorrectly()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com", "https://api.example.com");

        // Act
        var service = new UrlService(config, _logger);

        // Assert
        Assert.That(service.GetFrontendBaseUrl(), Is.EqualTo("https://example.com"));
        Assert.That(service.GetApiBaseUrl(), Is.EqualTo("https://api.example.com"));
    }

    [Test]
    public void Constructor_WithTrailingSlash_TrimsSlash()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com/", "https://api.example.com/");

        // Act
        var service = new UrlService(config, _logger);

        // Assert
        Assert.That(service.GetFrontendBaseUrl(), Is.EqualTo("https://example.com"));
        Assert.That(service.GetApiBaseUrl(), Is.EqualTo("https://api.example.com"));
    }

    [Test]
    public void Constructor_WithMissingConfiguration_UsesDefaults()
    {
        // Arrange
        var config = CreateConfiguration(); // No URLs configured

        // Act
        var service = new UrlService(config, _logger);

        // Assert
        Assert.That(service.GetFrontendBaseUrl(), Is.EqualTo("http://localhost:3000"));
        Assert.That(service.GetApiBaseUrl(), Is.EqualTo("http://localhost:5284"));
    }

    [Test]
    public void Constructor_WithEmptyConfiguration_UsesDefaults()
    {
        // Arrange
        var config = CreateConfiguration("", "");

        // Act
        var service = new UrlService(config, _logger);

        // Assert
        Assert.That(service.GetFrontendBaseUrl(), Is.EqualTo("http://localhost:3000"));
        Assert.That(service.GetApiBaseUrl(), Is.EqualTo("http://localhost:5284"));
    }

    #endregion

    #region GetFrontendBaseUrl Tests

    [Test]
    public void GetFrontendBaseUrl_ReturnsConfiguredUrl()
    {
        // Arrange
        var config = CreateConfiguration("https://myapp.com");
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GetFrontendBaseUrl();

        // Assert
        Assert.That(result, Is.EqualTo("https://myapp.com"));
    }

    #endregion

    #region GetApiBaseUrl Tests

    [Test]
    public void GetApiBaseUrl_ReturnsConfiguredUrl()
    {
        // Arrange
        var config = CreateConfiguration(apiUrl: "https://api.myapp.com");
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GetApiBaseUrl();

        // Assert
        Assert.That(result, Is.EqualTo("https://api.myapp.com"));
    }

    #endregion

    #region GenerateJoinUrl Tests

    [Test]
    public void GenerateJoinUrl_WithValidCode_ReturnsCorrectUrl()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GenerateJoinUrl("ABC123");

        // Assert
        Assert.That(result, Is.EqualTo("https://example.com/join/ABC123"));
    }

    [Test]
    public void GenerateJoinUrl_WithNullCode_ThrowsArgumentException()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => service.GenerateJoinUrl(null!));
        Assert.That(ex!.ParamName, Is.EqualTo("inviteCode"));
    }

    [Test]
    public void GenerateJoinUrl_WithEmptyCode_ThrowsArgumentException()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => service.GenerateJoinUrl(""));
        Assert.That(ex!.ParamName, Is.EqualTo("inviteCode"));
    }

    [Test]
    public void GenerateJoinUrl_WithSpecialCharacters_EncodesCorrectly()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GenerateJoinUrl("CODE-123_ABC");

        // Assert
        Assert.That(result, Is.EqualTo("https://example.com/join/CODE-123_ABC"));
    }

    #endregion

    #region GeneratePaymentUrl Tests

    [Test]
    public void GeneratePaymentUrl_WithValidToken_ReturnsCorrectUrl()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GeneratePaymentUrl("pay_token_123");

        // Assert
        Assert.That(result, Is.EqualTo("https://example.com/payment/pay_token_123"));
    }

    [Test]
    public void GeneratePaymentUrl_WithNullToken_ThrowsArgumentException()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => service.GeneratePaymentUrl(null!));
        Assert.That(ex!.ParamName, Is.EqualTo("paymentToken"));
    }

    [Test]
    public void GeneratePaymentUrl_WithEmptyToken_ThrowsArgumentException()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => service.GeneratePaymentUrl(""));
        Assert.That(ex!.ParamName, Is.EqualTo("paymentToken"));
    }

    #endregion

    #region GenerateActivationUrl Tests

    [Test]
    public void GenerateActivationUrl_WithValidToken_ReturnsCorrectUrl()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GenerateActivationUrl("activation_token_xyz");

        // Assert
        Assert.That(result, Is.EqualTo("https://example.com/activate-account?token=activation_token_xyz"));
    }

    [Test]
    public void GenerateActivationUrl_WithNullToken_ThrowsArgumentException()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => service.GenerateActivationUrl(null!));
        Assert.That(ex!.ParamName, Is.EqualTo("activationToken"));
    }

    [Test]
    public void GenerateActivationUrl_WithEmptyToken_ThrowsArgumentException()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => service.GenerateActivationUrl(""));
        Assert.That(ex!.ParamName, Is.EqualTo("activationToken"));
    }

    #endregion

    #region GeneratePasswordResetUrl Tests

    [Test]
    public void GeneratePasswordResetUrl_WithValidToken_ReturnsCorrectUrl()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GeneratePasswordResetUrl("reset_token_123");

        // Assert
        Assert.That(result, Is.EqualTo("https://example.com/reset-password?token=reset_token_123"));
    }

    [Test]
    public void GeneratePasswordResetUrl_WithNullToken_ThrowsArgumentException()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => service.GeneratePasswordResetUrl(null!));
        Assert.That(ex!.ParamName, Is.EqualTo("resetToken"));
    }

    [Test]
    public void GeneratePasswordResetUrl_WithEmptyToken_ThrowsArgumentException()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => service.GeneratePasswordResetUrl(""));
        Assert.That(ex!.ParamName, Is.EqualTo("resetToken"));
    }

    #endregion

    #region GenerateEventRsvpUrl Tests

    [Test]
    public void GenerateEventRsvpUrl_WithValidToken_ReturnsCorrectUrl()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GenerateEventRsvpUrl("rsvp_token_abc");

        // Assert
        Assert.That(result, Is.EqualTo("https://example.com/rsvp/rsvp_token_abc"));
    }

    [Test]
    public void GenerateEventRsvpUrl_WithNullToken_ThrowsArgumentException()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => service.GenerateEventRsvpUrl(null!));
        Assert.That(ex!.ParamName, Is.EqualTo("rsvpToken"));
    }

    [Test]
    public void GenerateEventRsvpUrl_WithEmptyToken_ThrowsArgumentException()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => service.GenerateEventRsvpUrl(""));
        Assert.That(ex!.ParamName, Is.EqualTo("rsvpToken"));
    }

    #endregion

    #region GenerateStripeConnectRefreshUrl Tests

    [Test]
    public void GenerateStripeConnectRefreshUrl_ReturnsCorrectUrl()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GenerateStripeConnectRefreshUrl();

        // Assert
        Assert.That(result, Is.EqualTo("https://example.com/admin/dues?refresh=true"));
    }

    [Test]
    public void GenerateStripeConnectRefreshUrl_WithDefaultUrl_UsesLocalhost()
    {
        // Arrange
        var config = CreateConfiguration();
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GenerateStripeConnectRefreshUrl();

        // Assert
        Assert.That(result, Is.EqualTo("http://localhost:3000/admin/dues?refresh=true"));
    }

    #endregion

    #region GenerateStripeConnectReturnUrl Tests

    [Test]
    public void GenerateStripeConnectReturnUrl_ReturnsCorrectUrl()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com");
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GenerateStripeConnectReturnUrl();

        // Assert
        Assert.That(result, Is.EqualTo("https://example.com/admin/dues?connected=true"));
    }

    [Test]
    public void GenerateStripeConnectReturnUrl_WithDefaultUrl_UsesLocalhost()
    {
        // Arrange
        var config = CreateConfiguration();
        var service = new UrlService(config, _logger);

        // Act
        var result = service.GenerateStripeConnectReturnUrl();

        // Assert
        Assert.That(result, Is.EqualTo("http://localhost:3000/admin/dues?connected=true"));
    }

    #endregion

    #region URL Consistency Tests

    [Test]
    public void AllGeneratedUrls_UseConfiguredFrontendBase()
    {
        // Arrange
        var frontendUrl = "https://custom-domain.com";
        var config = CreateConfiguration(frontendUrl);
        var service = new UrlService(config, _logger);

        // Act & Assert
        Assert.Multiple(() =>
        {
            Assert.That(service.GenerateJoinUrl("code"), Does.StartWith(frontendUrl));
            Assert.That(service.GeneratePaymentUrl("token"), Does.StartWith(frontendUrl));
            Assert.That(service.GenerateActivationUrl("token"), Does.StartWith(frontendUrl));
            Assert.That(service.GeneratePasswordResetUrl("token"), Does.StartWith(frontendUrl));
            Assert.That(service.GenerateEventRsvpUrl("token"), Does.StartWith(frontendUrl));
            Assert.That(service.GenerateStripeConnectRefreshUrl(), Does.StartWith(frontendUrl));
            Assert.That(service.GenerateStripeConnectReturnUrl(), Does.StartWith(frontendUrl));
        });
    }

    [Test]
    public void AllGeneratedUrls_DoNotHaveDoubleSlashes()
    {
        // Arrange
        var config = CreateConfiguration("https://example.com/"); // trailing slash
        var service = new UrlService(config, _logger);

        // Act
        var joinUrl = service.GenerateJoinUrl("code");
        var paymentUrl = service.GeneratePaymentUrl("token");
        var activationUrl = service.GenerateActivationUrl("token");
        var resetUrl = service.GeneratePasswordResetUrl("token");
        var rsvpUrl = service.GenerateEventRsvpUrl("token");
        var refreshUrl = service.GenerateStripeConnectRefreshUrl();
        var returnUrl = service.GenerateStripeConnectReturnUrl();

        // Assert - none should have // after the protocol
        Assert.Multiple(() =>
        {
            Assert.That(joinUrl.Replace("https://", ""), Does.Not.Contain("//"));
            Assert.That(paymentUrl.Replace("https://", ""), Does.Not.Contain("//"));
            Assert.That(activationUrl.Replace("https://", ""), Does.Not.Contain("//"));
            Assert.That(resetUrl.Replace("https://", ""), Does.Not.Contain("//"));
            Assert.That(rsvpUrl.Replace("https://", ""), Does.Not.Contain("//"));
            Assert.That(refreshUrl.Replace("https://", ""), Does.Not.Contain("//"));
            Assert.That(returnUrl.Replace("https://", ""), Does.Not.Contain("//"));
        });
    }

    #endregion
}
