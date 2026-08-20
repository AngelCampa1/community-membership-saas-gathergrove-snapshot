using Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using System.Threading.Tasks;

namespace GatherGrove.Infrastructure.Tests.Migrations;

/// <summary>
/// Tests for the AddEventPricing migration to ensure pricing columns are correctly added to Events table
/// </summary>
public class AddEventPricingMigrationTests : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly ServiceProvider _serviceProvider;

    public AddEventPricingMigrationTests()
    {
        var services = new ServiceCollection();
        services.AddDbContext<GatherGroveDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));
        
        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        
        // Ensure database is created
        _context.Database.EnsureCreated();
    }

    [Fact]
    public async Task Event_ShouldHave_MemberPriceColumn()
    {
        // Arrange & Act
        var eventEntity = new Event
        {
            ClubId = 1,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = 15.99m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Assert
        var savedEvent = await _context.Events.FirstAsync();
        Assert.Equal(15.99m, savedEvent.MemberPrice);
    }

    [Fact]
    public async Task Event_ShouldHave_NonMemberPriceColumn()
    {
        // Arrange & Act
        var eventEntity = new Event
        {
            ClubId = 1,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            NonMemberPrice = 25.99m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Assert
        var savedEvent = await _context.Events.FirstAsync();
        Assert.Equal(25.99m, savedEvent.NonMemberPrice);
    }

    [Fact]
    public async Task Event_ShouldHave_IsFreeColumn()
    {
        // Arrange & Act
        var eventEntity = new Event
        {
            ClubId = 1,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            IsFree = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Assert
        var savedEvent = await _context.Events.FirstAsync();
        Assert.True(savedEvent.IsFree);
    }

    [Fact]
    public async Task Event_PricingColumns_ShouldAcceptNullValues()
    {
        // Arrange & Act
        var eventEntity = new Event
        {
            ClubId = 1,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = null,
            NonMemberPrice = null,
            IsFree = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Assert
        var savedEvent = await _context.Events.FirstAsync();
        Assert.Null(savedEvent.MemberPrice);
        Assert.Null(savedEvent.NonMemberPrice);
        Assert.False(savedEvent.IsFree);
    }

    [Fact]
    public async Task Event_PricingColumns_ShouldSupportDecimalPrecision()
    {
        // Arrange & Act
        var eventEntity = new Event
        {
            ClubId = 1,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = 123.45m,
            NonMemberPrice = 678.90m,
            IsFree = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Assert
        var savedEvent = await _context.Events.FirstAsync();
        Assert.Equal(123.45m, savedEvent.MemberPrice);
        Assert.Equal(678.90m, savedEvent.NonMemberPrice);
    }

    [Theory]
    [InlineData(0.01)]
    [InlineData(99.99)]
    [InlineData(999.99)]
    public async Task Event_PricingColumns_ShouldAcceptValidPrices(decimal price)
    {
        // Arrange & Act
        var eventEntity = new Event
        {
            ClubId = 1,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = price,
            NonMemberPrice = price + 10,
            IsFree = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Assert
        var savedEvent = await _context.Events.FirstAsync();
        Assert.Equal(price, savedEvent.MemberPrice);
        Assert.Equal(price + 10, savedEvent.NonMemberPrice);
    }

    public void Dispose()
    {
        _context?.Dispose();
        _serviceProvider?.Dispose();
    }
}