using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class AuditLogTests
{
    #region Default Value Tests (3 tests)

    [Test]
    public void Action_DefaultsToEmptyString()
    {
        var auditLog = new AuditLog();
        Assert.That(auditLog.Action, Is.EqualTo(string.Empty));
    }

    [Test]
    public void ResourceType_DefaultsToEmptyString()
    {
        var auditLog = new AuditLog();
        Assert.That(auditLog.ResourceType, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Timestamp_DefaultsToUtcNow()
    {
        var beforeCreation = DateTime.UtcNow.AddSeconds(-1);
        var auditLog = new AuditLog();
        var afterCreation = DateTime.UtcNow.AddSeconds(1);

        Assert.That(auditLog.Timestamp, Is.GreaterThan(beforeCreation));
        Assert.That(auditLog.Timestamp, Is.LessThan(afterCreation));
    }

    #endregion

    #region Basic Properties Tests (4 tests)

    [Test]
    public void UserId_CanBeSet()
    {
        var auditLog = new AuditLog { UserId = 100 };
        Assert.That(auditLog.UserId, Is.EqualTo(100));
    }

    [Test]
    public void ClubId_CanBeSet()
    {
        var auditLog = new AuditLog { ClubId = 10 };
        Assert.That(auditLog.ClubId, Is.EqualTo(10));
    }

    [Test]
    public void ResourceId_CanBeSet()
    {
        var auditLog = new AuditLog { ResourceId = 50 };
        Assert.That(auditLog.ResourceId, Is.EqualTo(50));
    }

    [Test]
    public void ResourceId_CanBeNull()
    {
        var auditLog = new AuditLog { ResourceId = null };
        Assert.That(auditLog.ResourceId, Is.Null);
    }

    #endregion

    #region Action Tracking Tests (5 tests)

    [Test]
    public void Action_CanBeExport()
    {
        var auditLog = new AuditLog { Action = "Export" };
        Assert.That(auditLog.Action, Is.EqualTo("Export"));
    }

    [Test]
    public void Action_CanBeView()
    {
        var auditLog = new AuditLog { Action = "View" };
        Assert.That(auditLog.Action, Is.EqualTo("View"));
    }

    [Test]
    public void Action_CanBeDelete()
    {
        var auditLog = new AuditLog { Action = "Delete" };
        Assert.That(auditLog.Action, Is.EqualTo("Delete"));
    }

    [Test]
    public void ResourceType_CanBeMemberData()
    {
        var auditLog = new AuditLog { ResourceType = "MemberData" };
        Assert.That(auditLog.ResourceType, Is.EqualTo("MemberData"));
    }

    [Test]
    public void ResourceType_CanBeFinancialData()
    {
        var auditLog = new AuditLog { ResourceType = "FinancialData" };
        Assert.That(auditLog.ResourceType, Is.EqualTo("FinancialData"));
    }

    #endregion

    #region Request Context Tests (4 tests)

    [Test]
    public void IpAddress_CanBeSet()
    {
        var auditLog = new AuditLog { IpAddress = "192.168.1.1" };
        Assert.That(auditLog.IpAddress, Is.EqualTo("192.168.1.1"));
    }

    [Test]
    public void UserAgent_CanBeSet()
    {
        var auditLog = new AuditLog { UserAgent = "Mozilla/5.0" };
        Assert.That(auditLog.UserAgent, Is.EqualTo("Mozilla/5.0"));
    }

    [Test]
    public void IpAddress_CanBeNull()
    {
        var auditLog = new AuditLog { IpAddress = null };
        Assert.That(auditLog.IpAddress, Is.Null);
    }

    [Test]
    public void UserAgent_CanBeNull()
    {
        var auditLog = new AuditLog { UserAgent = null };
        Assert.That(auditLog.UserAgent, Is.Null);
    }

    #endregion

    #region Details Tests (2 tests)

    [Test]
    public void Details_CanBeSet()
    {
        var auditLog = new AuditLog { Details = "Exported 150 member records" };
        Assert.That(auditLog.Details, Is.EqualTo("Exported 150 member records"));
    }

    [Test]
    public void Details_CanBeNull()
    {
        var auditLog = new AuditLog { Details = null };
        Assert.That(auditLog.Details, Is.Null);
    }

    #endregion

    #region Complete Audit Scenarios Tests (4 tests)

    [Test]
    public void DataExportAudit_TracksAllFields()
    {
        var auditLog = new AuditLog
        {
            UserId = 100,
            ClubId = 5,
            Action = "Export",
            ResourceType = "MemberData",
            ResourceId = null,
            Details = "Exported all active members to CSV",
            IpAddress = "10.0.1.50",
            UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            Timestamp = DateTime.UtcNow
        };

        Assert.That(auditLog.Action, Is.EqualTo("Export"));
        Assert.That(auditLog.ResourceType, Is.EqualTo("MemberData"));
        Assert.That(auditLog.Details, Contains.Substring("CSV"));
        Assert.That(auditLog.IpAddress, Is.Not.Null);
    }

    [Test]
    public void FinancialDataView_IsAudited()
    {
        var auditLog = new AuditLog
        {
            UserId = 25,
            ClubId = 10,
            Action = "View",
            ResourceType = "FinancialData",
            ResourceId = 123,
            IpAddress = "172.16.0.100"
        };

        Assert.That(auditLog.Action, Is.EqualTo("View"));
        Assert.That(auditLog.ResourceType, Is.EqualTo("FinancialData"));
        Assert.That(auditLog.ResourceId, Is.EqualTo(123));
    }

    [Test]
    public void MemberDeletion_IsTracked()
    {
        var auditLog = new AuditLog
        {
            Action = "Delete",
            ResourceType = "Member",
            ResourceId = 456,
            Details = "Member account deleted upon user request"
        };

        Assert.That(auditLog.Action, Is.EqualTo("Delete"));
        Assert.That(auditLog.ResourceId, Is.EqualTo(456));
        Assert.That(auditLog.Details, Contains.Substring("deleted"));
    }

    [Test]
    public void AuditTimestamp_CanBeTrackedOverTime()
    {
        var firstAudit = new AuditLog
        {
            Action = "View",
            Timestamp = DateTime.UtcNow.AddHours(-2)
        };
        var secondAudit = new AuditLog
        {
            Action = "Export",
            Timestamp = DateTime.UtcNow
        };

        Assert.That(secondAudit.Timestamp, Is.GreaterThan(firstAudit.Timestamp));
    }

    #endregion
}
