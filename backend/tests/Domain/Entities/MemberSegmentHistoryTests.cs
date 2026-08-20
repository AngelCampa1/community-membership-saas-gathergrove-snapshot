using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class MemberSegmentHistoryTests
{
    #region Default Value Tests (2 tests)

    [Test]
    public void Action_DefaultsToEmptyString()
    {
        var history = new MemberSegmentHistory();
        Assert.That(history.Action, Is.EqualTo(string.Empty));
    }

    [Test]
    public void ChangedAt_DefaultsToUtcNow()
    {
        var beforeCreation = DateTime.UtcNow.AddSeconds(-1);
        var history = new MemberSegmentHistory();
        var afterCreation = DateTime.UtcNow.AddSeconds(1);

        Assert.That(history.ChangedAt, Is.GreaterThan(beforeCreation));
        Assert.That(history.ChangedAt, Is.LessThan(afterCreation));
    }

    #endregion

    #region Basic Properties Tests (4 tests)

    [Test]
    public void MemberId_CanBeSet()
    {
        var history = new MemberSegmentHistory { MemberId = 100 };
        Assert.That(history.MemberId, Is.EqualTo(100));
    }

    [Test]
    public void SegmentId_CanBeSet()
    {
        var history = new MemberSegmentHistory { SegmentId = 10 };
        Assert.That(history.SegmentId, Is.EqualTo(10));
    }

    [Test]
    public void ChangedByUserId_CanBeSet()
    {
        var history = new MemberSegmentHistory { ChangedByUserId = 25 };
        Assert.That(history.ChangedByUserId, Is.EqualTo(25));
    }

    [Test]
    public void HistoryEntry_TracksAllFields()
    {
        var history = new MemberSegmentHistory
        {
            MemberId = 200,
            SegmentId = 5,
            Action = "Added",
            ChangedAt = DateTime.UtcNow,
            ChangedByUserId = 15
        };

        Assert.That(history.MemberId, Is.EqualTo(200));
        Assert.That(history.SegmentId, Is.EqualTo(5));
        Assert.That(history.Action, Is.EqualTo("Added"));
        Assert.That(history.ChangedByUserId, Is.EqualTo(15));
    }

    #endregion

    #region Action Type Tests (3 tests)

    [Test]
    public void Action_CanBeAdded()
    {
        var history = new MemberSegmentHistory { Action = "Added" };
        Assert.That(history.Action, Is.EqualTo("Added"));
    }

    [Test]
    public void Action_CanBeRemoved()
    {
        var history = new MemberSegmentHistory { Action = "Removed" };
        Assert.That(history.Action, Is.EqualTo("Removed"));
    }

    [Test]
    public void Action_CanBeRecalculated()
    {
        var history = new MemberSegmentHistory { Action = "Recalculated" };
        Assert.That(history.Action, Is.EqualTo("Recalculated"));
    }

    #endregion

    #region Reason Tracking Tests (3 tests)

    [Test]
    public void Reason_CanBeSet()
    {
        var history = new MemberSegmentHistory { Reason = "Engagement score threshold met" };
        Assert.That(history.Reason, Is.EqualTo("Engagement score threshold met"));
    }

    [Test]
    public void Reason_CanBeNull()
    {
        var history = new MemberSegmentHistory { Reason = null };
        Assert.That(history.Reason, Is.Null);
    }

    [Test]
    public void Reason_ExplainsChange()
    {
        var history = new MemberSegmentHistory
        {
            Action = "Removed",
            Reason = "Member no longer meets filter criteria"
        };

        Assert.That(history.Action, Is.EqualTo("Removed"));
        Assert.That(history.Reason, Contains.Substring("no longer"));
    }

    #endregion

    #region History Scenarios Tests (5 tests)

    [Test]
    public void ManualAddition_HasChangedByUser()
    {
        var history = new MemberSegmentHistory
        {
            MemberId = 50,
            SegmentId = 3,
            Action = "Added",
            Reason = "Manually added by admin",
            ChangedByUserId = 10
        };

        Assert.That(history.Action, Is.EqualTo("Added"));
        Assert.That(history.ChangedByUserId, Is.Not.Null);
        Assert.That(history.Reason, Contains.Substring("Manually"));
    }

    [Test]
    public void AutomaticRecalculation_NoChangedByUser()
    {
        var history = new MemberSegmentHistory
        {
            MemberId = 75,
            SegmentId = 8,
            Action = "Recalculated",
            Reason = "Automatic daily segment refresh",
            ChangedByUserId = null
        };

        Assert.That(history.Action, Is.EqualTo("Recalculated"));
        Assert.That(history.ChangedByUserId, Is.Null);
        Assert.That(history.Reason, Contains.Substring("Automatic"));
    }

    [Test]
    public void MemberRemoval_TracksReason()
    {
        var history = new MemberSegmentHistory
        {
            Action = "Removed",
            Reason = "Membership expired",
            ChangedAt = DateTime.UtcNow
        };

        Assert.That(history.Action, Is.EqualTo("Removed"));
        Assert.That(history.Reason, Is.EqualTo("Membership expired"));
    }

    [Test]
    public void BulkRecalculation_SameTimestamp()
    {
        var recalcTime = DateTime.UtcNow;
        var history1 = new MemberSegmentHistory { MemberId = 10, Action = "Recalculated", ChangedAt = recalcTime };
        var history2 = new MemberSegmentHistory { MemberId = 20, Action = "Recalculated", ChangedAt = recalcTime };
        var history3 = new MemberSegmentHistory { MemberId = 30, Action = "Recalculated", ChangedAt = recalcTime };

        Assert.That(history1.ChangedAt, Is.EqualTo(history2.ChangedAt));
        Assert.That(history2.ChangedAt, Is.EqualTo(history3.ChangedAt));
    }

    [Test]
    public void AuditTrail_CanShowSequence()
    {
        var addHistory = new MemberSegmentHistory
        {
            MemberId = 100,
            SegmentId = 5,
            Action = "Added",
            ChangedAt = DateTime.UtcNow.AddDays(-30)
        };
        var removeHistory = new MemberSegmentHistory
        {
            MemberId = 100,
            SegmentId = 5,
            Action = "Removed",
            ChangedAt = DateTime.UtcNow.AddDays(-1)
        };

        Assert.That(removeHistory.ChangedAt, Is.GreaterThan(addHistory.ChangedAt));
        Assert.That(addHistory.Action, Is.EqualTo("Added"));
        Assert.That(removeHistory.Action, Is.EqualTo("Removed"));
    }

    #endregion
}
