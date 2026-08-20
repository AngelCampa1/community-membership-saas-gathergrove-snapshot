using Microsoft.EntityFrameworkCore;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.Configuration;
using System.Reflection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using GatherGrove.API.Middleware;
using static GatherGrove.API.Middleware.EnvironmentExtensions;
using System.Security.Claims;
using GatherGrove.Application.Extensions;
using GatherGrove.API.Extensions;
using GatherGrove.API.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog for structured logging and Application Insights integration
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Load local development settings if they exist
if (builder.Environment.IsDevelopment())
{
    var localSettingsPath = Path.Combine(builder.Environment.ContentRootPath, $"appsettings.{builder.Environment.EnvironmentName}.local.json");
    if (File.Exists(localSettingsPath))
    {
        builder.Configuration.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.local.json", optional: true, reloadOnChange: true);
        Console.WriteLine($"✅ Loaded local development settings from {localSettingsPath}");
    }
}

// Configure URLs based on environment
if (builder.Environment.IsDevelopment())
{
    // Use configuration from appsettings.Development.json
    var apiUrl = builder.Configuration["App:ApiUrl"] ?? "http://localhost:5284";
    var uri = new Uri(apiUrl);
    builder.WebHost.UseUrls($"http://0.0.0.0:{uri.Port}");
}
else
{
    // Use PORT environment variable for Azure App Service
    var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// Add Sentry — always register services so UseSentryTracing() works in pipeline.
// When Dsn is empty Sentry is completely inert (no network calls, no overhead).
var sentryDsn = builder.Configuration["Sentry:Dsn"] ?? "";
builder.WebHost.UseSentry(o =>
{
    o.Dsn = sentryDsn; // Empty DSN = disabled, non-empty = active
    o.Environment = builder.Environment.EnvironmentName.ToLowerInvariant();
    o.TracesSampleRate = 0.2;
    o.SendDefaultPii = false;
    o.AttachStacktrace = true;
    o.MaxBreadcrumbs = 50;
});
Console.WriteLine(string.IsNullOrEmpty(sentryDsn)
    ? "ℹ️  Sentry DSN not configured — error tracking disabled"
    : "✅ Sentry configured");

// Add services to the container
builder.Services.AddControllers(options =>
    {
        // Global filter: validates route {clubId} matches user's ClubId claim (prevents IDOR)
        options.Filters.Add<GatherGrove.API.Middleware.ClubIdValidationFilter>();

        // Normalize DateTimes bound from query string, route, header, or form to
        // Kind=Utc. These never pass through System.Text.Json, so the JSON
        // converters below do not cover them. Must be inserted at index 0 to beat
        // the framework's SimpleTypeModelBinderProvider to DateTime.
        options.ModelBinderProviders.Insert(0, new GatherGrove.API.ModelBinding.UtcDateTimeModelBinderProvider());
    })
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization to accept camelCase from frontend
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;

        // Normalize inbound DateTimes to UTC. PostgreSQL 'timestamp with time zone'
        // rejects Kind=Unspecified, which is what a date-only JSON string produces.
        options.JsonSerializerOptions.Converters.Add(new GatherGrove.API.Serialization.UtcDateTimeConverter());
        options.JsonSerializerOptions.Converters.Add(new GatherGrove.API.Serialization.NullableUtcDateTimeConverter());
    });

// Add SignalR for real-time chat and engagement updates
builder.Services.AddSignalR(options =>
{
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
})
.AddJsonProtocol(options =>
{
    // Hubs use their own JsonSerializerOptions, separate from the MVC pipeline.
    // No hub method takes a DateTime parameter today; this keeps the first one
    // that does from silently reintroducing the Kind=Unspecified failure.
    options.PayloadSerializerOptions.Converters.Add(new GatherGrove.API.Serialization.UtcDateTimeConverter());
    options.PayloadSerializerOptions.Converters.Add(new GatherGrove.API.Serialization.NullableUtcDateTimeConverter());
});

// Add Memory Cache for performance optimization
builder.Services.AddMemoryCache();

// Add Distributed Cache (required for IDistributedCache dependency injection)
// Use in-memory cache for development/testing, Redis for production/self-hosted
if (builder.Environment.IsProduction() || builder.Environment.IsStaging() || builder.Environment.IsEnvironment("SelfHosted"))
{
    // For production/staging, attempt to use Redis if configured
    var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
    if (!string.IsNullOrEmpty(redisConnectionString))
    {
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
            options.InstanceName = "GatherGrove";
        });
        Console.WriteLine("✅ Redis distributed cache configured");
    }
    else
    {
        // Fallback to in-memory distributed cache
        builder.Services.AddDistributedMemoryCache();
        Console.WriteLine("⚠️  Redis not configured, using in-memory distributed cache");
    }
}
else
{
    // For development/testing environments, use in-memory distributed cache
    builder.Services.AddDistributedMemoryCache();
    Console.WriteLine("✅ In-memory distributed cache configured for development");
}

// Add built-in ASP.NET Core Rate Limiting
// Use relaxed limits for Development/Test environments to support E2E testing
var isDevelopment = builder.Environment.IsDevelopment() ||
                    builder.Environment.EnvironmentName == "Test" ||
                    Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";

builder.Services.AddRateLimiter(options =>
{
    // General API rate limiting
    options.AddPolicy("GeneralApi", httpContext =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            RequestClientIpResolver.GetClientIp(httpContext, builder.Configuration),
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = isDevelopment ? 1000 : 100,  // 1000 in dev, 100 in prod
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = isDevelopment ? 50 : 10,
                QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst
            }));

    // Authentication endpoints (more restrictive in production)
    options.AddPolicy("AuthApi", httpContext =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            RequestClientIpResolver.GetClientIp(httpContext, builder.Configuration),
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = isDevelopment ? 100 : 10,   // 100 in dev, 10 in prod
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = isDevelopment ? 20 : 2
            }));

    // Strict policy for sensitive operations
    options.AddPolicy("StrictApi", httpContext =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            RequestClientIpResolver.GetClientIp(httpContext, builder.Configuration),
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = isDevelopment ? 50 : 5,     // 50 in dev, 5 in prod
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = isDevelopment ? 10 : 0
            }));

    // Web Vitals analytics endpoint (allow more requests for performance monitoring)
    options.AddPolicy("WebVitals", httpContext =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            RequestClientIpResolver.GetClientIp(httpContext, builder.Configuration),
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = isDevelopment ? 500 : 50,   // 500 in dev, 50 in prod per minute
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = isDevelopment ? 20 : 5
            }));

    // Webhook endpoint rate limiting (anonymous but needs protection from abuse)
    options.AddPolicy("WebhookApi", httpContext =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            RequestClientIpResolver.GetClientIp(httpContext, builder.Configuration),
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = isDevelopment ? 200 : 60,  // 200 in dev, 60 in prod per minute
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = isDevelopment ? 20 : 5
            }));

    // Global fallback policy
    options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(
        httpContext => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            RequestClientIpResolver.GetClientIp(httpContext, builder.Configuration),
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = isDevelopment ? 10000 : 1000,  // 10000 in dev, 1000 in prod
                Window = TimeSpan.FromHours(1),
                QueueLimit = isDevelopment ? 100 : 20
            }));

    options.RejectionStatusCode = 429;
    options.OnRejected = async (context, token) =>
    {
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
        var clientIp = RequestClientIpResolver.GetClientIp(context.HttpContext, builder.Configuration);

        logger.LogWarning("🚨 Rate limit exceeded for IP {IP} on path {Path}",
            clientIp, context.HttpContext.Request.Path);

        if (context.HttpContext.Response.HasStarted)
            return;

        context.HttpContext.Response.StatusCode = 429;
        context.HttpContext.Response.Headers["Retry-After"] = "60";
        await context.HttpContext.Response.WriteAsync("Rate limit exceeded. Please try again later.", token);
    };
});

// Add HttpContextAccessor for accessing HTTP context in services
builder.Services.AddHttpContextAccessor();


// Add Entity Framework
// Use in-memory database if running on Linux or if LocalDB is not available
Console.WriteLine($"🔍 Platform: {Environment.OSVersion.Platform}");
Console.WriteLine($"🔍 USE_INMEMORY_DB: {Environment.GetEnvironmentVariable("USE_INMEMORY_DB")}");
Console.WriteLine($"🔍 OS Version: {Environment.OSVersion}");

var useInMemoryDb = Environment.GetEnvironmentVariable("USE_INMEMORY_DB")
    ?? builder.Configuration.GetValue<string>("UseInMemoryDatabase");
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Register database logging interceptor
builder.Services.AddScoped<GatherGrove.API.Middleware.DatabaseLoggingInterceptor>();

// Only use in-memory database if explicitly requested via environment variable or configuration
if (useInMemoryDb == "true" || useInMemoryDb?.ToLowerInvariant() == "true")
{
    Console.WriteLine($"🔧 Using In-Memory Database (USE_INMEMORY_DB: {useInMemoryDb})");
    var inMemoryDatabaseName = Environment.GetEnvironmentVariable("INMEMORY_DB_NAME") ?? "GatherGroveDb";
    builder.Services.AddDbContext<GatherGroveDbContext>((serviceProvider, options) =>
        options.UseInMemoryDatabase(inMemoryDatabaseName)
               .AddInterceptors(serviceProvider.GetRequiredService<GatherGrove.API.Middleware.DatabaseLoggingInterceptor>()));
}
else
{
    // Convert PostgreSQL URI format to ADO.NET key-value format if needed
    // Neon.tech provides URIs like: postgresql://user:pass@host/db?sslmode=require
    if (connectionString != null && connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        var uri = new Uri(connectionString);
        var queryParams = System.Web.HttpUtility.ParseQueryString(uri.Query);
        var csb = new Npgsql.NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(uri.UserInfo.Split(':')[0]),
            Password = Uri.UnescapeDataString(uri.UserInfo.Split(':')[1]),
        };
        var sslMode = queryParams["sslmode"];
        if (!string.IsNullOrEmpty(sslMode) && Enum.TryParse<Npgsql.SslMode>(sslMode, true, out var mode))
            csb.SslMode = mode;
        else
            csb.SslMode = Npgsql.SslMode.Require; // Default for Neon
        connectionString = csb.ConnectionString;
    }

    Console.WriteLine("Using PostgreSQL Database");

    // Optimize connection pool for Neon serverless (allow connections to fully close when idle)
    var optimizedConnectionString = new Npgsql.NpgsqlConnectionStringBuilder(connectionString)
    {
        MinPoolSize = 0,
        ConnectionIdleLifetime = 30,
    }.ConnectionString;

    builder.Services.AddDbContext<GatherGroveDbContext>((serviceProvider, options) =>
        options.UseNpgsql(optimizedConnectionString, npgsqlOptions =>
        {
            npgsqlOptions.CommandTimeout(60); // 60 second timeout for commands
            npgsqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(10), null); // Retry logic
        })
        .ConfigureWarnings(warnings =>
        {
            // Suppress pending model changes warning to allow migrations to run
            // This is safe when migrations are properly maintained in version control
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning);
        })
        .AddInterceptors(serviceProvider.GetRequiredService<GatherGrove.API.Middleware.DatabaseLoggingInterceptor>()));
}

// Configure Stripe settings
builder.Services.Configure<StripeSettings>(builder.Configuration.GetSection("Stripe"));

// Add Application Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<ILoginAttemptService, LoginAttemptService>();

// Add External Authentication Services (Google/Apple SSO)
builder.Services.AddHttpClient<IAppleTokenValidator, AppleTokenValidator>();
builder.Services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
builder.Services.AddScoped<IExternalAuthService, ExternalAuthService>();
builder.Services.AddScoped<IMembershipTypeService, MembershipTypeService>();
builder.Services.AddScoped<IMemberService, MemberService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IStripeConnectService, StripeConnectService>();
builder.Services.AddScoped<GatherGrove.Application.Services.IPaymentService, PaymentService>();
builder.Services.AddScoped<IEventPaymentService, EventPaymentService>();
builder.Services.AddScoped<INonMemberEventPaymentService, NonMemberEventPaymentService>();
builder.Services.AddScoped<IEventPaymentAdminService, EventPaymentAdminService>();
// Register Resend email service
builder.Services.Configure<GatherGrove.Application.Configuration.ResendSettings>(
    builder.Configuration.GetSection("Resend"));
builder.Services.AddHttpClient<Resend.ResendClient>();
builder.Services.AddTransient<Resend.IResend, Resend.ResendClient>();
builder.Services.AddScoped<IEmailService, ResendEmailService>();
builder.Services.AddScoped<IResendWebhookService, ResendWebhookService>();
Console.WriteLine("✅ Using Resend for email");
builder.Services.Configure<SequencerSettings>(builder.Configuration.GetSection("Sequencer"));
builder.Services.AddHttpClient<ISequencerService, SequencerService>((serviceProvider, client) =>
{
    var settings = serviceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<SequencerSettings>>().Value;
    client.BaseAddress = new Uri(settings.BaseUrl.TrimEnd('/'));
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddScoped<ICommunicationsService, CommunicationsService>();
builder.Services.AddScoped<IPersonalizationService, PersonalizationService>();
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IEventTokenService, EventTokenService>();
builder.Services.AddScoped<IRsvpTokenService, RsvpTokenService>();
builder.Services.AddScoped<IDirectorySettingsService, DirectorySettingsService>();
builder.Services.AddScoped<IMemberDirectorySettingsService, MemberDirectorySettingsService>();
builder.Services.AddScoped<IChatSettingsService, ChatSettingsService>();
builder.Services.AddScoped<GatherGrove.Application.Services.Chat.IChatService, GatherGrove.Application.Services.Chat.ChatService>();
builder.Services.AddScoped<GatherGrove.Application.Services.Chat.IChatBroadcastService, GatherGrove.API.Services.ChatBroadcastService>();
builder.Services.AddScoped<IMemberActivationService, MemberActivationService>();
builder.Services.AddScoped<IClubAuthorizationService, ClubAuthorizationService>();
builder.Services.AddScoped<ICustomFieldService, CustomFieldService>();
builder.Services.AddScoped<IEmailReportDeliveryService, EmailReportDeliveryService>();
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IEmailTemplateService, GatherGrove.Application.Services.Exports.EmailTemplateService>();
builder.Services.AddScoped<ICommunicationTemplateService, CommunicationTemplateService>();
builder.Services.AddScoped<ILocationMigrationService, LocationMigrationService>();
builder.Services.AddScoped<ILocationManagementService, LocationManagementService>();
builder.Services.AddScoped<IHierarchicalPermissionsService, HierarchicalPermissionsService>();
builder.Services.AddScoped<IMemberTransferService, MemberTransferService>();
builder.Services.AddScoped<ICrossLocationReportingService, CrossLocationReportingService>();
builder.Services.AddScoped<ILocationBrandingService, LocationBrandingService>();
builder.Services.AddScoped<IABTestingService, ABTestingService>();
builder.Services.AddScoped<ICommunicationAnalyticsService, CommunicationAnalyticsService>();
builder.Services.AddScoped<ICommunicationWorkflowService, CommunicationWorkflowService>();
builder.Services.AddScoped<ICommunicationSchedulerService, CommunicationSchedulerService>();
builder.Services.AddScoped<IEmailDeliveryRepository, EmailDeliveryRepository>();
builder.Services.AddScoped<IBackgroundTaskQueue, BackgroundTaskQueue>();
// Add BackgroundJobQueue for scheduled reports (different from BackgroundTaskQueue)
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IBackgroundJobQueue, GatherGrove.Application.Services.BackgroundJobQueue>();
builder.Services.AddScoped<IPushNotificationService, PushNotificationService>();
builder.Services.AddScoped<IMemberInviteCodeService, MemberInviteCodeService>();
builder.Services.AddScoped<IMemberImportService, MemberImportService>();
builder.Services.AddScoped<IUrlService, UrlService>();
builder.Services.AddScoped<IMarketingService, MarketingService>();
builder.Services.AddHttpClient<ITurnstileVerificationService, TurnstileVerificationService>();
builder.Services.AddSingleton<IMarketingLeadRateLimiter, MarketingLeadRateLimiter>();
builder.Services.AddScoped<IPdfGenerationService, PdfGenerationService>();
builder.Services.AddScoped<IErrorLoggingService, ErrorLoggingService>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();
builder.Services.AddSingleton<GatherGrove.API.Services.ISecurityAuditService, GatherGrove.API.Services.SecurityAuditService>();

// Add Real-Time Engagement Services
builder.Services.AddScoped<IMemberEngagementService, MemberEngagementService>();
builder.Services.AddScoped<IEngagementScoringService, EngagementScoringService>();
builder.Services.AddScoped<IFeatureUsageAnalyticsService, FeatureUsageAnalyticsService>();
builder.Services.AddScoped<IEventEngagementService, EventEngagementService>();
builder.Services.AddScoped<IEventEngagementAnalyticsService, EventEngagementAnalyticsService>();
builder.Services.AddScoped<IClubService, ClubService>();
// builder.Services.AddScoped<IRealTimeEngagementService, RealTimeEngagementService>();
// builder.Services.AddHostedService<EngagementUpdateService>();
// builder.Services.AddScoped<IMemberActivityTracker, MemberActivityTracker>();

// Add Branding Services for Unlimited Tier
builder.Services.AddScoped<GatherGrove.Application.Services.Branding.IBrandingService, GatherGrove.Application.Services.Branding.BrandingService>();
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IBrandingRepository, GatherGrove.Infrastructure.Repositories.BrandingRepository>();
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IClubRepository, GatherGrove.Infrastructure.Repositories.ClubRepository>();
builder.Services.AddScoped<GatherGrove.Infrastructure.Services.Storage.IFileStorageService, GatherGrove.Infrastructure.Services.Storage.FileStorageService>();

// Add Alert Configuration Services
builder.Services.AddScoped<GatherGrove.Application.Services.Alerts.IAlertConfigService, GatherGrove.Application.Services.Alerts.AlertConfigService>();
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IAlertConfigRepository, GatherGrove.Infrastructure.Repositories.AlertConfigRepository>();

// Add Authorization Handlers
builder.Services.AddScoped<GatherGrove.Infrastructure.Services.IClubTierService, GatherGrove.Infrastructure.Services.ClubTierService>();
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, GatherGrove.Infrastructure.Authorization.Handlers.UnlimitedTierRequirementHandler>();
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, GatherGrove.Application.Authorization.ClubAdminHandler>();
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, GatherGrove.Application.Authorization.ClubMemberHandler>();
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, GatherGrove.Application.Authorization.GrowTierHandler>();
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, GatherGrove.Application.Authorization.UnlimitedTierHandler>();
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, GatherGrove.Application.Authorization.SelfAccessHandler>();

// Add Advanced Analytics Services (US-004 - Premium Features)  
// Updated to use real repository for data access and calculations
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IAdvancedAnalyticsRepository, GatherGrove.Infrastructure.Repositories.AdvancedAnalyticsRepository>();
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IAdvancedAnalyticsService, GatherGrove.Application.Services.AdvancedAnalyticsService>();

// Register Export Services with proper DI configuration using decorator pattern
// Step 1: Add TierGateService required by TierAwareExportService
builder.Services.AddScoped<GatherGrove.Infrastructure.Services.TierValidation.ITierGateService, GatherGrove.Infrastructure.Services.TierValidation.TierGateService>();

// Step 2: Register core ExportService (concrete implementation)
builder.Services.AddScoped<GatherGrove.Application.Services.ExportService>();

// Step 3: Register TierAwareExportService as IExportService (decorator wrapping ExportService)
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IExportService>(provider =>
{
    var innerService = provider.GetRequiredService<GatherGrove.Application.Services.ExportService>();
    var tierGateService = provider.GetRequiredService<GatherGrove.Infrastructure.Services.TierValidation.ITierGateService>();
    var logger = provider.GetRequiredService<ILogger<GatherGrove.Application.Services.Wrappers.TierAwareExportService>>();

    return new GatherGrove.Application.Services.Wrappers.TierAwareExportService(innerService, tierGateService, logger);
});

// Add Audit Services for comprehensive audit trail logging
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IAuditLogService, GatherGrove.Application.Services.AuditLogService>();
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IExportHistoryService, GatherGrove.Application.Services.ExportHistoryService>();
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IAuditService, GatherGrove.Application.Services.AuditService>();
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IFinancialExportService, GatherGrove.Application.Services.FinancialExportService>();

// Add missing services for DI/Service Setup (Category 5 fixes)
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IAuthorizationService, GatherGrove.Application.Services.AuthorizationService>();
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IDataSanitizationService, GatherGrove.Application.Services.DataSanitizationService>();
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IComplianceService, GatherGrove.Application.Services.ComplianceService>();

// BUG FIX #22: Content Sanitization Service for server-side XSS protection
builder.Services.AddSingleton<GatherGrove.Application.Services.Security.IContentSanitizationService, GatherGrove.Application.Services.Security.ContentSanitizationService>();

// BUG-001 FIX: Encryption Service with keys from configuration (no hardcoded keys)
// Configure encryption keys in appsettings.json: Encryption:MasterKey and Encryption:InitializationVector
// In production, these should come from Azure Key Vault
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IEncryptionService, GatherGrove.Application.Services.EncryptionService>();

// Add ScheduledReportRepository (required by ScheduledReportsService)
// Note: There are two IScheduledReportRepository interfaces in different namespaces
// Infrastructure interface/implementation (base)
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IScheduledReportRepository, GatherGrove.Infrastructure.Repositories.ScheduledReportRepository>();
// Application interface with wrapper to adapt Infrastructure implementation
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IScheduledReportRepository, GatherGrove.Application.Repositories.ScheduledReportRepository>();

// Add missing export services that are referenced in ExportController
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IMemberDataExportService, GatherGrove.Application.Services.MemberDataExportService>();
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IEventReportsService, GatherGrove.Application.Services.EventReportsService>();
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IScheduledReportsService, GatherGrove.Application.Services.ScheduledReportsService>();

// Add US-009 Advanced Event Management Services
builder.Services.AddScoped<IEventSeriesService, EventSeriesService>();
builder.Services.AddScoped<IWaitlistService, WaitlistService>();
builder.Services.AddScoped<IMultiSessionEventService, MultiSessionEventService>();
builder.Services.AddScoped<IEventCheckinService, EventCheckinService>();
builder.Services.AddScoped<IQRCodeService, QRCodeService>();
builder.Services.AddScoped<EventFeedbackService>();

// Add Event Repository (required by EventReportsService, EventSeriesService, WaitlistService, MultiSessionEventService)
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IEventRepository, GatherGrove.Application.Repositories.EventRepository>();

// Add US-009 Repository implementations (now in Infrastructure layer)
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IEventSeriesRepository, GatherGrove.Infrastructure.Repositories.EventSeriesRepository>();
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IWaitlistRepository, GatherGrove.Infrastructure.Repositories.WaitlistRepository>();
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IMultiSessionEventRepository, GatherGrove.Infrastructure.Repositories.MultiSessionEventRepository>();
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IEventFeedbackRepository, GatherGrove.Infrastructure.Repositories.EventFeedbackRepository>();
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IAttendanceRepository, GatherGrove.Infrastructure.Repositories.AttendanceRepository>();
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IEventSessionRepository, GatherGrove.Infrastructure.Repositories.EventSessionRepository>();
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IFinancialRepository, GatherGrove.Infrastructure.Repositories.FinancialRepository>();

// Add missing service and repository implementations (required by various services)
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.INotificationService, GatherGrove.Application.Services.NotificationService>();
builder.Services.AddScoped<GatherGrove.Infrastructure.Repositories.IMemberRepository, GatherGrove.Infrastructure.Repositories.MemberRepository>();

// Add Export Validation Services
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IFileTypeDetector, GatherGrove.Application.Services.FileTypeDetector>();
builder.Services.AddScoped<GatherGrove.Application.Services.Interfaces.IExportFormatValidator, GatherGrove.Application.Validators.ExportFormatValidator>();

// Account Deletion and Data Export Services (BUG FIX: B-01, B-02)
// PHASE 3 FIX: Re-enabled GDPR services with circular dependency resolved
// UserAccountDeletionService now implements both IUserAccountDeletionService and IAccountDeletionService
builder.Services.AddScoped<GatherGrove.Application.Services.IAccountDeletionService, GatherGrove.Application.Services.UserAccountDeletionService>();
builder.Services.AddScoped<GatherGrove.Application.Services.IUserAccountDeletionService, GatherGrove.Application.Services.UserAccountDeletionService>();
builder.Services.AddScoped<GatherGrove.Application.Services.IDataExportService, GatherGrove.Application.Services.DataExportService>();

// Add HTTP Context Accessor for authorization handlers
builder.Services.AddHttpContextAccessor();

// Register tier-aware services and background services
builder.Services.AddTierAwareServices(builder.Configuration);

// Register advanced analytics services
builder.Services.AddAdvancedAnalytics(builder.Configuration);

// Validate JWT configuration before setting up authentication
var jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ??
                   builder.Configuration["JwtSettings:SecretKey"];

if (string.IsNullOrEmpty(jwtSecretKey))
{
    throw new InvalidOperationException(
        "JWT Secret Key is required. Set JWT_SECRET_KEY environment variable or JwtSettings:SecretKey in configuration.");
}

if (jwtSecretKey.Length < 32)
{
    throw new InvalidOperationException(
        "JWT Secret Key must be at least 32 characters long for security.");
}

Console.WriteLine($"🔑 JWT Configuration validated - Secret Key: {jwtSecretKey.Length} characters, Issuer: {builder.Configuration["JwtSettings:Issuer"] ?? "GatherGrove"}");

// Add JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "GatherGrove",
            ValidAudience = builder.Configuration["JwtSettings:Audience"] ?? "GatherGrove",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ??
                    builder.Configuration["JwtSettings:SecretKey"] ??
                    throw new InvalidOperationException("JWT_SECRET_KEY environment variable or JwtSettings:SecretKey configuration is required")))
        };

        // Configure JWT to read from both Authorization header and cookies
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();

                // First priority: Authorization header (standard approach for APIs and mobile)
                var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                {
                    context.Token = authHeader.Substring(7);
                    logger.LogInformation("JWT token found in Authorization header for request to {Path}", context.Request.Path);
                    return Task.CompletedTask;
                }

                // Second priority: JWT cookie (web clients)
                if (context.Request.Cookies.ContainsKey("jwt"))
                {
                    context.Token = context.Request.Cookies["jwt"];
                    logger.LogInformation("JWT token found in 'jwt' cookie for request to {Path}", context.Request.Path);
                    return Task.CompletedTask;
                }

                // Third priority: Legacy auth-token cookie
                if (context.Request.Cookies.ContainsKey("auth-token"))
                {
                    context.Token = context.Request.Cookies["auth-token"];
                    logger.LogInformation("JWT token found in 'auth-token' cookie for request to {Path}", context.Request.Path);
                    return Task.CompletedTask;
                }

                logger.LogWarning("No JWT token found in Authorization header or cookies for request to {Path}. Available cookies: {Cookies}",
                    context.Request.Path,
                    string.Join(", ", context.Request.Cookies.Keys));

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogError("JWT authentication failed for request to {Path}: {Exception}",
                    context.Request.Path,
                    context.Exception.Message);

                // Log specific failure reasons for better debugging
                if (context.Exception is SecurityTokenExpiredException)
                {
                    logger.LogWarning("JWT token expired for request to {Path}", context.Request.Path);
                }
                else if (context.Exception is SecurityTokenInvalidSignatureException)
                {
                    logger.LogError("JWT token has invalid signature for request to {Path}", context.Request.Path);
                }
                else if (context.Exception is SecurityTokenInvalidIssuerException)
                {
                    logger.LogError("JWT token has invalid issuer for request to {Path}", context.Request.Path);
                }
                else if (context.Exception is SecurityTokenInvalidAudienceException)
                {
                    logger.LogError("JWT token has invalid audience for request to {Path}", context.Request.Path);
                }
                else if (context.Exception is SecurityTokenNotYetValidException)
                {
                    logger.LogWarning("JWT token not yet valid for request to {Path}", context.Request.Path);
                }
                else if (context.Exception is SecurityTokenException)
                {
                    logger.LogError("JWT Token validation error for {Path}: {Error}", context.Request.Path, context.Exception.ToString());
                }

                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogInformation("JWT token successfully validated for user {UserId} on request to {Path}",
                    context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown",
                    context.Request.Path);
                return Task.CompletedTask;
            }
        };
    });

// Add authorization with enhanced role-based policies
builder.Services.AddAuthorization(options =>
{
    // Basic role policies
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));

    // Member-only policy  
    options.AddPolicy("MemberOnly", policy =>
        policy.RequireRole("Member"));

    // Admin or Member policy (authenticated users)
    options.AddPolicy("AdminOrMember", policy =>
        policy.RequireRole("Admin", "Member"));

    // Club admin policy (validates club ownership via custom requirement)
    options.AddPolicy("ClubAdmin", policy =>
        policy.Requirements.Add(new GatherGrove.Application.Authorization.ClubAdminRequirement()));

    // Club member policy (validates club membership via custom requirement)
    options.AddPolicy("ClubMember", policy =>
        policy.Requirements.Add(new GatherGrove.Application.Authorization.ClubMemberRequirement()));

    // Grow tier policy (for features requiring Grow tier)
    options.AddPolicy("GrowTierRequired", policy =>
        policy.Requirements.Add(new GatherGrove.Application.Authorization.GrowTierRequirement()));

    // Unlimited tier policy (for features requiring Unlimited tier)
    options.AddPolicy("UnlimitedTier", policy =>
        policy.AddRequirements(new GatherGrove.Infrastructure.Authorization.Requirements.UnlimitedTierRequirement()));

    options.AddPolicy("UnlimitedTierRequired", policy =>
        policy.Requirements.Add(new GatherGrove.Application.Authorization.UnlimitedTierRequirement()));

    // Self-access policy (user can only access their own data or is admin)
    options.AddPolicy("SelfAccess", policy =>
        policy.Requirements.Add(new GatherGrove.Application.Authorization.SelfAccessRequirement()));
});

// Add Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "GatherGrove API", Version = "v1" });

    // Include XML comments for Swagger documentation
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000", "http://localhost:3050", "https://localhost:3050")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });

    // Add policy for mobile apps with specific allowed origins
    // Mobile apps use capacitor:// and http://localhost schemes
    options.AddPolicy("AllowMobile", policy =>
    {
        policy.WithOrigins(
                  "capacitor://localhost",      // iOS
                  "http://localhost",            // Android local
                  "https://localhost",           // Android local HTTPS
                  "http://localhost:8081",       // Expo Go
                  "http://localhost:19000",      // Expo development
                  "http://localhost:19006"       // Expo web
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .WithHeaders("X-Mobile-Client", "Content-Type", "Authorization");
    });
});

// Validate required configuration
var configuration = builder.Configuration;
var requiredConfigs = new[]
{
    ("App:FrontendUrl", "Frontend URL"),
    ("App:ApiUrl", "API URL"),
    ("JwtSettings:SecretKey", "JWT Secret Key"),
    ("Stripe:SecretKey", "Stripe Secret Key"),
    ("Stripe:PublishableKey", "Stripe Publishable Key")
};

foreach (var (key, description) in requiredConfigs)
{
    if (string.IsNullOrEmpty(configuration[key]))
    {
        Console.WriteLine($"⚠️  WARNING: Missing required configuration '{key}' ({description})");
    }
}

// Log the configured URLs for debugging
Console.WriteLine($"🌐 Frontend URL: {configuration["App:FrontendUrl"] ?? "NOT SET"}");
Console.WriteLine($"🌐 API URL: {configuration["App:ApiUrl"] ?? "NOT SET"}");

var app = builder.Build();

// Seed data if using in-memory database (skip during testing to avoid conflicts)
var useInMemoryDbForSeeding = Environment.GetEnvironmentVariable("USE_INMEMORY_DB");
var skipDbSeeding = Environment.GetEnvironmentVariable("SKIP_DB_SEEDING");
var isLocalSeedEnvironment = app.Environment.IsDevelopment() ||
                             app.Environment.IsEnvironment("Testing") ||
                             app.Environment.IsEnvironment("Test");
if (useInMemoryDbForSeeding == "true" && skipDbSeeding != "true" && isLocalSeedEnvironment)
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        // Check if data already exists
        if (!context.Users.Any())
        {
            Console.WriteLine("📌 Seeding test data for in-memory database...");

            var now = DateTime.UtcNow;

            // Create a test admin user
            var testUser = new GatherGrove.Domain.Entities.User
            {
                FullName = "Test Admin",
                Email = "admin@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                IsActive = true,
                OnboardingCompleted = true,
                CreatedAt = now,
                UpdatedAt = now
            };
            context.Users.Add(testUser);
            context.SaveChanges();

            // Create a test club
            var testClub = new GatherGrove.Domain.Entities.Club
            {
                Name = "Test Club",
                CreatedAt = now,
                Tier = "Grow",
                CreatedByUserId = testUser.Id
            };
            context.Clubs.Add(testClub);
            context.SaveChanges();

            // Link user as admin of the club
            var clubAdmin = new GatherGrove.Domain.Entities.ClubAdmin
            {
                UserId = testUser.Id,
                ClubId = testClub.Id,
                CreatedAt = now
            };
            context.ClubAdmins.Add(clubAdmin);
            context.SaveChanges();

            // Create a membership type for the club
            var membershipType = new GatherGrove.Domain.Entities.MembershipType
            {
                ClubId = testClub.Id,
                Name = "Standard Member",
                Description = "Standard membership with full access",
                DuesAmount = 50.00m,
                DuesFrequency = "monthly",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };
            context.MembershipTypes.Add(membershipType);
            context.SaveChanges();

            // Create a test member user (for member portal login)
            var testMemberUser = new GatherGrove.Domain.Entities.User
            {
                FullName = "Test Member",
                Email = "member@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                IsActive = true,
                OnboardingCompleted = true,
                CreatedAt = now,
                UpdatedAt = now
            };
            context.Users.Add(testMemberUser);
            context.SaveChanges();

            // Create the member record linking to the club
            var testMember = new GatherGrove.Domain.Entities.Member
            {
                ClubId = testClub.Id,
                MembershipTypeId = membershipType.Id,
                FullName = "Test Member",
                Email = "member@test.com",
                PhoneNumber = "+1234567890",
                Status = "Active",
                JoinDate = now,
                HasSmsConsent = false,
                IsListedInDirectory = true,
                DirectoryVisibleFields = "FullName,Email,PhoneNumber",
                CreatedAt = now,
                UpdatedAt = now
            };
            context.Members.Add(testMember);
            context.SaveChanges();

            Console.WriteLine("✅ Test data seeded successfully!");
        }
    }
}

// Configure the HTTP request pipeline
// Add Serilog HTTP request logging (must be early in pipeline for comprehensive coverage)
app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
        diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.FirstOrDefault());
    };
});

// Sentry tracing middleware (no-op when Sentry is not configured)
app.UseSentryTracing();

// Add security middleware first
app.UseSecurityMiddleware();

// Add CSRF protection after security middleware
app.UseCSRFProtection();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "GatherGrove API v1");
        c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
    });
}
else if (!app.Environment.IsEnvironment("Testing"))
{
    // Only use HTTPS redirection in production and staging, not in testing
    app.UseHttpsRedirection();
}

// Apply CORS policy first - must run before exception handling to ensure CORS headers on error responses
// PHASE 6 FIX: Extract CORS origins to configuration for flexibility
// PHASE 6 FIX: Replace Console.WriteLine with proper logging
app.UseCors(policy =>
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();

    policy.SetIsOriginAllowed(origin =>
    {
        // Load allowed origins from configuration
        var allowedOrigins = app.Configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        var allowedMobileOrigins = app.Configuration.GetSection("CorsSettings:AllowedMobileOrigins").Get<string[]>() ?? Array.Empty<string>();
        var allowedProductionOrigins = app.Configuration.GetSection("CorsSettings:AllowedProductionOrigins").Get<string[]>() ?? Array.Empty<string>();
        var frontendUrl = app.Configuration["App:FrontendUrl"];

        // Normalize origin for comparison (case-insensitive, no trailing slash)
        var normalizedOrigin = origin?.TrimEnd('/').ToLowerInvariant() ?? string.Empty;

        // Debug logging for CORS origin validation
        logger.LogDebug("CORS: Checking origin: {Origin} (normalized: {NormalizedOrigin})", origin, normalizedOrigin);

        // Check development frontend origins (case-insensitive comparison)
        if (allowedOrigins.Any(o => o.TrimEnd('/').Equals(normalizedOrigin, StringComparison.OrdinalIgnoreCase)))
        {
            logger.LogDebug("CORS: Origin {Origin} ALLOWED via development config", origin);
            return true;
        }

        // Check mobile development origins (exact match or prefix match for dynamic ports)
        // BUG FIX: Use Uri.TryCreate instead of unsafe Split(':')[index] to prevent IndexOutOfRangeException
        if (allowedMobileOrigins.Contains(origin) ||
            allowedMobileOrigins.Any(allowed =>
            {
                if (Uri.TryCreate(allowed, UriKind.Absolute, out var allowedUri) &&
                    Uri.TryCreate(origin, UriKind.Absolute, out var originUri))
                {
                    return originUri.Scheme == allowedUri.Scheme &&
                           originUri.Host == allowedUri.Host &&
                           originUri.Port >= 8080 && originUri.Port <= 8089;
                }
                return false;
            }))
        {
            return true;
        }

        // Allow configured frontend URL (staging/production) - case-insensitive comparison
        var normalizedFrontendUrl = frontendUrl?.TrimEnd('/').ToLowerInvariant() ?? string.Empty;
        if (!string.IsNullOrEmpty(frontendUrl) && normalizedOrigin == normalizedFrontendUrl)
        {
            logger.LogDebug("CORS: Origin {Origin} ALLOWED via frontend URL config", origin);
            return true;
        }

        // Check production/staging domains (case-insensitive comparison)
        if (allowedProductionOrigins.Any(o => o.TrimEnd('/').Equals(normalizedOrigin, StringComparison.OrdinalIgnoreCase)))
        {
            logger.LogDebug("CORS: Origin {Origin} ALLOWED via production config", origin);
            return true;
        }

        // For mobile apps, validate specific headers instead of allowing null origin
        // This prevents potential CSRF attacks while supporting mobile clients
        if (string.IsNullOrEmpty(origin) || origin == "null")
        {
            // Check for mobile client headers in the current request context
            var httpContext = app.Services.GetService<IHttpContextAccessor>()?.HttpContext;
            if (httpContext != null)
            {
                var isMobileClient = httpContext.Request.Headers.ContainsKey("X-Mobile-Client");
                var userAgent = httpContext.Request.Headers.UserAgent.ToString();
                var isMobileUserAgent = userAgent.Contains("GatherGrove-Mobile", StringComparison.OrdinalIgnoreCase) ||
                                       userAgent.Contains("ReactNative", StringComparison.OrdinalIgnoreCase) ||
                                       userAgent.Contains("Expo", StringComparison.OrdinalIgnoreCase);

                if (isMobileClient && isMobileUserAgent)
                {
                    return true;
                }
            }
        }

        logger.LogWarning("CORS: Origin {Origin} REJECTED - not in allowed lists. Checked: AllowedOrigins=[{AllowedOrigins}], AllowedProductionOrigins=[{ProductionOrigins}], FrontendUrl={FrontendUrl}",
            origin,
            string.Join(", ", allowedOrigins),
            string.Join(", ", allowedProductionOrigins),
            frontendUrl ?? "(not set)");
        return false;
    })
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials();
});

// Add global exception middleware (after CORS to ensure error responses include CORS headers)
app.UseMiddleware<GlobalExceptionMiddleware>();

// Add built-in rate limiting middleware (before authentication to protect against attacks)
app.UseRateLimiter();

// Add custom .well-known protection middleware (for SSL reconnaissance attacks)
app.UseRateLimiting();

// Add request timeout middleware to prevent 231s backend timeouts
app.UseRequestTimeout();

// Add request logging middleware for performance monitoring and timeout detection
app.UseMiddleware<GatherGrove.API.Middleware.RequestLoggingMiddleware>();

app.UseAuthentication();
app.UseMiddleware<BillingAccessMiddleware>();
app.UseAuthorization();
app.MapControllers();

// Map SignalR hubs
app.MapHub<GatherGrove.API.Hubs.ChatHub>("/chatHub");
app.MapHub<GatherGrove.API.Hubs.EventEngagementHub>("/eventEngagementHub");

// F-001: Map the AnalyticsHub at /hubs/analytics. The hub and its services are
// registered via builder.Services.AddAdvancedAnalytics(...) above, but the
// endpoint mapping (UseAdvancedAnalytics) was never invoked, so /hubs/analytics
// returned 404 and the fully-built real-time analytics hub was unreachable.
app.UseAdvancedAnalytics();

// Add simple health check endpoint for deployment scripts
app.MapGet("/health", async (HttpContext context, GatherGroveDbContext dbContext) =>
{
    try
    {
        // Quick health check - test database connectivity with timeout
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        var canConnect = await dbContext.Database.CanConnectAsync(cts.Token);

        if (canConnect)
        {
            return Results.Ok(new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Service = "GatherGrove API"
            });
        }
        else
        {
            context.Response.StatusCode = 503;
            return Results.Json(new
            {
                Status = "Unhealthy",
                Error = "Database not accessible",
                Timestamp = DateTime.UtcNow,
                Service = "GatherGrove API"
            }, statusCode: 503);
        }
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 503;
        return Results.Json(new
        {
            Status = "Unhealthy",
            Error = ex.Message,
            Timestamp = DateTime.UtcNow,
            Service = "GatherGrove API"
        }, statusCode: 503);
    }
});

// Initialize database with enhanced debugging and timeout handling
Console.WriteLine("🔄 Starting database initialization...");
try
{
    Console.WriteLine("🔄 Creating service scope for database initialization...");
    using (var scope = app.Services.CreateScope())
    {
        Console.WriteLine("✅ Service scope created successfully");
        Console.WriteLine("🔄 Getting database context from service provider...");

        var dbContext = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
        Console.WriteLine("✅ Database context obtained successfully");

        var useInMemoryDbInit = Environment.GetEnvironmentVariable("USE_INMEMORY_DB");
        var skipDbMigrations = Environment.GetEnvironmentVariable("SKIP_DB_MIGRATIONS");

        Console.WriteLine($"🔍 USE_INMEMORY_DB: {useInMemoryDbInit}");
        Console.WriteLine($"🔍 SKIP_DB_MIGRATIONS: {skipDbMigrations}");

        // Only use in-memory database if explicitly requested
        if (useInMemoryDbInit != "true")
        {
            // Check if migrations should be skipped
            if (skipDbMigrations == "true")
            {
                Console.WriteLine("⏭️  Skipping database migrations (SKIP_DB_MIGRATIONS=true)");
                Console.WriteLine("✅ Database initialization skipped");
            }
            else
            {
                // Test database connectivity first with proper timeout handling
                Console.WriteLine("🔄 Testing database connectivity...");
                using (var cancellationTokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(30)))
                {
                    try
                    {
                        // BUG-002 FIX: Use proper async/await instead of GetAwaiter().GetResult()
                        // Top-level statements in Program.cs support await
                        bool canConnect;
                        try
                        {
                            canConnect = await dbContext.Database.CanConnectAsync(cancellationTokenSource.Token);
                        }
                        catch (OperationCanceledException)
                        {
                            Console.WriteLine("⏰ Database connectivity test cancelled due to timeout");
                            canConnect = false;
                        }

                        Console.WriteLine($"🔍 Database connectivity test result: {canConnect}");

                        if (canConnect && !cancellationTokenSource.Token.IsCancellationRequested)
                        {
                            Console.WriteLine("🔧 Applying database migrations with timeout...");

                            // BUG-002 FIX: Proper async/await for migrations
                            bool migrationSuccess;
                            try
                            {
                                await dbContext.Database.MigrateAsync(cancellationTokenSource.Token);
                                migrationSuccess = true;
                            }
                            catch (OperationCanceledException)
                            {
                                Console.WriteLine("⏰ Database migration cancelled due to timeout");
                                migrationSuccess = false;
                            }

                            if (migrationSuccess)
                            {
                                Console.WriteLine("✅ Database migrations applied successfully");
                            }
                            else
                            {
                                Console.WriteLine("⚠️  Database migrations timed out or failed");
                            }
                        }
                        else
                        {
                            Console.WriteLine("❌ Cannot connect to database or operation was cancelled, skipping migrations");
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        Console.WriteLine("⏰ Database operation timed out after 30 seconds, continuing without migrations");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Database operation failed: {ex.Message}");
                        Console.WriteLine($"🔍 Exception type: {ex.GetType().Name}");

                        // Only attempt database creation if it's not a timeout issue
                        if (!ex.Message.ToLowerInvariant().Contains("timeout") && !cancellationTokenSource.Token.IsCancellationRequested)
                        {
                            Console.WriteLine("🔧 Attempting to create database...");
                            try
                            {
                                // BUG-002 FIX: Proper async/await for database creation
                                bool createSuccess;
                                try
                                {
                                    createSuccess = await dbContext.Database.EnsureCreatedAsync(cancellationTokenSource.Token);
                                }
                                catch (OperationCanceledException)
                                {
                                    Console.WriteLine("⏰ Database creation cancelled due to timeout");
                                    createSuccess = false;
                                }

                                if (createSuccess)
                                {
                                    Console.WriteLine("✅ Database created successfully");
                                }
                                else
                                {
                                    Console.WriteLine("❌ Database creation timed out or failed");
                                }
                            }
                            catch (Exception createEx)
                            {
                                Console.WriteLine($"❌ Database creation failed: {createEx.Message}");
                            }
                        }

                        Console.WriteLine("⚠️  Continuing without database initialization");
                    }
                }
            }
        }
        else
        {
            // For in-memory database, just ensure it's created
            Console.WriteLine("🔧 Initializing in-memory database...");
            dbContext.Database.EnsureCreated();
            Console.WriteLine("✅ In-memory database created successfully");
        }
    }
    Console.WriteLine("✅ Database initialization completed");

    // Test health check endpoints after database initialization
    Console.WriteLine("🏥 Verifying health check endpoints are functional...");
    try
    {
        using (var scope = app.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            var canConnect = await dbContext.Database.CanConnectAsync(cts.Token);
            Console.WriteLine($"🔍 Health check database connectivity test: {(canConnect ? "PASS" : "FAIL")}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️  Health check verification failed: {ex.Message}");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Database initialization failed: {ex.Message}");
    Console.WriteLine("⚠️  Continuing application startup without database initialization");
}

app.Run();

// Make Program class accessible for integration testing
public partial class Program { }
