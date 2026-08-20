using NUnit.Framework;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace Domain.Tests.Entities;

[TestFixture]
public class MemberEngagementAlertTests
{
    #region Default Value Tests (3 tests)

    [Test]
    public void Message_DefaultsToEmptyString()
    {
        var alert = new MemberEngagementAlert();
        Assert.That(alert.Message, Is.EqualTo(string.Empty));
    }

    [Test]
    public void IsResolved_DefaultsToFalse()
    {
        var alert = new MemberEngagementAlert();
        Assert.That(alert.IsResolved, Is.False);
    }

    [Test]
    public void NotificationsSent_DefaultsToFalse()
    {
        var alert = new MemberEngagementAlert();
        Assert.That(alert.NotificationsSent, Is.False);
    }

    #endregion

    #region Score Tracking Tests (4 tests)

    [Test]
    public void TriggerScore_CanBeSet()
    {
        var alert = new MemberEngagementAlert { TriggerScore = 45.5m };
        Assert.That(alert.TriggerScore, Is.EqualTo(45.5m));
    }

    [Test]
    public void PreviousScore_CanBeSet()
    {
        var alert = new MemberEngagementAlert { PreviousScore = 75.0m };
        Assert.That(alert.PreviousScore, Is.EqualTo(75.0m));
    }

    [Test]
    public void ScoreChange_CanBeNegativeForDecline()
    {
        var alert = new MemberEngagementAlert { ScoreChange = -29.5m };
        Assert.That(alert.ScoreChange, Is.EqualTo(-29.5m));
    }

    [Test]
    public void Alert_TracksScoreDecline()
    {
        var alert = new MemberEngagementAlert
        {
            PreviousScore = 80.0m,
            TriggerScore = 50.0m,
            ScoreChange = -30.0m,
            Type = AlertType.ScoreDecline,
            Severity = AlertSeverity.High
        };

        Assert.That(alert.ScoreChange, Is.LessThan(0));
        Assert.That(alert.TriggerScore, Is.LessThan(alert.PreviousScore));
    }

    #endregion

    #region Alert Resolution Tests (5 tests)

    [Test]
    public void Resolve_SetsIsResolvedToTrue()
    {
        var alert = new MemberEngagementAlert();
        alert.Resolve(123);

        Assert.That(alert.IsResolved, Is.True);
    }

    [Test]
    public void Resolve_SetsResolvedAt()
    {
        var alert = new MemberEngagementAlert();
        var beforeResolve = DateTime.UtcNow;
        alert.Resolve(123);
        var afterResolve = DateTime.UtcNow;

        Assert.That(alert.ResolvedAt, Is.Not.Null);
        Assert.That(alert.ResolvedAt, Is.GreaterThanOrEqualTo(beforeResolve));
        Assert.That(alert.ResolvedAt, Is.LessThanOrEqualTo(afterResolve));
    }

    [Test]
    public void Resolve_SetsResolvedByUserId()
    {
        var alert = new MemberEngagementAlert();
        alert.Resolve(456);

        Assert.That(alert.ResolvedByUserId, Is.EqualTo(456));
    }

    [Test]
    public void Resolve_CanIncludeNotes()
    {
        var alert = new MemberEngagementAlert();
        alert.Resolve(789, "Member re-engaged after outreach campaign");

        Assert.That(alert.ResolutionNotes, Is.EqualTo("Member re-engaged after outreach campaign"));
    }

    [Test]
    public void Resolve_WorksWithoutNotes()
    {
        var alert = new MemberEngagementAlert();
        alert.Resolve(101);

        Assert.That(alert.IsResolved, Is.True);
        Assert.That(alert.ResolutionNotes, Is.Null);
    }

    #endregion

    #region Business Logic Method Tests (4 tests)

    [Test]
    public void RequiresImmediateAttention_TrueForHighSeverityUnresolved()
    {
        var alert = new MemberEngagementAlert
        {
            Severity = AlertSeverity.High,
            IsResolved = false
        };

        Assert.That(alert.RequiresImmediateAttention(), Is.True);
    }

    [Test]
    public void RequiresImmediateAttention_FalseForResolvedAlert()
    {
        var alert = new MemberEngagementAlert
        {
            Severity = AlertSeverity.High,
            IsResolved = true
        };

        Assert.That(alert.RequiresImmediateAttention(), Is.False);
    }

    [Test]
    public void RequiresImmediateAttention_FalseForLowSeverity()
    {
        var alert = new MemberEngagementAlert
        {
            Severity = AlertSeverity.Low,
            IsResolved = false
        };

        Assert.That(alert.RequiresImmediateAttention(), Is.False);
    }

    [Test]
    public void GetAlertAge_ReturnsCorrectDaysSinceCreation()
    {
        var alert = new MemberEngagementAlert
        {
            CreatedAt = DateTime.UtcNow.AddDays(-7)
        };

        var age = alert.GetAlertAge();
        Assert.That(age, Is.EqualTo(7).Within(0.01)); // Allow small time variance
    }

    #endregion

    #region Notification Tracking Tests (2 tests)

    [Test]
    public void NotificationsSent_CanBeSetToTrue()
    {
        var alert = new MemberEngagementAlert
        {
            NotificationsSent = true,
            LastNotificationSent = DateTime.UtcNow
        };

        Assert.That(alert.NotificationsSent, Is.True);
        Assert.That(alert.LastNotificationSent, Is.Not.Null);
    }

    [Test]
    public void Alert_TracksNotificationHistory()
    {
        var alert = new MemberEngagementAlert
        {
            NotificationsSent = true,
            LastNotificationSent = DateTime.UtcNow.AddHours(-2)
        };

        Assert.That(alert.NotificationsSent, Is.True);
        Assert.That(alert.LastNotificationSent, Is.LessThan(DateTime.UtcNow));
    }

    #endregion
}
