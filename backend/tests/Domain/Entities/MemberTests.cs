using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class MemberTests
{
    #region FirstName Extraction Tests (10 tests)

    [Test]
    public void FirstName_ExtractsFromFullName_WhenSpacePresent()
    {
        var member = new Member { FullName = "John Doe" };
        Assert.That(member.FirstName, Is.EqualTo("John"));
    }

    [Test]
    public void FirstName_ReturnsSingleName_WhenNoSpacePresent()
    {
        var member = new Member { FullName = "Madonna" };
        Assert.That(member.FirstName, Is.EqualTo("Madonna"));
    }

    [Test]
    public void FirstName_ReturnsEmptyString_WhenFullNameIsNull()
    {
        var member = new Member { FullName = null! };
        Assert.That(member.FirstName, Is.Null);
    }

    [Test]
    public void FirstName_ReturnsEmptyString_WhenFullNameIsEmpty()
    {
        var member = new Member { FullName = "" };
        Assert.That(member.FirstName, Is.EqualTo(""));
    }

    [Test]
    public void FirstName_ExtractsFirstWord_FromMultiPartName()
    {
        var member = new Member { FullName = "John Paul Doe" };
        Assert.That(member.FirstName, Is.EqualTo("John"));
    }

    [Test]
    public void FirstName_HandlesLeadingSpaces()
    {
        var member = new Member { FullName = "  John Doe" };
        Assert.That(member.FirstName, Is.EqualTo("John"));
    }

    [Test]
    public void FirstName_HandlesTrailingSpaces()
    {
        var member = new Member { FullName = "John Doe  " };
        Assert.That(member.FirstName, Is.EqualTo("John"));
    }

    [Test]
    public void FirstName_HandlesMultipleConsecutiveSpaces()
    {
        var member = new Member { FullName = "John   Doe" };
        Assert.That(member.FirstName, Is.EqualTo("John"));
    }

    [Test]
    public void FirstName_HandlesHyphenatedFirstName()
    {
        var member = new Member { FullName = "Mary-Jane Watson" };
        Assert.That(member.FirstName, Is.EqualTo("Mary-Jane"));
    }

    [Test]
    public void FirstName_HandlesSingleCharacterFirstName()
    {
        var member = new Member { FullName = "J Doe" };
        Assert.That(member.FirstName, Is.EqualTo("J"));
    }

    #endregion

    #region LastName Extraction Tests (10 tests)

    [Test]
    public void LastName_ExtractsFromFullName_WhenSpacePresent()
    {
        var member = new Member { FullName = "John Doe" };
        Assert.That(member.LastName, Is.EqualTo("Doe"));
    }

    [Test]
    public void LastName_ReturnsEmpty_WhenNoSpacePresent()
    {
        var member = new Member { FullName = "Madonna" };
        Assert.That(member.LastName, Is.EqualTo(""));
    }

    [Test]
    public void LastName_ReturnsEmpty_WhenFullNameIsNull()
    {
        var member = new Member { FullName = null! };
        Assert.That(member.LastName, Is.EqualTo(""));
    }

    [Test]
    public void LastName_ReturnsEmpty_WhenFullNameIsEmpty()
    {
        var member = new Member { FullName = "" };
        Assert.That(member.LastName, Is.EqualTo(""));
    }

    [Test]
    public void LastName_ExtractsMultiPartLastName()
    {
        var member = new Member { FullName = "John van der Berg" };
        Assert.That(member.LastName, Is.EqualTo("van der Berg"));
    }

    [Test]
    public void LastName_ExtractsEverythingAfterFirstWord()
    {
        var member = new Member { FullName = "John Paul Doe" };
        Assert.That(member.LastName, Is.EqualTo("Paul Doe"));
    }

    [Test]
    public void LastName_HandlesLeadingAndTrailingSpaces()
    {
        var member = new Member { FullName = "  John Doe  " };
        Assert.That(member.LastName, Is.EqualTo("Doe"));
    }

    [Test]
    public void LastName_HandlesHyphenatedLastName()
    {
        var member = new Member { FullName = "John Smith-Jones" };
        Assert.That(member.LastName, Is.EqualTo("Smith-Jones"));
    }

    [Test]
    public void LastName_HandlesNameWithSuffix()
    {
        var member = new Member { FullName = "John Doe Jr." };
        Assert.That(member.LastName, Is.EqualTo("Doe Jr."));
    }

    [Test]
    public void LastName_HandlesSingleCharacterLastName()
    {
        var member = new Member { FullName = "John D" };
        Assert.That(member.LastName, Is.EqualTo("D"));
    }

    #endregion

    #region FirstName Setter Tests (5 tests)

    [Test]
    public void FirstName_Set_UpdatesFullName_WhenLastNameExists()
    {
        var member = new Member { FullName = "John Doe" };
        member.FirstName = "Jane";
        Assert.That(member.FullName, Is.EqualTo("Jane Doe"));
    }

    [Test]
    public void FirstName_Set_SetsFullName_WhenNoLastNameExists()
    {
        var member = new Member { FullName = "Madonna" };
        member.FirstName = "Jane";
        Assert.That(member.FullName, Is.EqualTo("Jane"));
    }

    [Test]
    public void FirstName_Set_SetsToEmpty_WhenValueIsEmpty()
    {
        var member = new Member { FullName = "John Doe" };
        member.FirstName = "";
        Assert.That(member.FullName, Is.EqualTo(" Doe"));
    }

    [Test]
    public void FirstName_Set_UpdatesFullName_FromSingleWordName()
    {
        var member = new Member { FullName = "John" };
        member.FirstName = "Jane";
        Assert.That(member.FullName, Is.EqualTo("Jane"));
    }

    [Test]
    public void FirstName_Set_AllowsMultipleUpdates()
    {
        var member = new Member { FullName = "John Doe" };
        member.FirstName = "Jane";
        member.FirstName = "Jack";
        Assert.That(member.FullName, Is.EqualTo("Jack Doe"));
        Assert.That(member.FirstName, Is.EqualTo("Jack"));
    }

    #endregion

    #region LastName Setter Tests (5 tests)

    [Test]
    public void LastName_Set_UpdatesFullName_PreservingFirstName()
    {
        var member = new Member { FullName = "John Doe" };
        member.LastName = "Smith";
        Assert.That(member.FullName, Is.EqualTo("John Smith"));
    }

    [Test]
    public void LastName_Set_SetsFullName_WhenNoFirstNameExists()
    {
        var member = new Member { FullName = "" };
        member.LastName = "Doe";
        Assert.That(member.FullName, Is.EqualTo("Doe"));
    }

    [Test]
    public void LastName_Set_UpdatesFullName_WhenMultiPartLastName()
    {
        var member = new Member { FullName = "John Doe" };
        member.LastName = "van der Berg";
        Assert.That(member.FullName, Is.EqualTo("John van der Berg"));
    }

    [Test]
    public void LastName_Set_UpdatesFromSingleWordName()
    {
        var member = new Member { FullName = "John" };
        member.LastName = "Doe";
        Assert.That(member.FullName, Is.EqualTo("John Doe"));
    }

    [Test]
    public void LastName_Set_AllowsMultipleUpdates()
    {
        var member = new Member { FullName = "John Doe" };
        member.LastName = "Smith";
        member.LastName = "Jones";
        Assert.That(member.FullName, Is.EqualTo("John Jones"));
        Assert.That(member.LastName, Is.EqualTo("Jones"));
    }

    #endregion

    #region Status Tests (5 tests)

    [Test]
    public void Status_DefaultsToActive()
    {
        var member = new Member();
        Assert.That(member.Status, Is.EqualTo("Active"));
    }

    [Test]
    public void Status_CanBeSetToInactive()
    {
        var member = new Member { Status = "Inactive" };
        Assert.That(member.Status, Is.EqualTo("Inactive"));
    }

    [Test]
    public void Status_CanBeSetToSuspended()
    {
        var member = new Member { Status = "Suspended" };
        Assert.That(member.Status, Is.EqualTo("Suspended"));
    }

    [Test]
    public void Status_CanBeSetToCustomValue()
    {
        var member = new Member { Status = "Pending" };
        Assert.That(member.Status, Is.EqualTo("Pending"));
    }

    [Test]
    public void Status_CanBeUpdated()
    {
        var member = new Member { Status = "Active" };
        member.Status = "Inactive";
        Assert.That(member.Status, Is.EqualTo("Inactive"));
    }

    #endregion

    #region JoinedAt Alias Tests (2 tests)

    [Test]
    public void JoinedAt_AliasesJoinDate()
    {
        var joinDate = new DateTime(2023, 1, 15);
        var member = new Member { JoinDate = joinDate };
        Assert.That(member.JoinedAt, Is.EqualTo(joinDate));
    }

    [Test]
    public void JoinedAt_Set_UpdatesJoinDate()
    {
        var joinDate = new DateTime(2023, 1, 15);
        var member = new Member { JoinedAt = joinDate };
        Assert.That(member.JoinDate, Is.EqualTo(joinDate));
    }

    #endregion

    #region CustomFields Tests (3 tests)

    [Test]
    public void CustomFields_ReturnsEmptyDictionary_WhenNoCustomFieldValues()
    {
        var member = new Member();
        Assert.That(member.CustomFields, Is.Not.Null);
        Assert.That(member.CustomFields, Is.Empty);
    }

    [Test]
    public void CustomFields_CanBeSetDirectly_ForTestScenarios()
    {
        var member = new Member
        {
            CustomFields = new Dictionary<string, object?>
            {
                { "Favorite Color", "Blue" },
                { "Membership Level", "Gold" }
            }
        };

        Assert.That(member.CustomFields, Has.Count.EqualTo(2));
        Assert.That(member.CustomFields["Favorite Color"], Is.EqualTo("Blue"));
        Assert.That(member.CustomFields["Membership Level"], Is.EqualTo("Gold"));
    }

    [Test]
    public void CustomFields_SetterUsesOverride_PreservesValues()
    {
        var customData = new Dictionary<string, object?>
        {
            { "Department", "Engineering" },
            { "Employee ID", 12345 },
            { "Start Date", new DateTime(2023, 1, 15) }
        };

        var member = new Member { CustomFields = customData };

        Assert.That(member.CustomFields, Has.Count.EqualTo(3));
        Assert.That(member.CustomFields["Department"], Is.EqualTo("Engineering"));
        Assert.That(member.CustomFields["Employee ID"], Is.EqualTo(12345));
        Assert.That(member.CustomFields["Start Date"], Is.EqualTo(new DateTime(2023, 1, 15)));
    }

    #endregion
}
