using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class LocationAdminTests
{
    #region Assignment Tests (5 tests)

    [Test]
    public void LocationId_CanBeSet()
    {
        var admin = new LocationAdmin { LocationId = 10 };
        Assert.That(admin.LocationId, Is.EqualTo(10));
    }

    [Test]
    public void UserId_CanBeSet()
    {
        var admin = new LocationAdmin { UserId = 25 };
        Assert.That(admin.UserId, Is.EqualTo(25));
    }

    [Test]
    public void AssignedAt_CanBeSet()
    {
        var assignedTime = DateTime.UtcNow.AddDays(-30);
        var admin = new LocationAdmin { AssignedAt = assignedTime };
        Assert.That(admin.AssignedAt, Is.EqualTo(assignedTime));
    }

    [Test]
    public void AssignedBy_CanBeSet()
    {
        var admin = new LocationAdmin { AssignedBy = 100 };
        Assert.That(admin.AssignedBy, Is.EqualTo(100));
    }

    [Test]
    public void AdminAssignment_TracksAllFields()
    {
        var admin = new LocationAdmin
        {
            LocationId = 5,
            UserId = 20,
            AssignedAt = DateTime.UtcNow,
            AssignedBy = 1
        };

        Assert.That(admin.LocationId, Is.EqualTo(5));
        Assert.That(admin.UserId, Is.EqualTo(20));
        Assert.That(admin.AssignedBy, Is.EqualTo(1));
    }

    #endregion

    #region Permission Level Tests (5 tests)

    [Test]
    public void PermissionLevel_CanBeSetToSuperAdmin()
    {
        var admin = new LocationAdmin { PermissionLevel = LocationPermissionLevel.SuperAdmin };
        Assert.That(admin.PermissionLevel, Is.EqualTo(LocationPermissionLevel.SuperAdmin));
    }

    [Test]
    public void PermissionLevel_CanBeSetToRegionalManager()
    {
        var admin = new LocationAdmin { PermissionLevel = LocationPermissionLevel.RegionalManager };
        Assert.That(admin.PermissionLevel, Is.EqualTo(LocationPermissionLevel.RegionalManager));
    }

    [Test]
    public void PermissionLevel_CanBeSetToLocationAdmin()
    {
        var admin = new LocationAdmin { PermissionLevel = LocationPermissionLevel.LocationAdmin };
        Assert.That(admin.PermissionLevel, Is.EqualTo(LocationPermissionLevel.LocationAdmin));
    }

    [Test]
    public void PermissionLevel_CanBeSetToLocationModerator()
    {
        var admin = new LocationAdmin { PermissionLevel = LocationPermissionLevel.LocationModerator };
        Assert.That(admin.PermissionLevel, Is.EqualTo(LocationPermissionLevel.LocationModerator));
    }

    [Test]
    public void PermissionLevel_CanBeSetToStaff()
    {
        var admin = new LocationAdmin { PermissionLevel = LocationPermissionLevel.Staff };
        Assert.That(admin.PermissionLevel, Is.EqualTo(LocationPermissionLevel.Staff));
    }

    #endregion

    #region Hierarchical Permission Tests (3 tests)

    [Test]
    public void SuperAdmin_HasHighestPermissionLevel()
    {
        var superAdmin = new LocationAdmin { PermissionLevel = LocationPermissionLevel.SuperAdmin };
        var locationAdmin = new LocationAdmin { PermissionLevel = LocationPermissionLevel.LocationAdmin };

        Assert.That((int)superAdmin.PermissionLevel, Is.LessThan((int)locationAdmin.PermissionLevel));
    }

    [Test]
    public void Staff_HasLowestPermissionLevel()
    {
        var staff = new LocationAdmin { PermissionLevel = LocationPermissionLevel.Staff };
        var moderator = new LocationAdmin { PermissionLevel = LocationPermissionLevel.LocationModerator };

        Assert.That((int)staff.PermissionLevel, Is.GreaterThan((int)moderator.PermissionLevel));
    }

    [Test]
    public void PermissionHierarchy_IsCorrectlyOrdered()
    {
        Assert.That((int)LocationPermissionLevel.SuperAdmin, Is.EqualTo(1));
        Assert.That((int)LocationPermissionLevel.RegionalManager, Is.EqualTo(2));
        Assert.That((int)LocationPermissionLevel.LocationAdmin, Is.EqualTo(3));
        Assert.That((int)LocationPermissionLevel.LocationModerator, Is.EqualTo(4));
        Assert.That((int)LocationPermissionLevel.Staff, Is.EqualTo(5));
    }

    #endregion
}
