using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class MemberTagAssignmentTests
{
    #region Basic Assignment Tests (5 tests)

    [Test]
    public void MemberId_CanBeSet()
    {
        var assignment = new MemberTagAssignment { MemberId = 100 };
        Assert.That(assignment.MemberId, Is.EqualTo(100));
    }

    [Test]
    public void TagId_CanBeSet()
    {
        var assignment = new MemberTagAssignment { TagId = 10 };
        Assert.That(assignment.TagId, Is.EqualTo(10));
    }

    [Test]
    public void AssignedByUserId_CanBeSet()
    {
        var assignment = new MemberTagAssignment { AssignedByUserId = 25 };
        Assert.That(assignment.AssignedByUserId, Is.EqualTo(25));
    }

    [Test]
    public void AssignedAt_CanBeSet()
    {
        var assignedTime = DateTime.UtcNow;
        var assignment = new MemberTagAssignment { AssignedAt = assignedTime };
        Assert.That(assignment.AssignedAt, Is.EqualTo(assignedTime));
    }

    [Test]
    public void TagAssignment_TracksAllFields()
    {
        var assignment = new MemberTagAssignment
        {
            MemberId = 200,
            TagId = 5,
            AssignedAt = DateTime.UtcNow,
            AssignedByUserId = 15
        };

        Assert.That(assignment.MemberId, Is.EqualTo(200));
        Assert.That(assignment.TagId, Is.EqualTo(5));
        Assert.That(assignment.AssignedByUserId, Is.EqualTo(15));
        Assert.That(assignment.AssignedAt, Is.Not.EqualTo(default(DateTime)));
    }

    #endregion

    #region Notes Tests (3 tests)

    [Test]
    public void Notes_CanBeSet()
    {
        var assignment = new MemberTagAssignment { Notes = "VIP status granted after renewal" };
        Assert.That(assignment.Notes, Is.EqualTo("VIP status granted after renewal"));
    }

    [Test]
    public void Notes_CanBeNull()
    {
        var assignment = new MemberTagAssignment { Notes = null };
        Assert.That(assignment.Notes, Is.Null);
    }

    [Test]
    public void Notes_CanExplainReason()
    {
        var assignment = new MemberTagAssignment
        {
            TagId = 3,
            Notes = "Assigned due to high engagement score"
        };

        Assert.That(assignment.Notes, Contains.Substring("engagement"));
    }

    #endregion

    #region Assignment Scenarios Tests (3 tests)

    [Test]
    public void ManualAssignment_IncludesAssignedByUserId()
    {
        var assignment = new MemberTagAssignment
        {
            MemberId = 50,
            TagId = 2,
            AssignedByUserId = 10,
            Notes = "Manually tagged as VIP"
        };

        Assert.That(assignment.AssignedByUserId, Is.EqualTo(10));
        Assert.That(assignment.Notes, Is.Not.Null);
    }

    [Test]
    public void MultipleTags_CanBeAssignedToSameMember()
    {
        var vipTag = new MemberTagAssignment { MemberId = 100, TagId = 1 };
        var activeTag = new MemberTagAssignment { MemberId = 100, TagId = 2 };
        var founderTag = new MemberTagAssignment { MemberId = 100, TagId = 3 };

        Assert.That(vipTag.MemberId, Is.EqualTo(activeTag.MemberId));
        Assert.That(activeTag.MemberId, Is.EqualTo(founderTag.MemberId));
        Assert.That(vipTag.TagId, Is.Not.EqualTo(activeTag.TagId));
    }

    [Test]
    public void BulkAssignment_CanHaveSameTimestamp()
    {
        var assignmentTime = DateTime.UtcNow;
        var assignment1 = new MemberTagAssignment { MemberId = 10, TagId = 1, AssignedAt = assignmentTime };
        var assignment2 = new MemberTagAssignment { MemberId = 20, TagId = 1, AssignedAt = assignmentTime };
        var assignment3 = new MemberTagAssignment { MemberId = 30, TagId = 1, AssignedAt = assignmentTime };

        Assert.That(assignment1.AssignedAt, Is.EqualTo(assignment2.AssignedAt));
        Assert.That(assignment2.AssignedAt, Is.EqualTo(assignment3.AssignedAt));
    }

    #endregion
}
