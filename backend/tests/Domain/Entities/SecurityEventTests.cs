using NUnit.Framework;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace Domain.Tests.Entities;

[TestFixture]
public class SecurityEventTests
{
    #region Default Value Tests (3 tests)

    [Test]
    public void IPAddress_DefaultsToEmptyString()
    {
        var securityEvent = new SecurityEvent();
        Assert.That(securityEvent.IPAddress, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Description_DefaultsToEmptyString()
    {
        var securityEvent = new SecurityEvent();
        Assert.That(securityEvent.Description, Is.EqualTo(string.Empty));
    }

    [Test]
    public void OccurredAt_DefaultsToUtcNow()
    {
        var beforeCreation = DateTime.UtcNow.AddSeconds(-1);
        var securityEvent = new SecurityEvent();
        var afterCreation = DateTime.UtcNow.AddSeconds(1);

        Assert.That(securityEvent.OccurredAt, Is.GreaterThan(beforeCreation));
        Assert.That(securityEvent.OccurredAt, Is.LessThan(afterCreation));
    }

    #endregion

    #region Event Type Tests (6 tests)

    [Test]
    public void EventType_CanBeLogin()
    {
        var securityEvent = new SecurityEvent { EventType = SecurityEventType.Login };
        Assert.That(securityEvent.EventType, Is.EqualTo(SecurityEventType.Login));
    }

    [Test]
    public void EventType_CanBeUnauthorizedAccess()
    {
        var securityEvent = new SecurityEvent { EventType = SecurityEventType.UnauthorizedAccess };
        Assert.That(securityEvent.EventType, Is.EqualTo(SecurityEventType.UnauthorizedAccess));
    }

    [Test]
    public void EventType_CanBeDataExport()
    {
        var securityEvent = new SecurityEvent { EventType = SecurityEventType.DataExport };
        Assert.That(securityEvent.EventType, Is.EqualTo(SecurityEventType.DataExport));
    }

    [Test]
    public void EventType_CanBeSuspiciousActivity()
    {
        var securityEvent = new SecurityEvent { EventType = SecurityEventType.SuspiciousActivity };
        Assert.That(securityEvent.EventType, Is.EqualTo(SecurityEventType.SuspiciousActivity));
    }

    [Test]
    public void EventType_CanBeDataBreach()
    {
        var securityEvent = new SecurityEvent { EventType = SecurityEventType.DataBreach };
        Assert.That(securityEvent.EventType, Is.EqualTo(SecurityEventType.DataBreach));
    }

    [Test]
    public void EventType_CanBeRateLimitExceeded()
    {
        var securityEvent = new SecurityEvent { EventType = SecurityEventType.RateLimitExceeded };
        Assert.That(securityEvent.EventType, Is.EqualTo(SecurityEventType.RateLimitExceeded));
    }

    #endregion

    #region Severity Tests (5 tests)

    [Test]
    public void Severity_CanBeInfo()
    {
        var securityEvent = new SecurityEvent { Severity = SecurityEventSeverity.Info };
        Assert.That(securityEvent.Severity, Is.EqualTo(SecurityEventSeverity.Info));
    }

    [Test]
    public void Severity_CanBeWarning()
    {
        var securityEvent = new SecurityEvent { Severity = SecurityEventSeverity.Warning };
        Assert.That(securityEvent.Severity, Is.EqualTo(SecurityEventSeverity.Warning));
    }

    [Test]
    public void Severity_CanBeHigh()
    {
        var securityEvent = new SecurityEvent { Severity = SecurityEventSeverity.High };
        Assert.That(securityEvent.Severity, Is.EqualTo(SecurityEventSeverity.High));
    }

    [Test]
    public void Severity_CanBeCritical()
    {
        var securityEvent = new SecurityEvent { Severity = SecurityEventSeverity.Critical };
        Assert.That(securityEvent.Severity, Is.EqualTo(SecurityEventSeverity.Critical));
    }

    [Test]
    public void CriticalEvent_HasHighestSeverity()
    {
        var criticalEvent = new SecurityEvent
        {
            EventType = SecurityEventType.DataBreach,
            Severity = SecurityEventSeverity.Critical
        };

        Assert.That(criticalEvent.Severity, Is.EqualTo(SecurityEventSeverity.Critical));
    }

    #endregion

    #region Context Tests (5 tests)

    [Test]
    public void UserId_CanBeSet()
    {
        var securityEvent = new SecurityEvent { UserId = 100 };
        Assert.That(securityEvent.UserId, Is.EqualTo(100));
    }

    [Test]
    public void ClubId_CanBeSet()
    {
        var securityEvent = new SecurityEvent { ClubId = 10 };
        Assert.That(securityEvent.ClubId, Is.EqualTo(10));
    }

    [Test]
    public void UserId_CanBeNull()
    {
        var securityEvent = new SecurityEvent { UserId = null };
        Assert.That(securityEvent.UserId, Is.Null);
    }

    [Test]
    public void IPAddress_CanBeSet()
    {
        var securityEvent = new SecurityEvent { IPAddress = "192.168.1.1" };
        Assert.That(securityEvent.IPAddress, Is.EqualTo("192.168.1.1"));
    }

    [Test]
    public void Description_CanBeSet()
    {
        var securityEvent = new SecurityEvent { Description = "Failed login attempt" };
        Assert.That(securityEvent.Description, Is.EqualTo("Failed login attempt"));
    }

    #endregion

    #region Additional Data Tests (2 tests)

    [Test]
    public void AdditionalData_DefaultsToEmptyDictionary()
    {
        var securityEvent = new SecurityEvent();
        Assert.That(securityEvent.AdditionalData, Is.Not.Null);
        Assert.That(securityEvent.AdditionalData.Count, Is.EqualTo(0));
    }

    [Test]
    public void AdditionalData_CanStoreKeyValuePairs()
    {
        var securityEvent = new SecurityEvent
        {
            AdditionalData = new Dictionary<string, string>
            {
                { "attempt_count", "5" },
                { "username", "test@example.com" }
            }
        };

        Assert.That(securityEvent.AdditionalData.ContainsKey("attempt_count"), Is.True);
        Assert.That(securityEvent.AdditionalData["username"], Is.EqualTo("test@example.com"));
    }

    #endregion

    #region Investigation Tests (5 tests)

    [Test]
    public void IsInvestigated_DefaultsToFalse()
    {
        var securityEvent = new SecurityEvent();
        Assert.That(securityEvent.IsInvestigated, Is.False);
    }

    [Test]
    public void IsInvestigated_CanBeSetToTrue()
    {
        var securityEvent = new SecurityEvent { IsInvestigated = true };
        Assert.That(securityEvent.IsInvestigated, Is.True);
    }

    [Test]
    public void ResolutionNotes_CanBeSet()
    {
        var securityEvent = new SecurityEvent { ResolutionNotes = "False alarm - authorized access" };
        Assert.That(securityEvent.ResolutionNotes, Is.EqualTo("False alarm - authorized access"));
    }

    [Test]
    public void ResolvedAt_CanBeSet()
    {
        var resolvedTime = DateTime.UtcNow;
        var securityEvent = new SecurityEvent { ResolvedAt = resolvedTime };
        Assert.That(securityEvent.ResolvedAt, Is.EqualTo(resolvedTime));
    }

    [Test]
    public void ResolvedEvent_HasAllResolutionFields()
    {
        var securityEvent = new SecurityEvent
        {
            IsInvestigated = true,
            ResolutionNotes = "Investigated and deemed non-threatening",
            ResolvedAt = DateTime.UtcNow
        };

        Assert.That(securityEvent.IsInvestigated, Is.True);
        Assert.That(securityEvent.ResolutionNotes, Is.Not.Null);
        Assert.That(securityEvent.ResolvedAt, Is.Not.Null);
    }

    #endregion

    #region Complete Security Scenarios Tests (5 tests)

    [Test]
    public void FailedLoginAttempt_TracksDetails()
    {
        var securityEvent = new SecurityEvent
        {
            EventType = SecurityEventType.FailedLogin,
            Severity = SecurityEventSeverity.Warning,
            UserId = 100,
            IPAddress = "10.0.1.50",
            Description = "Failed login attempt - incorrect password",
            AdditionalData = new Dictionary<string, string>
            {
                { "attempt_count", "3" },
                { "username", "user@example.com" }
            }
        };

        Assert.That(securityEvent.EventType, Is.EqualTo(SecurityEventType.FailedLogin));
        Assert.That(securityEvent.Severity, Is.EqualTo(SecurityEventSeverity.Warning));
        Assert.That(securityEvent.AdditionalData["attempt_count"], Is.EqualTo("3"));
    }

    [Test]
    public void UnauthorizedDataExport_IsCritical()
    {
        var securityEvent = new SecurityEvent
        {
            EventType = SecurityEventType.UnauthorizedExportAttempt,
            Severity = SecurityEventSeverity.Critical,
            UserId = 50,
            ClubId = 5,
            IPAddress = "192.168.100.10",
            Description = "Attempted export of financial data without permission"
        };

        Assert.That(securityEvent.EventType, Is.EqualTo(SecurityEventType.UnauthorizedExportAttempt));
        Assert.That(securityEvent.Severity, Is.EqualTo(SecurityEventSeverity.Critical));
        Assert.That(securityEvent.Description, Contains.Substring("without permission"));
    }

    [Test]
    public void SuspiciousActivity_PendingInvestigation()
    {
        var securityEvent = new SecurityEvent
        {
            EventType = SecurityEventType.SuspiciousActivity,
            Severity = SecurityEventSeverity.High,
            IPAddress = "unknown",
            Description = "Multiple rapid API requests from new IP",
            IsInvestigated = false
        };

        Assert.That(securityEvent.IsInvestigated, Is.False);
        Assert.That(securityEvent.ResolvedAt, Is.Null);
        Assert.That(securityEvent.Severity, Is.EqualTo(SecurityEventSeverity.High));
    }

    [Test]
    public void RateLimitEvent_HasModereSeverity()
    {
        var securityEvent = new SecurityEvent
        {
            EventType = SecurityEventType.RateLimitExceeded,
            Severity = SecurityEventSeverity.Warning,
            UserId = 75,
            IPAddress = "172.16.0.5",
            Description = "API rate limit exceeded - 100 requests in 1 minute"
        };

        Assert.That(securityEvent.EventType, Is.EqualTo(SecurityEventType.RateLimitExceeded));
        Assert.That(securityEvent.Severity, Is.EqualTo(SecurityEventSeverity.Warning));
    }

    [Test]
    public void SecurityEvent_CanBeResolvedAfterInvestigation()
    {
        var securityEvent = new SecurityEvent
        {
            EventType = SecurityEventType.UnauthorizedAccess,
            Severity = SecurityEventSeverity.High,
            OccurredAt = DateTime.UtcNow.AddHours(-24),
            IsInvestigated = true,
            ResolvedAt = DateTime.UtcNow,
            ResolutionNotes = "User had valid permissions - false positive"
        };

        Assert.That(securityEvent.ResolvedAt, Is.GreaterThan(securityEvent.OccurredAt));
        Assert.That(securityEvent.IsInvestigated, Is.True);
        Assert.That(securityEvent.ResolutionNotes, Contains.Substring("false positive"));
    }

    #endregion
}
