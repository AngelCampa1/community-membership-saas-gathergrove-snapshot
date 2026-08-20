using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using GatherGrove.API.Tests.Helpers;
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Custom WebApplicationFactory that prevents database seeding and startup delays during testing
/// </summary>
public class TestWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Set environment variables before configuration is built
        Environment.SetEnvironmentVariable("JWT_SECRET_KEY", "GatherGrove-Test-Secret-Key-For-JWT-Token-Generation-2024-Testing-Environment-Secure");
        Environment.SetEnvironmentVariable("USE_INMEMORY_DB", "true");
        Environment.SetEnvironmentVariable("SKIP_DB_SEEDING", "true");
        Environment.SetEnvironmentVariable("SKIP_DB_MIGRATIONS", "true");
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");
        Environment.SetEnvironmentVariable("DISABLE_HEALTH_CHECKS", "true");
        Environment.SetEnvironmentVariable("DISABLE_TELEMETRY", "true");

        // Disable logging completely during tests for maximum performance
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.SetMinimumLevel(LogLevel.None);
        });

        // Set test environment
        builder.UseEnvironment("Testing");

        // Add test configuration with highest priority
        builder.ConfigureAppConfiguration((context, config) =>
        {
            // Add our test configuration at the end so it overrides everything else
            config.AddInMemoryCollection(new[]
            {
                KeyValuePair.Create("JwtSettings:SecretKey", "GatherGrove-Test-Secret-Key-For-JWT-Token-Generation-2024-Testing-Environment-Secure"),
                KeyValuePair.Create("JwtSettings:Issuer", "GatherGrove"),
                KeyValuePair.Create("JwtSettings:Audience", "GatherGrove"),
                KeyValuePair.Create("JwtSettings:TokenLifetimeInMinutes", "60"),
                KeyValuePair.Create("Stripe:SecretKey", "sk_test_123456789"),
                KeyValuePair.Create("Stripe:PublishableKey", "pk_test_123456789"),
                KeyValuePair.Create("App:FrontendUrl", "http://localhost:3000"),
                KeyValuePair.Create("App:ApiUrl", "http://localhost:0"), // Use dynamic port
                // Disable Azure services for testing
                KeyValuePair.Create("AzureCommunicationServices:ConnectionString", ""),
                KeyValuePair.Create("Sentry:Dsn", ""),
                KeyValuePair.Create("AZURE_CLIENT_ID", ""),
                KeyValuePair.Create("AZURE_CLIENT_SECRET", ""),
                KeyValuePair.Create("AZURE_TENANT_ID", ""),
                // CSRF secret key for test environment
                KeyValuePair.Create("Security:CSRFSecretKey", "test-csrf-secret-key-minimum-32-characters-for-testing-environment-12345")
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove any Azure-dependent services and replace with test mocks
            var emailServiceDescriptors = services
                .Where(d => d.ServiceType == typeof(IEmailService))
                .ToList();

            foreach (var descriptor in emailServiceDescriptors)
            {
                services.Remove(descriptor);
            }

            // Replace with test-safe mock implementations
            services.AddScoped<IEmailService, MockEmailService>();

            // Replace payment services with mocks to bypass Stripe API calls in tests
            var nonMemberPaymentServiceDescriptor = services.FirstOrDefault(d => d.ServiceType == typeof(INonMemberEventPaymentService));
            if (nonMemberPaymentServiceDescriptor != null)
            {
                services.Remove(nonMemberPaymentServiceDescriptor);
            }
            services.AddScoped<INonMemberEventPaymentService, GatherGrove.API.Tests.Mocks.MockNonMemberEventPaymentService>();

            var eventPaymentServiceDescriptor = services.FirstOrDefault(d => d.ServiceType == typeof(IEventPaymentService));
            if (eventPaymentServiceDescriptor != null)
            {
                services.Remove(eventPaymentServiceDescriptor);
            }
            services.AddScoped<IEventPaymentService, GatherGrove.API.Tests.Mocks.MockEventPaymentService>();

            // Replace authorization services with test implementations
            var clubAuthDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(GatherGrove.Infrastructure.Services.IClubAuthorizationService));
            if (clubAuthDescriptor != null) services.Remove(clubAuthDescriptor);

            var applicationClubAuthDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(GatherGrove.Application.Services.IClubAuthorizationService));
            if (applicationClubAuthDescriptor != null) services.Remove(applicationClubAuthDescriptor);

            var clubTierDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IClubTierService));
            if (clubTierDescriptor != null) services.Remove(clubTierDescriptor);

            services.AddScoped<GatherGrove.Infrastructure.Services.IClubAuthorizationService, TestClubAuthorizationService>();
            services.AddScoped<GatherGrove.Application.Services.IClubAuthorizationService, TestClubAuthorizationService>();
            services.AddScoped<IClubTierService, TestClubTierService>();

            // Remove existing JWT authentication and replace with test authentication
            var authDescriptor = services.FirstOrDefault(d => d.ServiceType == typeof(Microsoft.AspNetCore.Authentication.IAuthenticationService));

            // Configure test authentication as the default scheme
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = "Test";
                options.DefaultChallengeScheme = "Test";
                options.DefaultScheme = "Test";
            })
                .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", options => { });

            // Override authorization policy provider to allow all requests in tests
            services.AddSingleton<IAuthorizationPolicyProvider, TestAuthorizationPolicyProvider>();

            // Override authorization handlers for testing
            services.AddScoped<IAuthorizationHandler, TestAdminOnlyHandler>();
            services.AddScoped<IAuthorizationHandler, TestUnlimitedTierHandler>();
            services.AddScoped<IAuthorizationHandler, TestRolesAuthorizationHandler>();
        });

        base.ConfigureWebHost(builder);
    }
}
