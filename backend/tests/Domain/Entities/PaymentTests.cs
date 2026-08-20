using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class PaymentTests
{
    #region Amount Validation Tests (6 tests)

    [Test]
    public void Amount_CanBeSetToMinimumValue()
    {
        var payment = new Payment { Amount = 0.01m };
        Assert.That(payment.Amount, Is.EqualTo(0.01m));
    }

    [Test]
    public void Amount_CanBeSetToMaximumValue()
    {
        var payment = new Payment { Amount = 999999.99m };
        Assert.That(payment.Amount, Is.EqualTo(999999.99m));
    }

    [Test]
    public void Amount_SupportsTypicalDuesPayment()
    {
        var payment = new Payment { Amount = 50.00m };
        Assert.That(payment.Amount, Is.EqualTo(50.00m));
    }

    [Test]
    public void Amount_PreservesDecimalPrecision()
    {
        var payment = new Payment { Amount = 123.45m };
        Assert.That(payment.Amount, Is.EqualTo(123.45m));
    }

    [Test]
    public void Amount_SupportsLargePayments()
    {
        var payment = new Payment { Amount = 5000.00m };
        Assert.That(payment.Amount, Is.EqualTo(5000.00m));
    }

    [Test]
    public void Amount_SupportsPreciseCents()
    {
        var payment = new Payment { Amount = 19.99m };
        Assert.That(payment.Amount, Is.EqualTo(19.99m));
    }

    #endregion

    #region PaymentMethod Tests (8 tests)

    [Test]
    public void PaymentMethod_DefaultsToEmptyString()
    {
        var payment = new Payment();
        Assert.That(payment.PaymentMethod, Is.EqualTo(string.Empty));
    }

    [Test]
    public void PaymentMethod_CanBeSetToCash()
    {
        var payment = new Payment { PaymentMethod = "Cash" };
        Assert.That(payment.PaymentMethod, Is.EqualTo("Cash"));
    }

    [Test]
    public void PaymentMethod_CanBeSetToCheck()
    {
        var payment = new Payment { PaymentMethod = "Check" };
        Assert.That(payment.PaymentMethod, Is.EqualTo("Check"));
    }

    [Test]
    public void PaymentMethod_CanBeSetToStripe()
    {
        var payment = new Payment { PaymentMethod = "Stripe" };
        Assert.That(payment.PaymentMethod, Is.EqualTo("Stripe"));
    }

    [Test]
    public void PaymentMethod_SupportsCustomMethods()
    {
        var payment = new Payment { PaymentMethod = "Venmo" };
        Assert.That(payment.PaymentMethod, Is.EqualTo("Venmo"));
    }

    [Test]
    public void PaymentMethod_CanBeUpdated()
    {
        var payment = new Payment { PaymentMethod = "Cash" };
        payment.PaymentMethod = "Stripe";
        Assert.That(payment.PaymentMethod, Is.EqualTo("Stripe"));
    }

    [Test]
    public void PaymentMethod_IsCaseSensitive()
    {
        var payment = new Payment { PaymentMethod = "CASH" };
        Assert.That(payment.PaymentMethod, Is.EqualTo("CASH"));
        Assert.That(payment.PaymentMethod, Is.Not.EqualTo("Cash"));
    }

    [Test]
    public void PaymentMethod_SupportsMultiWordMethods()
    {
        var payment = new Payment { PaymentMethod = "Credit Card" };
        Assert.That(payment.PaymentMethod, Is.EqualTo("Credit Card"));
    }

    #endregion

    #region PaymentDate Tests (5 tests)

    [Test]
    public void PaymentDate_CanBeSetToPastDate()
    {
        var pastDate = new DateTime(2024, 1, 15);
        var payment = new Payment { PaymentDate = pastDate };
        Assert.That(payment.PaymentDate, Is.EqualTo(pastDate));
    }

    [Test]
    public void PaymentDate_CanBeSetToCurrentDate()
    {
        var today = DateTime.UtcNow.Date;
        var payment = new Payment { PaymentDate = today };
        Assert.That(payment.PaymentDate, Is.EqualTo(today));
    }

    [Test]
    public void PaymentDate_PreservesTimeComponent()
    {
        var dateWithTime = new DateTime(2024, 12, 31, 15, 30, 45);
        var payment = new Payment { PaymentDate = dateWithTime };
        Assert.That(payment.PaymentDate, Is.EqualTo(dateWithTime));
        Assert.That(payment.PaymentDate.Hour, Is.EqualTo(15));
        Assert.That(payment.PaymentDate.Minute, Is.EqualTo(30));
    }

    [Test]
    public void PaymentDate_CanBeUpdated()
    {
        var payment = new Payment { PaymentDate = DateTime.UtcNow.AddDays(-1) };
        var newDate = DateTime.UtcNow;
        payment.PaymentDate = newDate;
        Assert.That(payment.PaymentDate, Is.EqualTo(newDate));
    }

    [Test]
    public void PaymentDate_SupportsSpecificDateTime()
    {
        var specificDate = new DateTime(2025, 6, 15, 12, 0, 0);
        var payment = new Payment { PaymentDate = specificDate };
        Assert.That(payment.PaymentDate.Year, Is.EqualTo(2025));
        Assert.That(payment.PaymentDate.Month, Is.EqualTo(6));
        Assert.That(payment.PaymentDate.Day, Is.EqualTo(15));
    }

    #endregion

    #region Notes Tests (3 tests)

    [Test]
    public void Notes_DefaultsToNull()
    {
        var payment = new Payment();
        Assert.That(payment.Notes, Is.Null);
    }

    [Test]
    public void Notes_CanBeSet()
    {
        var payment = new Payment { Notes = "Annual membership dues" };
        Assert.That(payment.Notes, Is.EqualTo("Annual membership dues"));
    }

    [Test]
    public void Notes_SupportsLongText()
    {
        var longNotes = "Payment received for annual membership renewal. " +
                       "Member requested receipt via email. Transaction processed through Stripe.";
        var payment = new Payment { Notes = longNotes };
        Assert.That(payment.Notes, Is.EqualTo(longNotes));
        Assert.That(payment.Notes.Length, Is.GreaterThan(100));
    }

    #endregion

    #region Property Integration Tests (3 tests)

    [Test]
    public void Payment_CanBeCreatedWithAllProperties()
    {
        var payment = new Payment
        {
            Amount = 100.00m,
            PaymentMethod = "Stripe",
            PaymentDate = DateTime.UtcNow,
            Notes = "Annual membership",
            MemberId = 123,
            ClubId = 456
        };

        Assert.That(payment.Amount, Is.EqualTo(100.00m));
        Assert.That(payment.PaymentMethod, Is.EqualTo("Stripe"));
        Assert.That(payment.MemberId, Is.EqualTo(123));
        Assert.That(payment.ClubId, Is.EqualTo(456));
        Assert.That(payment.Notes, Is.EqualTo("Annual membership"));
    }

    [Test]
    public void Payment_CanBeCreatedWithMinimalProperties()
    {
        var payment = new Payment
        {
            Amount = 50.00m,
            PaymentMethod = "Cash",
            PaymentDate = DateTime.UtcNow,
            MemberId = 1,
            ClubId = 1
        };

        Assert.That(payment.Amount, Is.EqualTo(50.00m));
        Assert.That(payment.PaymentMethod, Is.EqualTo("Cash"));
        Assert.That(payment.Notes, Is.Null); // Optional
    }

    [Test]
    public void Payment_PropertiesCanBeUpdatedIndependently()
    {
        var payment = new Payment
        {
            Amount = 100.00m,
            PaymentMethod = "Cash",
            PaymentDate = DateTime.UtcNow,
            MemberId = 1,
            ClubId = 1
        };

        // Update individual properties
        payment.Amount = 150.00m;
        payment.PaymentMethod = "Stripe";
        payment.Notes = "Updated after processing";

        Assert.That(payment.Amount, Is.EqualTo(150.00m));
        Assert.That(payment.PaymentMethod, Is.EqualTo("Stripe"));
        Assert.That(payment.Notes, Is.EqualTo("Updated after processing"));
    }

    #endregion
}
