using NUnit.Framework;
using Microsoft.Playwright;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;

namespace GatherGrove.E2E.Tests;

/// <summary>
/// TDD End-to-End Tests for Paid Events Functionality
/// Tests complete user workflows from browser interaction to database
/// Written BEFORE implementation following RED-GREEN-REFACTOR
/// </summary>
[TestFixture]
public class PaidEventsE2ETests
{
    private WebApplicationFactory<Program> _factory;
    private IBrowser _browser;
    private IBrowserContext _context;
    private IPage _page;
    private GatherGroveDbContext _dbContext;

    [OneTimeSetUp]
    public async Task OneTimeSetUp()
    {
        // Setup test application factory
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Replace real database with test database
                    services.RemoveDbContext<GatherGroveDbContext>();
                    services.AddDbContext<GatherGroveDbContext>(options =>
                        options.UseInMemoryDatabase("E2ETestDb"));

                    // Mock Stripe services for testing
                    services.AddScoped<IStripeService, MockStripeService>();
                });
            });

        // Setup Playwright
        var playwright = await Playwright.CreateAsync();
        _browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true // Set to false for debugging
        });
    }

    [SetUp]
    public async Task SetUp()
    {
        _context = await _browser.NewContextAsync();
        _page = await _context.NewPageAsync();

        // Setup test database
        using var scope = _factory.Services.CreateScope();
        _dbContext = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        await _dbContext.Database.EnsureCreatedAsync();
        await SeedTestData();
    }

    [TearDown]
    public async Task TearDown()
    {
        await _page.CloseAsync();
        await _context.CloseAsync();
        await _dbContext.Database.EnsureDeletedAsync();
    }

    [OneTimeTearDown]
    public async Task OneTimeTearDown()
    {
        await _browser.CloseAsync();
        await _factory.DisposeAsync();
    }

    [Test]
    public async Task CreatePaidEvent_CompleteWorkflow_ShouldCreateEventSuccessfully()
    {
        // Arrange - Login as club admin
        await LoginAsClubAdmin();

        // Act - Navigate to create event page
        await _page.GotoAsync($"{_factory.Server.BaseAddress}events/create");
        await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Fill out event details
        await _page.FillAsync("[data-testid='event-name']", "Premium Workshop");
        await _page.FillAsync("[data-testid='event-description']", "Advanced training session");
        await _page.FillAsync("[data-testid='event-location']", "Conference Center");
        
        // Set event date to 30 days from now
        var eventDate = DateTime.Now.AddDays(30).ToString("yyyy-MM-dd");
        await _page.FillAsync("[data-testid='event-date']", eventDate);
        await _page.FillAsync("[data-testid='event-time']", "14:00");

        // Enable paid event
        await _page.CheckAsync("[data-testid='enable-paid-event']");

        // Fill pricing details
        await _page.FillAsync("[data-testid='event-price']", "149.99");
        await _page.SelectOptionAsync("[data-testid='event-currency']", "USD");
        
        // Set early bird pricing
        await _page.CheckAsync("[data-testid='enable-early-bird']");
        await _page.FillAsync("[data-testid='early-bird-price']", "119.99");
        
        var earlyBirdDate = DateTime.Now.AddDays(14).ToString("yyyy-MM-dd");
        await _page.FillAsync("[data-testid='early-bird-deadline']", earlyBirdDate);

        // Set capacity
        await _page.FillAsync("[data-testid='event-capacity']", "50");

        // Select refund policy
        await _page.SelectOptionAsync("[data-testid='refund-policy']", "FullRefundUntil48Hours");

        // Submit form
        await _page.ClickAsync("[data-testid='create-event-button']");

        // Assert - Wait for success message and redirect
        await _page.WaitForSelectorAsync("[data-testid='success-message']");
        var successMessage = await _page.TextContentAsync("[data-testid='success-message']");
        Assert.That(successMessage, Does.Contain("Event created successfully"));

        // Verify event appears in events list
        await _page.WaitForURLAsync("**/events");
        await _page.WaitForSelectorAsync("[data-testid='event-card']");
        
        var eventCard = _page.Locator("[data-testid='event-card']").First;
        var eventTitle = await eventCard.Locator("[data-testid='event-title']").TextContentAsync();
        var eventPrice = await eventCard.Locator("[data-testid='event-price']").TextContentAsync();
        
        Assert.That(eventTitle, Is.EqualTo("Premium Workshop"));
        Assert.That(eventPrice, Does.Contain("$119.99")); // Should show early bird price

        // Verify in database
        var createdEvent = await _dbContext.Events
            .FirstOrDefaultAsync(e => e.Name == "Premium Workshop");
        
        Assert.That(createdEvent, Is.Not.Null);
        Assert.That(createdEvent.Price, Is.EqualTo(149.99m));
        Assert.That(createdEvent.EarlyBirdPrice, Is.EqualTo(119.99m));
        Assert.That(createdEvent.IsPaid, Is.True);
    }

    [Test]
    public async Task RegisterForPaidEvent_WithValidPayment_ShouldCompleteRegistration()
    {
        // Arrange - Create paid event and login as member
        var eventId = await CreateTestPaidEvent();
        await LoginAsMember();

        // Act - Navigate to event registration page
        await _page.GotoAsync($"{_factory.Server.BaseAddress}events/{eventId}");
        await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Verify pricing is displayed
        var displayedPrice = await _page.TextContentAsync("[data-testid='current-price']");
        Assert.That(displayedPrice, Does.Contain("$79.99")); // Early bird price

        // Click register button
        await _page.ClickAsync("[data-testid='register-button']");

        // Should redirect to payment page
        await _page.WaitForURLAsync("**/payment/**");

        // Fill payment form
        await _page.FillAsync("[data-testid='cardholder-name']", "John Doe");
        await _page.FillAsync("[data-testid='card-number']", "4242424242424242"); // Stripe test card
        await _page.FillAsync("[data-testid='card-expiry']", "12/25");
        await _page.FillAsync("[data-testid='card-cvc']", "123");
        await _page.FillAsync("[data-testid='billing-email']", "john.doe@example.com");

        // Submit payment
        await _page.ClickAsync("[data-testid='complete-payment-button']");

        // Wait for payment processing
        await _page.WaitForSelectorAsync("[data-testid='payment-success']", new PageWaitForSelectorOptions
        {
            Timeout = 30000 // 30 seconds for payment processing
        });

        // Assert - Verify success message
        var successMessage = await _page.TextContentAsync("[data-testid='payment-success']");
        Assert.That(successMessage, Does.Contain("Registration successful"));

        // Verify registration in database
        var registration = await _dbContext.EventRsvps
            .Include(r => r.Member)
            .FirstOrDefaultAsync(r => r.EventId == eventId && r.Member.Email == "john.doe@example.com");

        Assert.That(registration, Is.Not.Null);
        Assert.That(registration.PaymentStatus, Is.EqualTo(PaymentStatus.Paid));
        Assert.That(registration.PaidAmount, Is.EqualTo(79.99m)); // Early bird price
    }

    [Test]
    public async Task RegisterForPaidEvent_WithFailedPayment_ShouldShowErrorAndRetryOption()
    {
        // Arrange - Create paid event and login as member
        var eventId = await CreateTestPaidEvent();
        await LoginAsMember();

        // Act - Navigate to event and attempt registration
        await _page.GotoAsync($"{_factory.Server.BaseAddress}events/{eventId}");
        await _page.ClickAsync("[data-testid='register-button']");
        await _page.WaitForURLAsync("**/payment/**");

        // Use declined test card
        await _page.FillAsync("[data-testid='cardholder-name']", "Jane Doe");
        await _page.FillAsync("[data-testid='card-number']", "4000000000000002"); // Declined card
        await _page.FillAsync("[data-testid='card-expiry']", "12/25");
        await _page.FillAsync("[data-testid='card-cvc']", "123");
        await _page.FillAsync("[data-testid='billing-email']", "jane.doe@example.com");

        await _page.ClickAsync("[data-testid='complete-payment-button']");

        // Assert - Should show payment error
        await _page.WaitForSelectorAsync("[data-testid='payment-error']");
        var errorMessage = await _page.TextContentAsync("[data-testid='payment-error']");
        Assert.That(errorMessage, Does.Contain("card was declined").Or.Contain("payment failed"));

        // Should show retry option
        var retryButton = _page.Locator("[data-testid='retry-payment-button']");
        await Expect(retryButton).ToBeVisibleAsync();

        // Verify no registration was created
        var registration = await _dbContext.EventRsvps
            .Include(r => r.Member)
            .FirstOrDefaultAsync(r => r.EventId == eventId && r.Member.Email == "jane.doe@example.com");

        Assert.That(registration, Is.Null);
    }

    [Test]
    public async Task RegisterForPaidEvent_WhenEventFull_ShouldShowCapacityError()
    {
        // Arrange - Create event with capacity of 1 and fill it
        var eventId = await CreateTestPaidEventWithCapacity(1);
        await FillEventToCapacity(eventId);
        await LoginAsMember();

        // Act - Attempt to register for full event
        await _page.GotoAsync($"{_factory.Server.BaseAddress}events/{eventId}");
        await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Assert - Should show event is full
        var statusMessage = await _page.TextContentAsync("[data-testid='event-status']");
        Assert.That(statusMessage, Does.Contain("Event is full").Or.Contain("Sold out"));

        // Register button should be disabled
        var registerButton = _page.Locator("[data-testid='register-button']");
        await Expect(registerButton).ToBeDisabledAsync();
    }

    [Test]
    public async Task ViewEventRevenue_AsClubAdmin_ShouldDisplayRevenueAnalytics()
    {
        // Arrange - Create paid event with registrations and login as admin
        var eventId = await CreateTestPaidEventWithRegistrations();
        await LoginAsClubAdmin();

        // Act - Navigate to event analytics page
        await _page.GotoAsync($"{_factory.Server.BaseAddress}events/{eventId}/analytics");
        await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Assert - Verify revenue metrics are displayed
        var totalRevenue = await _page.TextContentAsync("[data-testid='total-revenue']");
        var paidRegistrations = await _page.TextContentAsync("[data-testid='paid-registrations']");
        var averageTicketPrice = await _page.TextContentAsync("[data-testid='average-ticket-price']");

        Assert.That(totalRevenue, Does.Contain("$")); // Should show currency
        Assert.That(paidRegistrations, Does.Match(@"\d+")); // Should be a number
        Assert.That(averageTicketPrice, Does.Contain("$"));

        // Verify charts are present
        await Expect(_page.Locator("[data-testid='revenue-chart']")).ToBeVisibleAsync();
        await Expect(_page.Locator("[data-testid='registration-timeline']")).ToBeVisibleAsync();
    }

    [Test]
    public async Task ProcessRefund_AsClubAdmin_ShouldCompleteRefundWorkflow()
    {
        // Arrange - Create paid event with registration and login as admin
        var (eventId, registrationId) = await CreateTestPaidEventWithRegistration();
        await LoginAsClubAdmin();

        // Act - Navigate to event registrations page
        await _page.GotoAsync($"{_factory.Server.BaseAddress}events/{eventId}/registrations");
        await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Find registration row and click refund button
        var registrationRow = _page.Locator($"[data-registration-id='{registrationId}']");
        await registrationRow.Locator("[data-testid='refund-button']").ClickAsync();

        // Fill refund form
        await _page.WaitForSelectorAsync("[data-testid='refund-modal']");
        await _page.FillAsync("[data-testid='refund-amount']", "79.99");
        await _page.FillAsync("[data-testid='refund-reason']", "Event cancelled");
        await _page.ClickAsync("[data-testid='process-refund-button']");

        // Assert - Wait for success confirmation
        await _page.WaitForSelectorAsync("[data-testid='refund-success']");
        var successMessage = await _page.TextContentAsync("[data-testid='refund-success']");
        Assert.That(successMessage, Does.Contain("Refund processed successfully"));

        // Verify refund status in registration list
        var refundStatus = await registrationRow.Locator("[data-testid='payment-status']").TextContentAsync();
        Assert.That(refundStatus, Does.Contain("Refunded"));

        // Verify in database
        var registration = await _dbContext.EventRsvps.FindAsync(registrationId);
        Assert.That(registration.PaymentStatus, Is.EqualTo(PaymentStatus.Refunded));
    }

    [Test]
    public async Task UpdateEventPricing_AsClubAdmin_ShouldUpdatePricingSuccessfully()
    {
        // Arrange - Create paid event and login as admin
        var eventId = await CreateTestPaidEvent();
        await LoginAsClubAdmin();

        // Act - Navigate to event edit page
        await _page.GotoAsync($"{_factory.Server.BaseAddress}events/{eventId}/edit");
        await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Update pricing
        await _page.FillAsync("[data-testid='event-price']", "199.99");
        await _page.FillAsync("[data-testid='early-bird-price']", "159.99");

        // Save changes
        await _page.ClickAsync("[data-testid='save-changes-button']");

        // Assert - Wait for success message
        await _page.WaitForSelectorAsync("[data-testid='update-success']");
        var successMessage = await _page.TextContentAsync("[data-testid='update-success']");
        Assert.That(successMessage, Does.Contain("Event updated successfully"));

        // Verify pricing is updated on event page
        await _page.GotoAsync($"{_factory.Server.BaseAddress}events/{eventId}");
        var displayedPrice = await _page.TextContentAsync("[data-testid='current-price']");
        Assert.That(displayedPrice, Does.Contain("$159.99")); // Early bird price

        // Verify in database
        var updatedEvent = await _dbContext.Events.FindAsync(eventId);
        Assert.That(updatedEvent.Price, Is.EqualTo(199.99m));
        Assert.That(updatedEvent.EarlyBirdPrice, Is.EqualTo(159.99m));
    }

    [Test]
    public async Task ApplyPromoCode_WithValidCode_ShouldApplyDiscount()
    {
        // Arrange - Create paid event with promo code
        var eventId = await CreateTestPaidEventWithPromoCode();
        await LoginAsMember();

        // Act - Navigate to event registration
        await _page.GotoAsync($"{_factory.Server.BaseAddress}events/{eventId}");
        await _page.ClickAsync("[data-testid='register-button']");
        await _page.WaitForURLAsync("**/payment/**");

        // Apply promo code
        await _page.ClickAsync("[data-testid='apply-promo-code-button']");
        await _page.FillAsync("[data-testid='promo-code-input']", "SAVE20");
        await _page.ClickAsync("[data-testid='apply-code-button']");

        // Assert - Verify discount is applied
        await _page.WaitForSelectorAsync("[data-testid='discount-applied']");
        var discountMessage = await _page.TextContentAsync("[data-testid='discount-applied']");
        Assert.That(discountMessage, Does.Contain("20% discount applied"));

        var finalPrice = await _page.TextContentAsync("[data-testid='final-price']");
        Assert.That(finalPrice, Does.Contain("$63.99")); // $79.99 - 20% = $63.99
    }

    [Test]
    public async Task ConvertFreeEventToPaid_AsClubAdmin_ShouldUpdateEventSuccessfully()
    {
        // Arrange - Create free event and login as admin
        var eventId = await CreateTestFreeEvent();
        await LoginAsClubAdmin();

        // Act - Navigate to event and convert to paid
        await _page.GotoAsync($"{_factory.Server.BaseAddress}events/{eventId}");
        await _page.ClickAsync("[data-testid='convert-to-paid-button']");

        // Fill pricing form
        await _page.WaitForSelectorAsync("[data-testid='convert-modal']");
        await _page.FillAsync("[data-testid='new-price']", "49.99");
        await _page.SelectOptionAsync("[data-testid='new-currency']", "USD");
        await _page.CheckAsync("[data-testid='notify-existing-registrants']");
        await _page.ClickAsync("[data-testid='confirm-conversion-button']");

        // Assert - Wait for success confirmation
        await _page.WaitForSelectorAsync("[data-testid='conversion-success']");
        var successMessage = await _page.TextContentAsync("[data-testid='conversion-success']");
        Assert.That(successMessage, Does.Contain("Event converted to paid successfully"));

        // Verify event now shows as paid
        await _page.ReloadAsync();
        var eventPrice = await _page.TextContentAsync("[data-testid='event-price']");
        Assert.That(eventPrice, Does.Contain("$49.99"));

        // Verify in database
        var convertedEvent = await _dbContext.Events.FindAsync(eventId);
        Assert.That(convertedEvent.IsPaid, Is.True);
        Assert.That(convertedEvent.Price, Is.EqualTo(49.99m));
    }

    // Helper methods for test setup
    private async Task SeedTestData()
    {
        var user = new User
        {
            Id = 1,
            FullName = "Test Admin",
            Email = "admin@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };

        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            FullName = "Test Member",
            Email = "member@test.com",
            JoinedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Id = 1,
            Name = "Test Club",
            OwnerId = 1,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        _dbContext.Members.Add(member);
        _dbContext.Clubs.Add(club);
        await _dbContext.SaveChangesAsync();
    }

    private async Task LoginAsClubAdmin()
    {
        await _page.GotoAsync($"{_factory.Server.BaseAddress}login");
        await _page.FillAsync("[data-testid='email']", "admin@test.com");
        await _page.FillAsync("[data-testid='password']", "password");
        await _page.ClickAsync("[data-testid='login-button']");
        await _page.WaitForURLAsync("**/dashboard");
    }

    private async Task LoginAsMember()
    {
        await _page.GotoAsync($"{_factory.Server.BaseAddress}login");
        await _page.FillAsync("[data-testid='email']", "member@test.com");
        await _page.FillAsync("[data-testid='password']", "password");
        await _page.ClickAsync("[data-testid='login-button']");
        await _page.WaitForURLAsync("**/dashboard");
    }

    private async Task<int> CreateTestPaidEvent()
    {
        var eventEntity = new Event
        {
            ClubId = 1,
            Name = "Test Paid Event",
            Description = "Test Description",
            Location = "Test Location",
            EventDateTime = DateTime.Now.AddDays(30),
            Price = 99.99m,
            EarlyBirdPrice = 79.99m,
            EarlyBirdDeadline = DateTime.Now.AddDays(14),
            Currency = "USD",
            IsPaid = true,
            MaxCapacity = 100,
            RefundPolicy = RefundPolicyType.FullRefundUntil48Hours,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Events.Add(eventEntity);
        await _dbContext.SaveChangesAsync();
        return eventEntity.Id;
    }

    private async Task<int> CreateTestPaidEventWithCapacity(int capacity)
    {
        var eventEntity = new Event
        {
            ClubId = 1,
            Name = "Limited Capacity Event",
            Price = 50.00m,
            Currency = "USD",
            IsPaid = true,
            MaxCapacity = capacity,
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Small Venue",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Events.Add(eventEntity);
        await _dbContext.SaveChangesAsync();
        return eventEntity.Id;
    }

    private async Task<int> CreateTestFreeEvent()
    {
        var eventEntity = new Event
        {
            ClubId = 1,
            Name = "Free Event",
            Price = 0.00m,
            Currency = "USD",
            IsPaid = false,
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Events.Add(eventEntity);
        await _dbContext.SaveChangesAsync();
        return eventEntity.Id;
    }

    private async Task<int> CreateTestPaidEventWithPromoCode()
    {
        var eventId = await CreateTestPaidEvent();
        
        var promoCode = new PromoCode
        {
            EventId = eventId,
            Code = "SAVE20",
            DiscountType = DiscountType.Percentage,
            DiscountValue = 20.0m,
            ExpiryDate = DateTime.Now.AddDays(30),
            UsageLimit = 100,
            TimesUsed = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.PromoCodes.Add(promoCode);
        await _dbContext.SaveChangesAsync();
        return eventId;
    }

    private async Task FillEventToCapacity(int eventId)
    {
        var member = new Member
        {
            ClubId = 1,
            FullName = "Capacity Filler",
            Email = "filler@example.com",
            JoinedAt = DateTime.UtcNow
        };
        _dbContext.Members.Add(member);
        await _dbContext.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = eventId,
            MemberId = member.Id,
            Status = RsvpStatus.Going,
            PaymentStatus = PaymentStatus.Paid,
            PaidAmount = 50.00m,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.EventRsvps.Add(rsvp);
        await _dbContext.SaveChangesAsync();
    }

    private async Task<int> CreateTestPaidEventWithRegistrations()
    {
        var eventId = await CreateTestPaidEvent();
        
        for (int i = 1; i <= 5; i++)
        {
            var member = new Member
            {
                ClubId = 1,
                FullName = $"Attendee {i}",
                Email = $"attendee{i}@example.com",
                JoinedAt = DateTime.UtcNow
            };
            _dbContext.Members.Add(member);
        }
        await _dbContext.SaveChangesAsync();

        var members = await _dbContext.Members.Where(m => m.ClubId == 1).ToListAsync();
        foreach (var member in members.Skip(1)) // Skip the first member (admin)
        {
            var rsvp = new EventRsvp
            {
                EventId = eventId,
                MemberId = member.Id,
                Status = RsvpStatus.Going,
                PaymentStatus = PaymentStatus.Paid,
                PaidAmount = 79.99m,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.EventRsvps.Add(rsvp);
        }
        await _dbContext.SaveChangesAsync();

        return eventId;
    }

    private async Task<(int eventId, int registrationId)> CreateTestPaidEventWithRegistration()
    {
        var eventId = await CreateTestPaidEvent();
        
        var member = new Member
        {
            ClubId = 1,
            FullName = "Refund Test Member",
            Email = "refund@example.com",
            JoinedAt = DateTime.UtcNow
        };
        _dbContext.Members.Add(member);
        await _dbContext.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = eventId,
            MemberId = member.Id,
            Status = RsvpStatus.Going,
            PaymentStatus = PaymentStatus.Paid,
            PaidAmount = 79.99m,
            StripePaymentIntentId = "pi_test123",
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.EventRsvps.Add(rsvp);
        await _dbContext.SaveChangesAsync();

        return (eventId, rsvp.Id);
    }
}

// Mock Stripe service for testing
public class MockStripeService : IStripeService
{
    public async Task<StripePaymentResult> CreatePaymentIntentAsync(decimal amount, string currency)
    {
        // Simulate payment based on card number in test
        await Task.Delay(100); // Simulate processing time
        
        return new StripePaymentResult
        {
            Success = true,
            PaymentIntentId = "pi_test_" + Guid.NewGuid().ToString("N")[..8],
            ClientSecret = "pi_test_client_secret"
        };
    }

    public async Task<StripeRefundResult> CreateRefundAsync(string paymentIntentId, decimal amount)
    {
        await Task.Delay(100);
        
        return new StripeRefundResult
        {
            Success = true,
            RefundId = "re_test_" + Guid.NewGuid().ToString("N")[..8]
        };
    }
}

// Additional entities needed for testing
public class PromoCode
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public string Code { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public int? UsageLimit { get; set; }
    public int TimesUsed { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}