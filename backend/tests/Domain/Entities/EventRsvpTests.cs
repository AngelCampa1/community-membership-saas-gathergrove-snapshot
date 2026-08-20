using NUnit.Framework;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace Domain.Tests.Entities;

[TestFixture]
public class EventRsvpTests
{
    #region Default Value Tests (5 tests)

    [Test]
    public void RsvpStatus_DefaultsToEmptyString()
    {
        var rsvp = new EventRsvp();
        Assert.That(rsvp.RsvpStatus, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Status_DefaultsToPending()
    {
        var rsvp = new EventRsvp();
        Assert.That(rsvp.Status, Is.EqualTo(RsvpStatus.Pending));
    }

    [Test]
    public void PaymentStatus_DefaultsToPending()
    {
        var rsvp = new EventRsvp();
        Assert.That(rsvp.PaymentStatus, Is.EqualTo(GatherGrove.Domain.Enums.PaymentStatus.Pending));
    }

    [Test]
    public void IsGuestRegistration_DefaultsToFalse()
    {
        var rsvp = new EventRsvp();
        Assert.That(rsvp.IsGuestRegistration, Is.False);
    }

    [Test]
    public void Notes_DefaultsToNull()
    {
        var rsvp = new EventRsvp();
        Assert.That(rsvp.Notes, Is.Null);
    }

    #endregion

    #region RSVP Status Transitions (4 tests)

    [Test]
    public void Status_CanBeSetToConfirmed()
    {
        var rsvp = new EventRsvp { Status = RsvpStatus.Confirmed };
        Assert.That(rsvp.Status, Is.EqualTo(RsvpStatus.Confirmed));
    }

    [Test]
    public void Status_SupportsDeclinedTransition()
    {
        var rsvp = new EventRsvp { Status = RsvpStatus.Pending };
        rsvp.Status = RsvpStatus.Declined;
        Assert.That(rsvp.Status, Is.EqualTo(RsvpStatus.Declined));
    }

    [Test]
    public void Status_SupportsCancellationAfterConfirmation()
    {
        var rsvp = new EventRsvp { Status = RsvpStatus.Confirmed };
        rsvp.Status = RsvpStatus.Cancelled;
        Assert.That(rsvp.Status, Is.EqualTo(RsvpStatus.Cancelled));
    }

    [Test]
    public void Status_SupportsCheckInWorkflow()
    {
        var rsvp = new EventRsvp { Status = RsvpStatus.Confirmed };
        rsvp.Status = RsvpStatus.CheckedIn;
        Assert.That(rsvp.Status, Is.EqualTo(RsvpStatus.CheckedIn));
    }

    #endregion

    #region Payment Integration Tests (5 tests)

    [Test]
    public void PaymentStatus_CanBeSetToSucceeded()
    {
        var rsvp = new EventRsvp { PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded };
        Assert.That(rsvp.PaymentStatus, Is.EqualTo(GatherGrove.Domain.Enums.PaymentStatus.Succeeded));
    }

    [Test]
    public void PaidAmount_CanBeSet()
    {
        var rsvp = new EventRsvp { PaidAmount = 50.00m };
        Assert.That(rsvp.PaidAmount, Is.EqualTo(50.00m));
    }

    [Test]
    public void StripePaymentIntentId_CanBeSet()
    {
        var rsvp = new EventRsvp { StripePaymentIntentId = "pi_ABC123XYZ" };
        Assert.That(rsvp.StripePaymentIntentId, Is.EqualTo("pi_ABC123XYZ"));
    }

    [Test]
    public void PaymentStatus_SupportsRefundTransition()
    {
        var rsvp = new EventRsvp
        {
            PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 75.00m
        };

        rsvp.PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Refunded;
        Assert.That(rsvp.PaymentStatus, Is.EqualTo(GatherGrove.Domain.Enums.PaymentStatus.Refunded));
        Assert.That(rsvp.PaidAmount, Is.EqualTo(75.00m)); // Original amount preserved
    }

    [Test]
    public void EventRsvp_SupportsCompletePaidRegistration()
    {
        var rsvp = new EventRsvp
        {
            EventId = 1,
            MemberId = 123,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 100.00m,
            StripePaymentIntentId = "pi_ABC123"
        };

        Assert.That(rsvp.Status, Is.EqualTo(RsvpStatus.Confirmed));
        Assert.That(rsvp.PaymentStatus, Is.EqualTo(GatherGrove.Domain.Enums.PaymentStatus.Succeeded));
        Assert.That(rsvp.PaidAmount, Is.EqualTo(100.00m));
        Assert.That(rsvp.StripePaymentIntentId, Is.EqualTo("pi_ABC123"));
    }

    #endregion

    #region Guest Registration Tests (4 tests)

    [Test]
    public void IsGuestRegistration_CanBeEnabled()
    {
        var rsvp = new EventRsvp { IsGuestRegistration = true };
        Assert.That(rsvp.IsGuestRegistration, Is.True);
    }

    [Test]
    public void GuestInformation_CanBeSet()
    {
        var rsvp = new EventRsvp
        {
            IsGuestRegistration = true,
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            GuestPhone = "555-1234"
        };

        Assert.That(rsvp.GuestName, Is.EqualTo("John Doe"));
        Assert.That(rsvp.GuestEmail, Is.EqualTo("john@example.com"));
        Assert.That(rsvp.GuestPhone, Is.EqualTo("555-1234"));
    }

    [Test]
    public void GuestRegistration_SupportsConversionToMember()
    {
        var rsvp = new EventRsvp
        {
            IsGuestRegistration = true,
            GuestName = "Jane Smith",
            GuestEmail = "jane@example.com"
        };

        // Simulate conversion to member
        rsvp.MemberId = 456;
        rsvp.IsGuestRegistration = false;

        Assert.That(rsvp.MemberId, Is.EqualTo(456));
        Assert.That(rsvp.IsGuestRegistration, Is.False);
        Assert.That(rsvp.GuestEmail, Is.EqualTo("jane@example.com")); // Preserved for reference
    }

    [Test]
    public void GuestRegistration_SupportsPayment()
    {
        var rsvp = new EventRsvp
        {
            IsGuestRegistration = true,
            GuestName = "Bob Johnson",
            GuestEmail = "bob@example.com",
            PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_GUEST123"
        };

        Assert.That(rsvp.IsGuestRegistration, Is.True);
        Assert.That(rsvp.PaymentStatus, Is.EqualTo(GatherGrove.Domain.Enums.PaymentStatus.Succeeded));
        Assert.That(rsvp.PaidAmount, Is.EqualTo(25.00m));
    }

    #endregion

    #region Membership Upgrade Tests (2 tests)

    [Test]
    public void MembershipUpgradeTypeId_CanBeSet()
    {
        var rsvp = new EventRsvp { MembershipUpgradeTypeId = 5 };
        Assert.That(rsvp.MembershipUpgradeTypeId, Is.EqualTo(5));
    }

    [Test]
    public void EventRsvp_SupportsBundledMembershipPurchase()
    {
        var rsvp = new EventRsvp
        {
            EventId = 1,
            MemberId = 789,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 150.00m, // Event + membership
            StripePaymentIntentId = "pi_BUNDLE123",
            MembershipUpgradeTypeId = 3
        };

        Assert.That(rsvp.Status, Is.EqualTo(RsvpStatus.Confirmed));
        Assert.That(rsvp.PaymentStatus, Is.EqualTo(GatherGrove.Domain.Enums.PaymentStatus.Succeeded));
        Assert.That(rsvp.PaidAmount, Is.EqualTo(150.00m));
        Assert.That(rsvp.MembershipUpgradeTypeId, Is.EqualTo(3));
    }

    #endregion
}
