using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class SegmentMemberTests
{
    #region Basic Assignment Tests (5 tests)

    [Test]
    public void MemberId_CanBeSet()
    {
        var segmentMember = new SegmentMember { MemberId = 100 };
        Assert.That(segmentMember.MemberId, Is.EqualTo(100));
    }

    [Test]
    public void SegmentId_CanBeSet()
    {
        var segmentMember = new SegmentMember { SegmentId = 50 };
        Assert.That(segmentMember.SegmentId, Is.EqualTo(50));
    }

    [Test]
    public void AddedBy_CanBeSet()
    {
        var segmentMember = new SegmentMember { AddedBy = 25 };
        Assert.That(segmentMember.AddedBy, Is.EqualTo(25));
    }

    [Test]
    public void AddedBy_CanBeNull()
    {
        var segmentMember = new SegmentMember { AddedBy = null };
        Assert.That(segmentMember.AddedBy, Is.Null);
    }

    [Test]
    public void MemberSegmentAssignment_TracksAllFields()
    {
        var segmentMember = new SegmentMember
        {
            MemberId = 200,
            SegmentId = 10,
            AddedAt = DateTime.UtcNow,
            AddedBy = 5
        };

        Assert.That(segmentMember.MemberId, Is.EqualTo(200));
        Assert.That(segmentMember.SegmentId, Is.EqualTo(10));
        Assert.That(segmentMember.AddedBy, Is.EqualTo(5));
        Assert.That(segmentMember.AddedAt, Is.Not.EqualTo(default(DateTime)));
    }

    #endregion

    #region Timestamp Tests (3 tests)

    [Test]
    public void AddedAt_DefaultsToUtcNow()
    {
        var beforeCreation = DateTime.UtcNow.AddSeconds(-1);
        var segmentMember = new SegmentMember();
        var afterCreation = DateTime.UtcNow.AddSeconds(1);

        Assert.That(segmentMember.AddedAt, Is.GreaterThan(beforeCreation));
        Assert.That(segmentMember.AddedAt, Is.LessThan(afterCreation));
    }

    [Test]
    public void AddedAt_CanBeSet()
    {
        var addedTime = DateTime.UtcNow.AddDays(-30);
        var segmentMember = new SegmentMember { AddedAt = addedTime };
        Assert.That(segmentMember.AddedAt, Is.EqualTo(addedTime));
    }

    [Test]
    public void AddedAt_CanBeInPast()
    {
        var segmentMember = new SegmentMember
        {
            AddedAt = DateTime.UtcNow.AddDays(-60)
        };

        Assert.That(segmentMember.AddedAt, Is.LessThan(DateTime.UtcNow));
    }

    #endregion

    #region Assignment Scenarios Tests (4 tests)

    [Test]
    public void ManualAddition_HasAddedByUser()
    {
        var segmentMember = new SegmentMember
        {
            MemberId = 50,
            SegmentId = 3,
            AddedBy = 10,
            AddedAt = DateTime.UtcNow
        };

        Assert.That(segmentMember.AddedBy, Is.Not.Null);
        Assert.That(segmentMember.AddedBy, Is.EqualTo(10));
    }

    [Test]
    public void AutomaticAddition_NoAddedByUser()
    {
        var segmentMember = new SegmentMember
        {
            MemberId = 75,
            SegmentId = 8,
            AddedBy = null,
            AddedAt = DateTime.UtcNow
        };

        Assert.That(segmentMember.AddedBy, Is.Null);
    }

    [Test]
    public void MultipleMembersCanBeAssignedToSegment()
    {
        var member1 = new SegmentMember { SegmentId = 1, MemberId = 10 };
        var member2 = new SegmentMember { SegmentId = 1, MemberId = 20 };
        var member3 = new SegmentMember { SegmentId = 1, MemberId = 30 };

        Assert.That(member1.SegmentId, Is.EqualTo(member2.SegmentId));
        Assert.That(member2.SegmentId, Is.EqualTo(member3.SegmentId));
        Assert.That(member1.MemberId, Is.Not.EqualTo(member2.MemberId));
    }

    [Test]
    public void BulkAssignment_SameTimestamp()
    {
        var assignmentTime = DateTime.UtcNow;
        var member1 = new SegmentMember { SegmentId = 5, MemberId = 10, AddedAt = assignmentTime };
        var member2 = new SegmentMember { SegmentId = 5, MemberId = 20, AddedAt = assignmentTime };
        var member3 = new SegmentMember { SegmentId = 5, MemberId = 30, AddedAt = assignmentTime };

        Assert.That(member1.AddedAt, Is.EqualTo(member2.AddedAt));
        Assert.That(member2.AddedAt, Is.EqualTo(member3.AddedAt));
    }

    #endregion
}
