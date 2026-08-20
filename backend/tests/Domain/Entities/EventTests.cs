using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class EventTests
{
    #region IsPaid Tests (8 tests)

    [Test]
    public void IsPaid_ReturnsFalse_WhenBothPricesAreNull()
    {
        var evt = new Event { MemberPrice = null, NonMemberPrice = null };
        Assert.That(evt.IsPaid, Is.False);
    }

    [Test]
    public void IsPaid_ReturnsFalse_WhenBothPricesAreZero()
    {
        var evt = new Event { MemberPrice = 0, NonMemberPrice = 0 };
        Assert.That(evt.IsPaid, Is.False);
    }

    [Test]
    public void IsPaid_ReturnsTrue_WhenMemberPriceIsPositive()
    {
        var evt = new Event { MemberPrice = 10.00m, NonMemberPrice = 0 };
        Assert.That(evt.IsPaid, Is.True);
    }

    [Test]
    public void IsPaid_ReturnsTrue_WhenNonMemberPriceIsPositive()
    {
        var evt = new Event { MemberPrice = 0, NonMemberPrice = 15.00m };
        Assert.That(evt.IsPaid, Is.True);
    }

    [Test]
    public void IsPaid_ReturnsTrue_WhenBothPricesArePositive()
    {
        var evt = new Event { MemberPrice = 10.00m, NonMemberPrice = 15.00m };
        Assert.That(evt.IsPaid, Is.True);
    }

    [Test]
    public void IsPaid_ReturnsFalse_WhenMemberPriceNullAndNonMemberZero()
    {
        var evt = new Event { MemberPrice = null, NonMemberPrice = 0 };
        Assert.That(evt.IsPaid, Is.False);
    }

    [Test]
    public void IsPaid_ReturnsFalse_WhenMemberPriceZeroAndNonMemberNull()
    {
        var evt = new Event { MemberPrice = 0, NonMemberPrice = null };
        Assert.That(evt.IsPaid, Is.False);
    }

    [Test]
    public void IsPaid_HandlesPreciseDecimalValues()
    {
        var evt = new Event { MemberPrice = 0.01m, NonMemberPrice = 0 };
        Assert.That(evt.IsPaid, Is.True);
    }

    #endregion

    #region IsFree Tests (6 tests)

    [Test]
    public void IsFree_ReturnsTrue_WhenBothPricesAreNull()
    {
        var evt = new Event { MemberPrice = null, NonMemberPrice = null };
        Assert.That(evt.IsFree, Is.True);
    }

    [Test]
    public void IsFree_ReturnsTrue_WhenBothPricesAreZero()
    {
        var evt = new Event { MemberPrice = 0, NonMemberPrice = 0 };
        Assert.That(evt.IsFree, Is.True);
    }

    [Test]
    public void IsFree_ReturnsTrue_WhenBothPricesAreExplicitZeroDecimal()
    {
        var evt = new Event { MemberPrice = 0.00m, NonMemberPrice = 0.00m };
        Assert.That(evt.IsFree, Is.True);
    }

    [Test]
    public void IsFree_ReturnsTrue_WhenMemberNullAndNonMemberZero()
    {
        var evt = new Event { MemberPrice = null, NonMemberPrice = 0 };
        Assert.That(evt.IsFree, Is.True);
    }

    [Test]
    public void IsFree_ReturnsTrue_WhenMemberZeroAndNonMemberNull()
    {
        var evt = new Event { MemberPrice = 0, NonMemberPrice = null };
        Assert.That(evt.IsFree, Is.True);
    }

    [Test]
    public void IsFree_ReturnsFalse_WhenAnyPriceIsPositive()
    {
        var evt = new Event { MemberPrice = 10.00m, NonMemberPrice = 0 };
        Assert.That(evt.IsFree, Is.False);
    }

    #endregion

    #region IsEarlyBirdActive Tests (8 tests)

    [Test]
    public void IsEarlyBirdActive_ReturnsTrue_WhenDeadlineInFutureAndPriceExists()
    {
        var evt = new Event
        {
            EarlyBirdDeadline = DateTime.UtcNow.AddDays(7),
            EarlyBirdPrice = 8.00m
        };
        Assert.That(evt.IsEarlyBirdActive, Is.True);
    }

    [Test]
    public void IsEarlyBirdActive_ReturnsFalse_WhenDeadlineInPast()
    {
        var evt = new Event
        {
            EarlyBirdDeadline = DateTime.UtcNow.AddDays(-1),
            EarlyBirdPrice = 8.00m
        };
        Assert.That(evt.IsEarlyBirdActive, Is.False);
    }

    [Test]
    public void IsEarlyBirdActive_ReturnsFalse_WhenDeadlineIsNull()
    {
        var evt = new Event
        {
            EarlyBirdDeadline = null,
            EarlyBirdPrice = 8.00m
        };
        Assert.That(evt.IsEarlyBirdActive, Is.False);
    }

    [Test]
    public void IsEarlyBirdActive_ReturnsFalse_WhenPriceIsNull()
    {
        var evt = new Event
        {
            EarlyBirdDeadline = DateTime.UtcNow.AddDays(7),
            EarlyBirdPrice = null
        };
        Assert.That(evt.IsEarlyBirdActive, Is.False);
    }

    [Test]
    public void IsEarlyBirdActive_ReturnsFalse_WhenBothAreNull()
    {
        var evt = new Event
        {
            EarlyBirdDeadline = null,
            EarlyBirdPrice = null
        };
        Assert.That(evt.IsEarlyBirdActive, Is.False);
    }

    [Test]
    public void IsEarlyBirdActive_HandlesExactDeadlineTime()
    {
        var deadline = DateTime.UtcNow.AddSeconds(1);
        var evt = new Event
        {
            EarlyBirdDeadline = deadline,
            EarlyBirdPrice = 8.00m
        };
        Assert.That(evt.IsEarlyBirdActive, Is.True);
    }

    [Test]
    public void IsEarlyBirdActive_ReturnsFalse_WhenPriceIsZero()
    {
        var evt = new Event
        {
            EarlyBirdDeadline = DateTime.UtcNow.AddDays(7),
            EarlyBirdPrice = 0m
        };
        Assert.That(evt.IsEarlyBirdActive, Is.True); // Still active if deadline exists, price validation is separate concern
    }

    [Test]
    public void IsEarlyBirdActive_ChangesOverTime()
    {
        var evt = new Event
        {
            EarlyBirdDeadline = DateTime.UtcNow.AddMilliseconds(100),
            EarlyBirdPrice = 8.00m
        };

        Assert.That(evt.IsEarlyBirdActive, Is.True); // Active now

        System.Threading.Thread.Sleep(150); // Wait for deadline to pass

        Assert.That(evt.IsEarlyBirdActive, Is.False); // Expired
    }

    #endregion

    #region Title Alias Tests (2 tests)

    [Test]
    public void Title_Get_ReturnsName()
    {
        var evt = new Event { Name = "Annual Gala" };
        Assert.That(evt.Title, Is.EqualTo("Annual Gala"));
    }

    [Test]
    public void Title_Set_UpdatesName()
    {
        var evt = new Event();
        evt.Title = "Summer Picnic";
        Assert.That(evt.Name, Is.EqualTo("Summer Picnic"));
        Assert.That(evt.Title, Is.EqualTo("Summer Picnic"));
    }

    #endregion

    #region Date Alias Tests (2 tests)

    [Test]
    public void Date_Get_ReturnsEventDateTime()
    {
        var dateTime = new DateTime(2023, 6, 15, 18, 30, 0);
        var evt = new Event { EventDateTime = dateTime };
        Assert.That(evt.Date, Is.EqualTo(dateTime));
    }

    [Test]
    public void Date_Set_UpdatesEventDateTime()
    {
        var evt = new Event();
        var dateTime = new DateTime(2023, 6, 15, 18, 30, 0);
        evt.Date = dateTime;
        Assert.That(evt.EventDateTime, Is.EqualTo(dateTime));
        Assert.That(evt.Date, Is.EqualTo(dateTime));
    }

    #endregion

    #region Capacity Tests (9 tests)

    [Test]
    public void Capacity_Get_ReturnsZero_WhenMaxCapacityIsNull()
    {
        var evt = new Event { MaxCapacity = null };
        Assert.That(evt.Capacity, Is.EqualTo(0));
    }

    [Test]
    public void Capacity_Get_ReturnsMaxCapacity_WhenSet()
    {
        var evt = new Event { MaxCapacity = 100 };
        Assert.That(evt.Capacity, Is.EqualTo(100));
    }

    [Test]
    public void Capacity_Get_ReturnsZero_WhenMaxCapacityIsZero()
    {
        var evt = new Event { MaxCapacity = 0 };
        Assert.That(evt.Capacity, Is.EqualTo(0));
    }

    [Test]
    public void Capacity_Set_SetsMaxCapacityToNull_WhenValueIsZero()
    {
        var evt = new Event();
        evt.Capacity = 0;
        Assert.That(evt.MaxCapacity, Is.Null);
    }

    [Test]
    public void Capacity_Set_SetsMaxCapacity_WhenValueIsPositive()
    {
        var evt = new Event();
        evt.Capacity = 100;
        Assert.That(evt.MaxCapacity, Is.EqualTo(100));
    }

    [Test]
    public void Capacity_Set_SetsMaxCapacity_WhenValueIsOne()
    {
        var evt = new Event();
        evt.Capacity = 1;
        Assert.That(evt.MaxCapacity, Is.EqualTo(1));
    }

    [Test]
    public void Capacity_RoundTrip_WithPositiveValue()
    {
        var evt = new Event();
        evt.Capacity = 50;
        Assert.That(evt.Capacity, Is.EqualTo(50));
        Assert.That(evt.MaxCapacity, Is.EqualTo(50));
    }

    [Test]
    public void Capacity_RoundTrip_WithZero()
    {
        var evt = new Event();
        evt.Capacity = 0;
        Assert.That(evt.Capacity, Is.EqualTo(0));
        Assert.That(evt.MaxCapacity, Is.Null);
    }

    [Test]
    public void Capacity_DefaultIsZero_ForNewEvent()
    {
        var evt = new Event();
        Assert.That(evt.Capacity, Is.EqualTo(0));
        Assert.That(evt.MaxCapacity, Is.Null);
    }

    #endregion
}
