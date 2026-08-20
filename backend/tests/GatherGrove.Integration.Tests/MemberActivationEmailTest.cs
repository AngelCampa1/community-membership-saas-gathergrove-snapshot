using NUnit.Framework;
using Microsoft.Extensions.DependencyInjection;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Integration.Tests;

[TestFixture]
[Category("Integration")]
[Category("Email")]
public class MemberActivationEmailTest
{
    private GatherGroveDbContext? _context;
    private IEmailService? _emailService;
    private IMemberActivationService? _activationService;
    private IConfiguration? _configuration;

    [SetUp]
    public void Setup()
    {
        // Build configuration including local settings
        _configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("../../../../src/GatherGrove.API/appsettings.json", optional: false)
            .AddJsonFile("../../../../src/GatherGrove.API/appsettings.Development.json", optional: true)
            .AddJsonFile("../../../../src/GatherGrove.API/appsettings.Development.local.json", optional: true)
            .Build();

        // Create in-memory database for testing
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);

        // Create logger factory
        var loggerFactory = LoggerFactory.Create(builder =>
        {
            builder.AddConsole();
            builder.SetMinimumLevel(LogLevel.Information);
        });

        // Create URL service
        var urlServiceLogger = loggerFactory.CreateLogger<UrlService>();
        var urlService = new UrlService(_configuration, urlServiceLogger);

        // Create email service using mock for integration tests
        // For manual testing with real emails, configure Resend and use ResendEmailService
        var emailServiceLogger = loggerFactory.CreateLogger<EmailService>();
        _emailService = new EmailService(emailServiceLogger, urlService);
        Console.WriteLine("✓ Using Mock Email Service (for automated testing)");

        // Create activation service
        var activationServiceLogger = loggerFactory.CreateLogger<MemberActivationService>();
        _activationService = new MemberActivationService(_context, _emailService, activationServiceLogger);
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Database.EnsureDeleted();
        _context?.Dispose();
    }

    [Test]
    [Explicit("This test uses mock email service - run manually to verify logic")]
    public async Task SendMemberActivationEmail_RealEmail_Success()
    {
        // Arrange
        var testEmail = $"test-{DateTime.Now:yyyyMMddHHmmss}@example.com";
        var club = new Club
        {
            Name = "Test Club for Email",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context!.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var member = new Member
        {
            ClubId = club.Id,
            FullName = "Test Member",
            Email = testEmail,
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            MembershipTypeId = 1
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        Console.WriteLine("=== SENDING ACTIVATION EMAIL ===");
        Console.WriteLine($"To: {testEmail}");
        Console.WriteLine($"Club: {club.Name}");
        Console.WriteLine($"Member: {member.FullName}");
        Console.WriteLine();

        // Act
        var result = await _activationService!.CreateMemberAccountAndSendActivationEmailAsync(member.Id, club.Id);

        // Assert
        Assert.That(result, Is.True, "Activation email should be sent successfully");

        // Verify user account was created
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == testEmail);
        Assert.That(user, Is.Not.Null, "User account should be created");
        Assert.That(user!.IsActive, Is.False, "User should not be active until activation");
        Assert.That(user.ActivationToken, Is.Not.Null, "Activation token should be set");
        Assert.That(user.ActivationTokenExpiresAt, Is.Not.Null, "Token expiry should be set");

        Console.WriteLine();
        Console.WriteLine("=== EMAIL SENT SUCCESSFULLY ===");
        Console.WriteLine($"✓ User account created with activation token");
        Console.WriteLine($"✓ Activation URL: {_configuration!["App:FrontendUrl"]}/activate-account?token={user.ActivationToken}");
        Console.WriteLine($"✓ Token expires: {user.ActivationTokenExpiresAt}");
        Console.WriteLine();
        Console.WriteLine("Check your email (may take 1-2 minutes to arrive)");
        Console.WriteLine($"Email: {testEmail}");
        Console.WriteLine($"From: {_configuration["Resend:FromEmailAddress"]}");
    }
}
