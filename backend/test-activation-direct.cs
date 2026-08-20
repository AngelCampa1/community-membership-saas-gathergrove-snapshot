// Simple C# script to test member activation email directly
// Run with: dotnet script test-activation-direct.cs

using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
var testEmail = $"test-{timestamp}@example.com";

Console.WriteLine("=== Testing Member Activation Email ===");
Console.WriteLine($"Test email: {testEmail}");
Console.WriteLine();

// Build configuration
var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("src/GatherGrove.API/appsettings.json", optional: false)
    .AddJsonFile("src/GatherGrove.API/appsettings.Development.json", optional: true)
    .AddJsonFile("src/GatherGrove.API/appsettings.Development.local.json", optional: true)
    .Build();

// Create logger
var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
var logger = loggerFactory.CreateLogger<Program>();

// Create DbContext
var connectionString = configuration.GetConnectionString("DefaultConnection");
var optionsBuilder = new DbContextOptionsBuilder<GatherGroveDbContext>();
optionsBuilder.UseSqlServer(connectionString);
var context = new GatherGroveDbContext(optionsBuilder.Options);

// Create services
var urlServiceLogger = loggerFactory.CreateLogger<UrlService>();
var urlService = new UrlService(configuration, urlServiceLogger);

var emailServiceLogger = loggerFactory.CreateLogger<AcsEmailService>();
var emailService = new AcsEmailService(configuration, emailServiceLogger, urlService);

var activationServiceLogger = loggerFactory.CreateLogger<MemberActivationService>();
var activationService = new MemberActivationService(context, emailService, activationServiceLogger);

Console.WriteLine("Services initialized. Testing email send...");
Console.WriteLine();

// Generate test token
var (token, expiresAt) = activationService.GenerateActivationToken();

Console.WriteLine($"Generated activation token: {token.Substring(0, 20)}...");
Console.WriteLine($"Expires at: {expiresAt}");
Console.WriteLine();

// Send test email directly
Console.WriteLine("Sending activation email via ACS...");
try
{
    await emailService.SendMemberActivationEmailAsync(
        testEmail,
        "Test Member",
        "Test Club",
        token
    );

    Console.WriteLine("✓ Email sent successfully!");
    Console.WriteLine($"  To: {testEmail}");
    Console.WriteLine($"  From: {configuration["AzureCommunicationServices:EmailFromAddress"]}");
    Console.WriteLine($"  Activation URL: {urlService.GenerateActivationUrl(token)}");
}
catch (Exception ex)
{
    Console.WriteLine($"✗ Error sending email: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
}
