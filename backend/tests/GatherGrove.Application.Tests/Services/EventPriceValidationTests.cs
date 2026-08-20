using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Validators;
using GatherGrove.Application.Services;
using Microsoft.Extensions.Logging;
using Moq;
using System;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for event price validation logic
/// </summary>
[TestFixture]
public class EventPriceValidationTests
{
    private Mock<ILogger<EventService>> _mockLogger;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<EventService>>();
    }

    [Test]
    [TestCase(-1.00)]
    [TestCase(-0.01)]
    [TestCase(-100.00)]
    public void ValidateEventPrices_WithNegativeMemberPrice_ShouldThrowArgumentException(decimal price)
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = price,
            NonMemberPrice = 10.00m,
            IsFree = false
        };

        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => EventPriceValidator.ValidateEventPrices(request));
        Assert.That(exception.Message, Does.Contain("Member price cannot be negative"));
    }

    [Test]
    [TestCase(-1.00)]
    [TestCase(-0.01)]
    [TestCase(-100.00)]
    public void ValidateEventPrices_WithNegativeNonMemberPrice_ShouldThrowArgumentException(decimal price)
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = 10.00m,
            NonMemberPrice = price,
            IsFree = false
        };

        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => EventPriceValidator.ValidateEventPrices(request));
        Assert.That(exception.Message, Does.Contain("Non-member price cannot be negative"));
    }

    [Test]
    [TestCase(0.00)]
    [TestCase(0.01)]
    [TestCase(99.99)]
    [TestCase(500.00)]
    public void ValidateEventPrices_WithValidMemberPrice_ShouldNotThrow(decimal price)
    {
        // Arrange - NonMemberPrice should be >= MemberPrice
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = price,
            NonMemberPrice = price + 10.00m, // Ensure NonMemberPrice >= MemberPrice
            IsFree = false
        };

        // Act & Assert
        Assert.DoesNotThrow(() => EventPriceValidator.ValidateEventPrices(request));
    }

    [Test]
    [TestCase(0.00)]
    [TestCase(0.01)]
    [TestCase(99.99)]
    [TestCase(500.00)]
    public void ValidateEventPrices_WithValidNonMemberPrice_ShouldNotThrow(decimal price)
    {
        // Arrange - MemberPrice should be <= NonMemberPrice
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = Math.Min(price, 10.00m), // Ensure MemberPrice <= NonMemberPrice
            NonMemberPrice = price,
            IsFree = false
        };

        // Act & Assert
        Assert.DoesNotThrow(() => EventPriceValidator.ValidateEventPrices(request));
    }

    [Test]
    public void ValidateEventPrices_WithNullPrices_ShouldNotThrow()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = null,
            NonMemberPrice = null,
            IsFree = true
        };

        // Act & Assert
        Assert.DoesNotThrow(() => EventPriceValidator.ValidateEventPrices(request));
    }

    [Test]
    public void ValidateEventPrices_WithMemberPriceGreaterThanNonMemberPrice_ShouldThrowArgumentException()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = 25.00m,
            NonMemberPrice = 15.00m,
            IsFree = false
        };

        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => EventPriceValidator.ValidateEventPrices(request));
        Assert.That(exception.Message, Does.Contain("Member price cannot be greater than non-member price"));
    }

    [Test]
    public void ValidateEventPrices_WithMemberPriceEqualToNonMemberPrice_ShouldNotThrow()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = 20.00m,
            NonMemberPrice = 20.00m,
            IsFree = false
        };

        // Act & Assert
        Assert.DoesNotThrow(() => EventPriceValidator.ValidateEventPrices(request));
    }

    [Test]
    public void ValidateEventPrices_WithMemberPriceLessThanNonMemberPrice_ShouldNotThrow()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = 15.00m,
            NonMemberPrice = 25.00m,
            IsFree = false
        };

        // Act & Assert
        Assert.DoesNotThrow(() => EventPriceValidator.ValidateEventPrices(request));
    }

    [Test]
    [TestCase(10000.01)]
    [TestCase(99999.99)]
    public void ValidateEventPrices_WithExcessivelyHighPrices_ShouldThrowArgumentException(decimal price)
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = price,
            NonMemberPrice = price,
            IsFree = false
        };

        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => EventPriceValidator.ValidateEventPrices(request));
        Assert.That(exception.Message, Does.Contain("Price cannot exceed $10,000"));
    }

    [Test]
    [TestCase(9999.99)]
    [TestCase(10000.00)]
    public void ValidateEventPrices_WithAcceptableHighPrices_ShouldNotThrow(decimal price)
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = price,
            NonMemberPrice = price,
            IsFree = false
        };

        // Act & Assert
        Assert.DoesNotThrow(() => EventPriceValidator.ValidateEventPrices(request));
    }

    [Test]
    public void ValidateEventPrices_WithPricesAndIsFreeTrue_ShouldAllowZeroPrices()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            IsFree = true
        };

        // Act & Assert
        Assert.DoesNotThrow(() => EventPriceValidator.ValidateEventPrices(request));
    }

    [Test]
    public void ValidateEventPrices_WithPricesAndIsFreeTrue_ShouldAllowNullPrices()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = null,
            NonMemberPrice = null,
            IsFree = true
        };

        // Act & Assert
        Assert.DoesNotThrow(() => EventPriceValidator.ValidateEventPrices(request));
    }
}