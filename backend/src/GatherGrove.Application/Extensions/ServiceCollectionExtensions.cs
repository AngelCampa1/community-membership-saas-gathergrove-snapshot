using Microsoft.Extensions.DependencyInjection;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;

namespace GatherGrove.Application.Extensions;

/// <summary>
/// Extension methods for IServiceCollection to register application services
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds application services to the dependency injection container
    /// </summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Core services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ILoginAttemptService, LoginAttemptService>();
        services.AddScoped<IClubAuthorizationService, ClubAuthorizationService>();

        // Analytics and engagement services
        services.AddScoped<ILoginActivityService, LoginActivityService>();

        // Event pricing and payment services
        services.AddScoped<IEventPricingService, EventPricingService>();
        services.AddScoped<IStripeService, StripeService>();
        // PaymentService is already registered elsewhere

        return services;
    }
}

