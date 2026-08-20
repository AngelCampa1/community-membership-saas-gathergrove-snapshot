using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class ErrorLogTests
{
    #region Default Value Tests (3 tests)

    [Test]
    public void Message_DefaultsToEmptyString()
    {
        var errorLog = new ErrorLog();
        Assert.That(errorLog.Message, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Source_DefaultsToEmptyString()
    {
        var errorLog = new ErrorLog();
        Assert.That(errorLog.Source, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Level_DefaultsToError()
    {
        var errorLog = new ErrorLog();
        Assert.That(errorLog.Level, Is.EqualTo("Error"));
    }

    #endregion

    #region Timestamp Tests (2 tests)

    [Test]
    public void CreatedAt_DefaultsToUtcNow()
    {
        var beforeCreation = DateTime.UtcNow.AddSeconds(-1);
        var errorLog = new ErrorLog();
        var afterCreation = DateTime.UtcNow.AddSeconds(1);

        Assert.That(errorLog.CreatedAt, Is.GreaterThan(beforeCreation));
        Assert.That(errorLog.CreatedAt, Is.LessThan(afterCreation));
    }

    [Test]
    public void CreatedAt_CanBeSet()
    {
        var timestamp = DateTime.UtcNow.AddHours(-1);
        var errorLog = new ErrorLog { CreatedAt = timestamp };
        Assert.That(errorLog.CreatedAt, Is.EqualTo(timestamp));
    }

    #endregion

    #region Error Level Tests (4 tests)

    [Test]
    public void Level_CanBeWarning()
    {
        var errorLog = new ErrorLog { Level = "Warning" };
        Assert.That(errorLog.Level, Is.EqualTo("Warning"));
    }

    [Test]
    public void Level_CanBeInfo()
    {
        var errorLog = new ErrorLog { Level = "Info" };
        Assert.That(errorLog.Level, Is.EqualTo("Info"));
    }

    [Test]
    public void Level_CanBeCritical()
    {
        var errorLog = new ErrorLog { Level = "Critical" };
        Assert.That(errorLog.Level, Is.EqualTo("Critical"));
    }

    [Test]
    public void DifferentLevels_CanBeDifferentiated()
    {
        var infoLog = new ErrorLog { Level = "Info" };
        var warningLog = new ErrorLog { Level = "Warning" };
        var errorLog = new ErrorLog { Level = "Error" };
        var criticalLog = new ErrorLog { Level = "Critical" };

        Assert.That(infoLog.Level, Is.Not.EqualTo(errorLog.Level));
        Assert.That(warningLog.Level, Is.Not.EqualTo(criticalLog.Level));
    }

    #endregion

    #region Error Details Tests (4 tests)

    [Test]
    public void Message_CanBeSet()
    {
        var errorLog = new ErrorLog { Message = "Null reference exception occurred" };
        Assert.That(errorLog.Message, Is.EqualTo("Null reference exception occurred"));
    }

    [Test]
    public void StackTrace_CanBeSet()
    {
        var errorLog = new ErrorLog { StackTrace = "at MyClass.MyMethod() in file.cs:line 42" };
        Assert.That(errorLog.StackTrace, Contains.Substring("line 42"));
    }

    [Test]
    public void StackTrace_CanBeNull()
    {
        var errorLog = new ErrorLog { StackTrace = null };
        Assert.That(errorLog.StackTrace, Is.Null);
    }

    [Test]
    public void Source_IdentifiesOrigin()
    {
        var errorLog = new ErrorLog { Source = "MemberService" };
        Assert.That(errorLog.Source, Is.EqualTo("MemberService"));
    }

    #endregion

    #region HTTP Request Context Tests (4 tests)

    [Test]
    public void RequestMethod_CanBeSet()
    {
        var errorLog = new ErrorLog { RequestMethod = "POST" };
        Assert.That(errorLog.RequestMethod, Is.EqualTo("POST"));
    }

    [Test]
    public void RequestPath_CanBeSet()
    {
        var errorLog = new ErrorLog { RequestPath = "/api/v1/members" };
        Assert.That(errorLog.RequestPath, Is.EqualTo("/api/v1/members"));
    }

    [Test]
    public void IpAddress_CanBeSet()
    {
        var errorLog = new ErrorLog { IpAddress = "192.168.1.100" };
        Assert.That(errorLog.IpAddress, Is.EqualTo("192.168.1.100"));
    }

    [Test]
    public void UserAgent_CanBeSet()
    {
        var errorLog = new ErrorLog { UserAgent = "Mozilla/5.0" };
        Assert.That(errorLog.UserAgent, Is.EqualTo("Mozilla/5.0"));
    }

    #endregion

    #region User and Club Context Tests (3 tests)

    [Test]
    public void UserId_CanBeSet()
    {
        var errorLog = new ErrorLog { UserId = "user_12345" };
        Assert.That(errorLog.UserId, Is.EqualTo("user_12345"));
    }

    [Test]
    public void ClubId_CanBeSet()
    {
        var errorLog = new ErrorLog { ClubId = 10 };
        Assert.That(errorLog.ClubId, Is.EqualTo(10));
    }

    [Test]
    public void ClubId_CanBeNull()
    {
        var errorLog = new ErrorLog { ClubId = null };
        Assert.That(errorLog.ClubId, Is.Null);
    }

    #endregion

    #region Additional Data Tests (2 tests)

    [Test]
    public void AdditionalData_CanBeSet()
    {
        var errorLog = new ErrorLog { AdditionalData = "{\"context\":\"payment_processing\"}" };
        Assert.That(errorLog.AdditionalData, Contains.Substring("payment_processing"));
    }

    [Test]
    public void AdditionalData_CanBeNull()
    {
        var errorLog = new ErrorLog { AdditionalData = null };
        Assert.That(errorLog.AdditionalData, Is.Null);
    }

    #endregion

    #region Complete Error Scenarios Tests (3 tests)

    [Test]
    public void APIError_TracksFullContext()
    {
        var errorLog = new ErrorLog
        {
            Message = "Database connection timeout",
            Source = "MemberRepository",
            Level = "Error",
            RequestMethod = "GET",
            RequestPath = "/api/v1/members/123",
            IpAddress = "10.0.1.50",
            UserId = "user_456",
            ClubId = 5,
            CreatedAt = DateTime.UtcNow
        };

        Assert.That(errorLog.Level, Is.EqualTo("Error"));
        Assert.That(errorLog.Source, Is.EqualTo("MemberRepository"));
        Assert.That(errorLog.RequestPath, Contains.Substring("/api/v1/members"));
    }

    [Test]
    public void CriticalSystemError_HasStackTrace()
    {
        var errorLog = new ErrorLog
        {
            Message = "Unhandled exception in payment processor",
            Level = "Critical",
            Source = "PaymentService",
            StackTrace = "at PaymentService.ProcessPayment() in PaymentService.cs:line 156\nat EventsController.RegisterForEvent() in EventsController.cs:line 89"
        };

        Assert.That(errorLog.Level, Is.EqualTo("Critical"));
        Assert.That(errorLog.StackTrace, Contains.Substring("PaymentService.cs:line 156"));
    }

    [Test]
    public void WarningLog_CanHaveMinimalInfo()
    {
        var errorLog = new ErrorLog
        {
            Message = "Rate limit approaching",
            Level = "Warning",
            Source = "RateLimitMiddleware"
        };

        Assert.That(errorLog.Level, Is.EqualTo("Warning"));
        Assert.That(errorLog.StackTrace, Is.Null);
    }

    #endregion
}
