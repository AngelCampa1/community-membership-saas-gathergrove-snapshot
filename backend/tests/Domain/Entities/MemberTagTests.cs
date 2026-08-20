using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class MemberTagTests
{
    #region Default Value Tests (3 tests)

    [Test]
    public void Name_DefaultsToEmptyString()
    {
        var tag = new MemberTag();
        Assert.That(tag.Name, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Color_DefaultsToBlue()
    {
        var tag = new MemberTag();
        Assert.That(tag.Color, Is.EqualTo("#007bff"));
    }

    [Test]
    public void IsVisible_DefaultsToTrue()
    {
        var tag = new MemberTag();
        Assert.That(tag.IsVisible, Is.True);
    }

    #endregion

    #region Basic Properties Tests (4 tests)

    [Test]
    public void Name_CanBeSet()
    {
        var tag = new MemberTag { Name = "VIP Member" };
        Assert.That(tag.Name, Is.EqualTo("VIP Member"));
    }

    [Test]
    public void Description_CanBeSet()
    {
        var tag = new MemberTag { Description = "Members with premium status" };
        Assert.That(tag.Description, Is.EqualTo("Members with premium status"));
    }

    [Test]
    public void ClubId_CanBeSet()
    {
        var tag = new MemberTag { ClubId = 10 };
        Assert.That(tag.ClubId, Is.EqualTo(10));
    }

    [Test]
    public void CreatedByUserId_CanBeSet()
    {
        var tag = new MemberTag { CreatedByUserId = 25 };
        Assert.That(tag.CreatedByUserId, Is.EqualTo(25));
    }

    #endregion

    #region Color Customization Tests (5 tests)

    [Test]
    public void Color_CanBeCustomized()
    {
        var tag = new MemberTag { Color = "#FF5733" };
        Assert.That(tag.Color, Is.EqualTo("#FF5733"));
    }

    [Test]
    public void Color_SupportsMultipleFormats()
    {
        var hexTag = new MemberTag { Color = "#FF5733" };
        var namedTag = new MemberTag { Color = "red" };
        var rgbTag = new MemberTag { Color = "rgb(255, 87, 51)" };

        Assert.That(hexTag.Color, Is.EqualTo("#FF5733"));
        Assert.That(namedTag.Color, Is.EqualTo("red"));
        Assert.That(rgbTag.Color, Is.EqualTo("rgb(255, 87, 51)"));
    }

    [Test]
    public void Color_CanBeSetToStandardColors()
    {
        var greenTag = new MemberTag { Name = "Active", Color = "#28a745" };
        var yellowTag = new MemberTag { Name = "Warning", Color = "#ffc107" };
        var redTag = new MemberTag { Name = "At Risk", Color = "#dc3545" };

        Assert.That(greenTag.Color, Is.EqualTo("#28a745"));
        Assert.That(yellowTag.Color, Is.EqualTo("#ffc107"));
        Assert.That(redTag.Color, Is.EqualTo("#dc3545"));
    }

    [Test]
    public void Color_DefaultBlue_IsValidHexCode()
    {
        var tag = new MemberTag();
        Assert.That(tag.Color, Does.StartWith("#"));
        Assert.That(tag.Color.Length, Is.EqualTo(7)); // #RRGGBB
    }

    [Test]
    public void DifferentTags_CanHaveDifferentColors()
    {
        var tag1 = new MemberTag { Name = "VIP", Color = "#FFD700" };
        var tag2 = new MemberTag { Name = "Regular", Color = "#C0C0C0" };

        Assert.That(tag1.Color, Is.Not.EqualTo(tag2.Color));
    }

    #endregion

    #region Display Order Tests (4 tests)

    [Test]
    public void DisplayOrder_DefaultsToZero()
    {
        var tag = new MemberTag();
        Assert.That(tag.DisplayOrder, Is.EqualTo(0));
    }

    [Test]
    public void DisplayOrder_CanBeSet()
    {
        var tag = new MemberTag { DisplayOrder = 5 };
        Assert.That(tag.DisplayOrder, Is.EqualTo(5));
    }

    [Test]
    public void DisplayOrder_CanBeOrdered()
    {
        var firstTag = new MemberTag { Name = "First", DisplayOrder = 1 };
        var secondTag = new MemberTag { Name = "Second", DisplayOrder = 2 };
        var thirdTag = new MemberTag { Name = "Third", DisplayOrder = 3 };

        Assert.That(firstTag.DisplayOrder, Is.LessThan(secondTag.DisplayOrder));
        Assert.That(secondTag.DisplayOrder, Is.LessThan(thirdTag.DisplayOrder));
    }

    [Test]
    public void DisplayOrder_SupportsNegativeValues()
    {
        var tag = new MemberTag { DisplayOrder = -1 };
        Assert.That(tag.DisplayOrder, Is.EqualTo(-1));
    }

    #endregion

    #region Visibility Tests (3 tests)

    [Test]
    public void IsVisible_CanBeSetToFalse()
    {
        var tag = new MemberTag { IsVisible = false };
        Assert.That(tag.IsVisible, Is.False);
    }

    [Test]
    public void HiddenTag_CanBeIdentified()
    {
        var visibleTag = new MemberTag { Name = "Visible Tag", IsVisible = true };
        var hiddenTag = new MemberTag { Name = "Hidden Tag", IsVisible = false };

        Assert.That(visibleTag.IsVisible, Is.True);
        Assert.That(hiddenTag.IsVisible, Is.False);
    }

    [Test]
    public void ArchivedTag_CanBeHidden()
    {
        var tag = new MemberTag
        {
            Name = "Deprecated Tag",
            IsVisible = false,
            Description = "No longer in use"
        };

        Assert.That(tag.IsVisible, Is.False);
        Assert.That(tag.Description, Contains.Substring("No longer"));
    }

    #endregion

    #region Complete Tag Configuration Tests (2 tests)

    [Test]
    public void CompleteTag_HasAllProperties()
    {
        var tag = new MemberTag
        {
            ClubId = 5,
            Name = "Platinum Member",
            Description = "Highest tier membership",
            Color = "#E5E4E2",
            IsVisible = true,
            DisplayOrder = 1,
            CreatedByUserId = 10
        };

        Assert.That(tag.ClubId, Is.EqualTo(5));
        Assert.That(tag.Name, Is.EqualTo("Platinum Member"));
        Assert.That(tag.Description, Is.Not.Null);
        Assert.That(tag.Color, Is.EqualTo("#E5E4E2"));
        Assert.That(tag.IsVisible, Is.True);
        Assert.That(tag.DisplayOrder, Is.EqualTo(1));
    }

    [Test]
    public void MinimalTag_RequiresOnlyNameAndClub()
    {
        var tag = new MemberTag
        {
            ClubId = 3,
            Name = "Standard",
            Description = null
        };

        Assert.That(tag.ClubId, Is.EqualTo(3));
        Assert.That(tag.Name, Is.EqualTo("Standard"));
        Assert.That(tag.Color, Is.EqualTo("#007bff")); // Default
        Assert.That(tag.IsVisible, Is.True); // Default
    }

    #endregion
}
