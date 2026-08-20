using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class MemberTransferTests
{
    #region Default Value Tests (1 test)

    [Test]
    public void TransferReason_DefaultsToEmptyString()
    {
        var transfer = new MemberTransfer();
        Assert.That(transfer.TransferReason, Is.EqualTo(string.Empty));
    }

    #endregion

    #region Transfer Request Tests (5 tests)

    [Test]
    public void MemberId_CanBeSet()
    {
        var transfer = new MemberTransfer { MemberId = 100 };
        Assert.That(transfer.MemberId, Is.EqualTo(100));
    }

    [Test]
    public void FromLocationId_CanBeSet()
    {
        var transfer = new MemberTransfer { FromLocationId = 5 };
        Assert.That(transfer.FromLocationId, Is.EqualTo(5));
    }

    [Test]
    public void ToLocationId_CanBeSet()
    {
        var transfer = new MemberTransfer { ToLocationId = 10 };
        Assert.That(transfer.ToLocationId, Is.EqualTo(10));
    }

    [Test]
    public void TransferReason_CanBeSet()
    {
        var transfer = new MemberTransfer { TransferReason = "Moving to new city" };
        Assert.That(transfer.TransferReason, Is.EqualTo("Moving to new city"));
    }

    [Test]
    public void TransferRequest_TracksAllFields()
    {
        var transfer = new MemberTransfer
        {
            MemberId = 50,
            FromLocationId = 1,
            ToLocationId = 2,
            TransferReason = "Job relocation",
            RequestedAt = DateTime.UtcNow,
            RequestedBy = 25
        };

        Assert.That(transfer.MemberId, Is.EqualTo(50));
        Assert.That(transfer.FromLocationId, Is.EqualTo(1));
        Assert.That(transfer.ToLocationId, Is.EqualTo(2));
        Assert.That(transfer.TransferReason, Is.EqualTo("Job relocation"));
        Assert.That(transfer.RequestedBy, Is.EqualTo(25));
    }

    #endregion

    #region Status Tests (5 tests)

    [Test]
    public void Status_CanBeSetToPending()
    {
        var transfer = new MemberTransfer { Status = MemberTransferStatus.Pending };
        Assert.That(transfer.Status, Is.EqualTo(MemberTransferStatus.Pending));
    }

    [Test]
    public void Status_CanBeSetToApproved()
    {
        var transfer = new MemberTransfer { Status = MemberTransferStatus.Approved };
        Assert.That(transfer.Status, Is.EqualTo(MemberTransferStatus.Approved));
    }

    [Test]
    public void Status_CanBeSetToDenied()
    {
        var transfer = new MemberTransfer { Status = MemberTransferStatus.Denied };
        Assert.That(transfer.Status, Is.EqualTo(MemberTransferStatus.Denied));
    }

    [Test]
    public void Status_CanBeSetToCancelled()
    {
        var transfer = new MemberTransfer { Status = MemberTransferStatus.Cancelled };
        Assert.That(transfer.Status, Is.EqualTo(MemberTransferStatus.Cancelled));
    }

    [Test]
    public void PendingTransfer_HasCorrectStatus()
    {
        var transfer = new MemberTransfer
        {
            Status = MemberTransferStatus.Pending,
            RequestedAt = DateTime.UtcNow,
            ApprovedAt = null
        };

        Assert.That(transfer.Status, Is.EqualTo(MemberTransferStatus.Pending));
        Assert.That(transfer.ApprovedAt, Is.Null);
    }

    #endregion

    #region Approval Workflow Tests (6 tests)

    [Test]
    public void ApprovedAt_CanBeSet()
    {
        var approvalTime = DateTime.UtcNow;
        var transfer = new MemberTransfer { ApprovedAt = approvalTime };
        Assert.That(transfer.ApprovedAt, Is.EqualTo(approvalTime));
    }

    [Test]
    public void ApprovedBy_CanBeSet()
    {
        var transfer = new MemberTransfer { ApprovedBy = 15 };
        Assert.That(transfer.ApprovedBy, Is.EqualTo(15));
    }

    [Test]
    public void ApprovalNotes_CanBeSet()
    {
        var transfer = new MemberTransfer { ApprovalNotes = "Approved due to job relocation" };
        Assert.That(transfer.ApprovalNotes, Is.EqualTo("Approved due to job relocation"));
    }

    [Test]
    public void ApprovedTransfer_HasAllApprovalFields()
    {
        var transfer = new MemberTransfer
        {
            Status = MemberTransferStatus.Approved,
            ApprovedAt = DateTime.UtcNow,
            ApprovedBy = 10,
            ApprovalNotes = "Transfer approved - good standing member"
        };

        Assert.That(transfer.Status, Is.EqualTo(MemberTransferStatus.Approved));
        Assert.That(transfer.ApprovedAt, Is.Not.Null);
        Assert.That(transfer.ApprovedBy, Is.EqualTo(10));
        Assert.That(transfer.ApprovalNotes, Is.Not.Null);
    }

    [Test]
    public void DeniedTransfer_CanHaveNotes()
    {
        var transfer = new MemberTransfer
        {
            Status = MemberTransferStatus.Denied,
            ApprovalNotes = "Cannot transfer - membership dues overdue"
        };

        Assert.That(transfer.Status, Is.EqualTo(MemberTransferStatus.Denied));
        Assert.That(transfer.ApprovalNotes, Is.Not.Null);
    }

    [Test]
    public void ApprovedAt_ShouldBeAfterRequestedAt()
    {
        var transfer = new MemberTransfer
        {
            RequestedAt = DateTime.UtcNow.AddDays(-7),
            ApprovedAt = DateTime.UtcNow.AddDays(-1)
        };

        Assert.That(transfer.ApprovedAt, Is.GreaterThan(transfer.RequestedAt));
    }

    #endregion

    #region Complete Transfer Scenarios Tests (3 tests)

    [Test]
    public void SuccessfulTransfer_CompleteWorkflow()
    {
        var transfer = new MemberTransfer
        {
            MemberId = 100,
            FromLocationId = 1,
            ToLocationId = 2,
            TransferReason = "Moving to Seattle",
            Status = MemberTransferStatus.Approved,
            RequestedAt = DateTime.UtcNow.AddDays(-10),
            RequestedBy = 100,
            ApprovedAt = DateTime.UtcNow.AddDays(-3),
            ApprovedBy = 5,
            ApprovalNotes = "Approved - member in good standing"
        };

        Assert.That(transfer.Status, Is.EqualTo(MemberTransferStatus.Approved));
        Assert.That(transfer.ApprovedAt, Is.Not.Null);
        Assert.That(transfer.ApprovedAt, Is.GreaterThan(transfer.RequestedAt));
    }

    [Test]
    public void CancelledTransfer_ByMember()
    {
        var transfer = new MemberTransfer
        {
            Status = MemberTransferStatus.Cancelled,
            RequestedAt = DateTime.UtcNow.AddDays(-5),
            ApprovedAt = null
        };

        Assert.That(transfer.Status, Is.EqualTo(MemberTransferStatus.Cancelled));
        Assert.That(transfer.ApprovedAt, Is.Null);
    }

    [Test]
    public void CrossLocationTransfer_DifferentLocations()
    {
        var transfer = new MemberTransfer
        {
            FromLocationId = 1,
            ToLocationId = 5
        };

        Assert.That(transfer.FromLocationId, Is.Not.EqualTo(transfer.ToLocationId));
    }

    #endregion
}
