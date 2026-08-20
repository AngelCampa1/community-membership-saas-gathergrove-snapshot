using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class EventQRCodeTests
{
    #region Default Value Tests (5 tests)

    [Test]
    public void QRCodeType_DefaultsToEventCheckin()
    {
        var qrCode = new EventQRCode();
        Assert.That(qrCode.QRCodeType, Is.EqualTo(QRCodeType.EventCheckin));
    }

    [Test]
    public void AllowMultipleScans_DefaultsToFalse()
    {
        var qrCode = new EventQRCode();
        Assert.That(qrCode.AllowMultipleScans, Is.False);
    }

    [Test]
    public void RequireRSVP_DefaultsToTrue()
    {
        var qrCode = new EventQRCode();
        Assert.That(qrCode.RequireRSVP, Is.True);
    }

    [Test]
    public void IsActive_DefaultsToTrue()
    {
        var qrCode = new EventQRCode();
        Assert.That(qrCode.IsActive, Is.True);
    }

    [Test]
    public void QRCodeToken_DefaultsToEmptyString()
    {
        var qrCode = new EventQRCode();
        Assert.That(qrCode.QRCodeToken, Is.EqualTo(string.Empty));
    }

    #endregion

    #region Expiration Tests (6 tests)

    [Test]
    public void ExpiresAt_CanBeSetToFutureDate()
    {
        var futureDate = DateTime.UtcNow.AddDays(7);
        var qrCode = new EventQRCode { ExpiresAt = futureDate };
        Assert.That(qrCode.ExpiresAt, Is.EqualTo(futureDate));
    }

    [Test]
    public void ExpiresAt_CanBeSetToPastDate()
    {
        var pastDate = DateTime.UtcNow.AddDays(-1);
        var qrCode = new EventQRCode { ExpiresAt = pastDate };
        Assert.That(qrCode.ExpiresAt, Is.EqualTo(pastDate));
    }

    [Test]
    public void ExpiresAt_CanBeSetToCurrentTime()
    {
        var now = DateTime.UtcNow;
        var qrCode = new EventQRCode { ExpiresAt = now };
        Assert.That(qrCode.ExpiresAt, Is.EqualTo(now));
    }

    [Test]
    public void ExpiresAt_SupportsSpecificDateTime()
    {
        var specificDate = new DateTime(2025, 12, 31, 23, 59, 59);
        var qrCode = new EventQRCode { ExpiresAt = specificDate };
        Assert.That(qrCode.ExpiresAt, Is.EqualTo(specificDate));
    }

    [Test]
    public void ExpiresAt_CanBeUpdated()
    {
        var qrCode = new EventQRCode { ExpiresAt = DateTime.UtcNow.AddDays(1) };
        var newExpiry = DateTime.UtcNow.AddDays(7);
        qrCode.ExpiresAt = newExpiry;
        Assert.That(qrCode.ExpiresAt, Is.EqualTo(newExpiry));
    }

    [Test]
    public void ExpiresAt_PreservesMilliseconds()
    {
        var preciseTime = new DateTime(2025, 1, 1, 12, 0, 0, 123);
        var qrCode = new EventQRCode { ExpiresAt = preciseTime };
        Assert.That(qrCode.ExpiresAt.Millisecond, Is.EqualTo(123));
    }

    #endregion

    #region Permission Configuration Tests (6 tests)

    [Test]
    public void AllowMultipleScans_CanBeSetToTrue()
    {
        var qrCode = new EventQRCode { AllowMultipleScans = true };
        Assert.That(qrCode.AllowMultipleScans, Is.True);
    }

    [Test]
    public void AllowMultipleScans_CanBeToggled()
    {
        var qrCode = new EventQRCode { AllowMultipleScans = true };
        qrCode.AllowMultipleScans = false;
        Assert.That(qrCode.AllowMultipleScans, Is.False);
    }

    [Test]
    public void RequireRSVP_CanBeSetToFalse()
    {
        var qrCode = new EventQRCode { RequireRSVP = false };
        Assert.That(qrCode.RequireRSVP, Is.False);
    }

    [Test]
    public void RequireRSVP_CanBeToggled()
    {
        var qrCode = new EventQRCode { RequireRSVP = false };
        qrCode.RequireRSVP = true;
        Assert.That(qrCode.RequireRSVP, Is.True);
    }

    [Test]
    public void IsActive_CanBeSetToFalse()
    {
        var qrCode = new EventQRCode { IsActive = false };
        Assert.That(qrCode.IsActive, Is.False);
    }

    [Test]
    public void IsActive_CanBeToggled()
    {
        var qrCode = new EventQRCode { IsActive = false };
        qrCode.IsActive = true;
        Assert.That(qrCode.IsActive, Is.True);
    }

    #endregion

    #region QRCodeToken Tests (4 tests)

    [Test]
    public void QRCodeToken_CanBeSet()
    {
        var qrCode = new EventQRCode { QRCodeToken = "ABC123XYZ" };
        Assert.That(qrCode.QRCodeToken, Is.EqualTo("ABC123XYZ"));
    }

    [Test]
    public void QRCodeToken_CanBeUpdated()
    {
        var qrCode = new EventQRCode { QRCodeToken = "OLD_TOKEN" };
        qrCode.QRCodeToken = "NEW_TOKEN";
        Assert.That(qrCode.QRCodeToken, Is.EqualTo("NEW_TOKEN"));
    }

    [Test]
    public void QRCodeToken_SupportsLongToken()
    {
        var longToken = new string('A', 100); // Max length
        var qrCode = new EventQRCode { QRCodeToken = longToken };
        Assert.That(qrCode.QRCodeToken, Is.EqualTo(longToken));
        Assert.That(qrCode.QRCodeToken.Length, Is.EqualTo(100));
    }

    [Test]
    public void QRCodeToken_SupportsSpecialCharacters()
    {
        var token = "QR-2025_ABC/123+XYZ=";
        var qrCode = new EventQRCode { QRCodeToken = token };
        Assert.That(qrCode.QRCodeToken, Is.EqualTo(token));
    }

    #endregion

    #region QRCodeType Tests (4 tests)

    [Test]
    public void QRCodeType_CanBeSetToMembershipCard()
    {
        var qrCode = new EventQRCode { QRCodeType = QRCodeType.MembershipCard };
        Assert.That(qrCode.QRCodeType, Is.EqualTo(QRCodeType.MembershipCard));
    }

    [Test]
    public void QRCodeType_CanBeSetToTicketValidation()
    {
        var qrCode = new EventQRCode { QRCodeType = QRCodeType.TicketValidation };
        Assert.That(qrCode.QRCodeType, Is.EqualTo(QRCodeType.TicketValidation));
    }

    [Test]
    public void QRCodeType_CanBeSetToAccessControl()
    {
        var qrCode = new EventQRCode { QRCodeType = QRCodeType.AccessControl };
        Assert.That(qrCode.QRCodeType, Is.EqualTo(QRCodeType.AccessControl));
    }

    [Test]
    public void QRCodeType_CanBeChanged()
    {
        var qrCode = new EventQRCode { QRCodeType = QRCodeType.EventCheckin };
        qrCode.QRCodeType = QRCodeType.TicketValidation;
        Assert.That(qrCode.QRCodeType, Is.EqualTo(QRCodeType.TicketValidation));
    }

    #endregion
}
