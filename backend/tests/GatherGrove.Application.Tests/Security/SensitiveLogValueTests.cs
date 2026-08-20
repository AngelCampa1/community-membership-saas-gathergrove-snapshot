using GatherGrove.Application.Security;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Security;

[TestFixture]
public class SensitiveLogValueTests
{
    [Test]
    public void Fingerprint_WithSensitiveToken_DoesNotExposeRawToken()
    {
        // Arrange
        const string token = "raw-token-value-that-must-not-reach-logs";

        // Act
        var fingerprint = SensitiveLogValue.Fingerprint(token);

        // Assert
        Assert.That(fingerprint, Does.StartWith("sha256:"));
        Assert.That(fingerprint, Does.Not.Contain(token));
        Assert.That(fingerprint, Does.Not.Contain("raw-token-value"));
    }

    [Test]
    public void Fingerprint_WithSameToken_ReturnsStableValue()
    {
        // Arrange
        const string token = "stable-token";

        // Act
        var first = SensitiveLogValue.Fingerprint(token);
        var second = SensitiveLogValue.Fingerprint(token);

        // Assert
        Assert.That(first, Is.EqualTo(second));
    }
}
