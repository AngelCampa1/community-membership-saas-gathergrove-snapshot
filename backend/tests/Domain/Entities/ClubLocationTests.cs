using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class ClubLocationTests
{
    #region Default Value Tests (3 tests)

    [Test]
    public void LocationName_DefaultsToEmptyString()
    {
        var location = new ClubLocation();
        Assert.That(location.LocationName, Is.EqualTo(string.Empty));
    }

    [Test]
    public void LocationCode_DefaultsToEmptyString()
    {
        var location = new ClubLocation();
        Assert.That(location.LocationCode, Is.EqualTo(string.Empty));
    }

    [Test]
    public void IsActive_DefaultsToTrue()
    {
        var location = new ClubLocation();
        Assert.That(location.IsActive, Is.True);
    }

    #endregion

    #region Basic Properties Tests (4 tests)

    [Test]
    public void LocationName_CanBeSet()
    {
        var location = new ClubLocation { LocationName = "New York Chapter" };
        Assert.That(location.LocationName, Is.EqualTo("New York Chapter"));
    }

    [Test]
    public void LocationCode_CanBeSetToShortCode()
    {
        var location = new ClubLocation { LocationCode = "NYC" };
        Assert.That(location.LocationCode, Is.EqualTo("NYC"));
    }

    [Test]
    public void LocationCode_CanIncludeRegionalIdentifier()
    {
        var location = new ClubLocation { LocationCode = "LA-WEST" };
        Assert.That(location.LocationCode, Is.EqualTo("LA-WEST"));
    }

    [Test]
    public void ParentClubId_CanBeSet()
    {
        var location = new ClubLocation { ParentClubId = 5 };
        Assert.That(location.ParentClubId, Is.EqualTo(5));
    }

    #endregion

    #region Address Fields Tests (5 tests)

    [Test]
    public void Address_CanBeSet()
    {
        var location = new ClubLocation { Address = "123 Main Street" };
        Assert.That(location.Address, Is.EqualTo("123 Main Street"));
    }

    [Test]
    public void City_CanBeSet()
    {
        var location = new ClubLocation { City = "San Francisco" };
        Assert.That(location.City, Is.EqualTo("San Francisco"));
    }

    [Test]
    public void State_CanBeSet()
    {
        var location = new ClubLocation { State = "California" };
        Assert.That(location.State, Is.EqualTo("California"));
    }

    [Test]
    public void Country_CanBeSet()
    {
        var location = new ClubLocation { Country = "United States" };
        Assert.That(location.Country, Is.EqualTo("United States"));
    }

    [Test]
    public void FullAddress_CanBeComposed()
    {
        var location = new ClubLocation
        {
            Address = "456 Oak Avenue",
            City = "Chicago",
            State = "Illinois",
            Country = "USA"
        };

        Assert.That(location.Address, Is.EqualTo("456 Oak Avenue"));
        Assert.That(location.City, Is.EqualTo("Chicago"));
        Assert.That(location.State, Is.EqualTo("Illinois"));
        Assert.That(location.Country, Is.EqualTo("USA"));
    }

    #endregion

    #region Timezone Tests (3 tests)

    [Test]
    public void Timezone_CanBeSetToIANAFormat()
    {
        var location = new ClubLocation { Timezone = "America/New_York" };
        Assert.That(location.Timezone, Is.EqualTo("America/New_York"));
    }

    [Test]
    public void Timezone_SupportsMultipleRegions()
    {
        var eastCoast = new ClubLocation { Timezone = "America/New_York" };
        var westCoast = new ClubLocation { Timezone = "America/Los_Angeles" };
        var international = new ClubLocation { Timezone = "Europe/London" };

        Assert.That(eastCoast.Timezone, Is.EqualTo("America/New_York"));
        Assert.That(westCoast.Timezone, Is.EqualTo("America/Los_Angeles"));
        Assert.That(international.Timezone, Is.EqualTo("Europe/London"));
    }

    [Test]
    public void Timezone_CanBeNull()
    {
        var location = new ClubLocation { Timezone = null };
        Assert.That(location.Timezone, Is.Null);
    }

    #endregion

    #region Contact Information Tests (3 tests)

    [Test]
    public void ContactEmail_CanBeSet()
    {
        var location = new ClubLocation { ContactEmail = "nyc@example.com" };
        Assert.That(location.ContactEmail, Is.EqualTo("nyc@example.com"));
    }

    [Test]
    public void ContactPhone_CanBeSet()
    {
        var location = new ClubLocation { ContactPhone = "+1-555-1234" };
        Assert.That(location.ContactPhone, Is.EqualTo("+1-555-1234"));
    }

    [Test]
    public void ContactInfo_CanBeBothSet()
    {
        var location = new ClubLocation
        {
            ContactEmail = "contact@location.com",
            ContactPhone = "+1-555-9876"
        };

        Assert.That(location.ContactEmail, Is.EqualTo("contact@location.com"));
        Assert.That(location.ContactPhone, Is.EqualTo("+1-555-9876"));
    }

    #endregion

    #region Status Tests (2 tests)

    [Test]
    public void IsActive_CanBeSetToFalse()
    {
        var location = new ClubLocation { IsActive = false };
        Assert.That(location.IsActive, Is.False);
    }

    [Test]
    public void InactiveLocation_CanBeIdentified()
    {
        var activeLocation = new ClubLocation { IsActive = true, LocationName = "Active Branch" };
        var inactiveLocation = new ClubLocation { IsActive = false, LocationName = "Closed Branch" };

        Assert.That(activeLocation.IsActive, Is.True);
        Assert.That(inactiveLocation.IsActive, Is.False);
    }

    #endregion

    #region Settings Tests (2 tests)

    [Test]
    public void SettingsJson_CanStoreCustomSettings()
    {
        var settingsJson = "{\"maxCapacity\":200,\"parkingAvailable\":true}";
        var location = new ClubLocation { SettingsJson = settingsJson };
        Assert.That(location.SettingsJson, Is.EqualTo(settingsJson));
    }

    [Test]
    public void SettingsJson_CanBeNull()
    {
        var location = new ClubLocation { SettingsJson = null };
        Assert.That(location.SettingsJson, Is.Null);
    }

    #endregion
}
