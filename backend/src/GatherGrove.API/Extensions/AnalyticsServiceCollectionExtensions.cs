using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.API.Hubs;

namespace GatherGrove.API.Extensions;

/// <summary>
/// Extension methods for configuring advanced analytics services
/// </summary>
public static class AnalyticsServiceCollectionExtensions
{
    /// <summary>
    /// Configure advanced analytics services for US-004
    /// </summary>
    public static IServiceCollection AddAdvancedAnalytics(this IServiceCollection services, IConfiguration configuration)
    {
        // Register analytics services
        services.AddScoped<GatherGrove.Application.Services.Interfaces.IAdvancedAnalyticsService, AdvancedAnalyticsService>();
        services.AddScoped<IAdvancedAnalyticsRepository, AdvancedAnalyticsRepository>();

        // Register background service (temporarily disabled while fixing compilation issues)
        // services.AddHostedService<AdvancedAnalyticsBackgroundService>();

        // Configure SignalR for real-time analytics
        services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = true;
            options.KeepAliveInterval = TimeSpan.FromSeconds(15);
            options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
        });

        // Configure Redis cache for performance (if available)
        var redisConnectionString = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrEmpty(redisConnectionString))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnectionString;
                options.InstanceName = "GatherGrove_Analytics";
            });
        }
        else
        {
            // Use in-memory cache as fallback
            services.AddMemoryCache();
        }

        return services;
    }

    /// <summary>
    /// Configure analytics middleware and endpoints
    /// </summary>
    public static WebApplication UseAdvancedAnalytics(this WebApplication app)
    {
        // Map SignalR hub
        app.MapHub<AnalyticsHub>("/hubs/analytics");

        return app;
    }
}