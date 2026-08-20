# Tier-Aware Implementation Guidelines for Unlimited Features

## 🎯 Overview

This document provides comprehensive implementation guidelines for developing unlimited tier features with conditional activation to prevent resource waste. All unlimited tier features MUST follow these patterns to ensure resources are only consumed by paying customers.

## 🚨 Core Principles

### 1. Tier Validation First
Every unlimited feature must validate subscription tier before any resource allocation:
```typescript
// ❌ WRONG - Resources allocated before tier check
const heavyAnalyticsData = await processComplexAnalytics(clubId);
if (club.tier !== 'unlimited') return null;

// ✅ CORRECT - Tier check before resource allocation
if (club.tier !== 'unlimited') return null;
const heavyAnalyticsData = await processComplexAnalytics(clubId);
```

### 2. Lazy Loading by Default
All unlimited components must be lazy-loaded to prevent unnecessary bundle loading:
```typescript
// ✅ CORRECT - Lazy loading pattern
const AdvancedAnalytics = lazy(() => import('./AdvancedAnalytics'));

export const AnalyticsContainer = () => {
  const { club } = useClub();
  
  if (club.subscriptionTier !== 'unlimited') {
    return <UpgradePrompt />;
  }
  
  return (
    <Suspense fallback={<Loading />}>
      <AdvancedAnalytics />
    </Suspense>
  );
};
```

### 3. Service Layer Abstraction
Use tier-aware service wrappers to prevent resource consumption:
```csharp
// ✅ CORRECT - Service wrapper pattern
public class TierAwareAnalyticsService : IAnalyticsService
{
    private readonly IAnalyticsService _actualService;
    private readonly IClubService _clubService;

    public async Task<AnalyticsData> GetAnalyticsAsync(int clubId)
    {
        var club = await _clubService.GetByIdAsync(clubId);
        if (club.SubscriptionTier != SubscriptionTier.Unlimited)
        {
            return AnalyticsData.Empty; // No processing for basic tier
        }

        return await _actualService.GetAnalyticsAsync(clubId);
    }
}
```

## 🏗️ Implementation Patterns

### Frontend Implementation

#### 1. TierGate Component
```typescript
// client/src/components/common/TierGate.tsx
interface TierGateProps {
  requiredTier: 'unlimited';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export const TierGate: React.FC<TierGateProps> = ({
  requiredTier,
  children,
  fallback = <TierUpgradePrompt />,
  showUpgradePrompt = true
}) => {
  const { club, loading } = useClub();

  if (loading) return <LoadingSkeleton />;

  if (club.subscriptionTier !== requiredTier) {
    return showUpgradePrompt ? fallback : null;
  }

  return <>{children}</>;
};
```

#### 2. Conditional Hook Pattern
```typescript
// client/src/hooks/useUnlimitedFeature.ts
export function useUnlimitedFeature<T>(
  featureHook: () => T,
  fallbackValue: T
): T {
  const { club } = useClub();
  const isUnlimited = club.subscriptionTier === 'unlimited';
  
  // Only execute the hook if unlimited tier
  const result = isUnlimited ? featureHook() : fallbackValue;
  
  return result;
}

// Usage
const analyticsData = useUnlimitedFeature(
  () => useAdvancedAnalytics(clubId),
  null // Fallback for basic tier
);
```

#### 3. Lazy Route Loading
```typescript
// client/src/app/admin/layout.tsx
const LazyUnlimitedRoutes = lazy(() => 
  import('./unlimited/UnlimitedRoutes').then(module => ({
    default: module.UnlimitedRoutes
  }))
);

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main>
        <Outlet />
        <TierGate requiredTier="unlimited" showUpgradePrompt={false}>
          <Suspense fallback={<div>Loading unlimited features...</div>}>
            <LazyUnlimitedRoutes />
          </Suspense>
        </TierGate>
      </main>
    </div>
  );
}
```

### Backend Implementation

#### 1. Tier Validation Middleware
```csharp
// backend/src/GatherGrove.API/Middleware/TierValidationMiddleware.cs
public class TierValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IClubService _clubService;

    public async Task InvokeAsync(HttpContext context)
    {
        var clubId = ExtractClubId(context);
        if (clubId.HasValue)
        {
            var club = await _clubService.GetByIdAsync(clubId.Value);
            context.Items["ClubTier"] = club.SubscriptionTier;
            context.Items["IsUnlimitedTier"] = club.SubscriptionTier == SubscriptionTier.Unlimited;
        }

        await _next(context);
    }

    private int? ExtractClubId(HttpContext context)
    {
        // Extract from route, query, or claims
        if (context.Request.RouteValues.TryGetValue("clubId", out var clubId))
        {
            return Convert.ToInt32(clubId);
        }
        return null;
    }
}
```

#### 2. Controller Tier Validation
```csharp
// backend/src/GatherGrove.API/Controllers/BaseController.cs
public abstract class TierAwareController : ControllerBase
{
    protected bool IsUnlimitedTier => 
        (bool)(HttpContext.Items["IsUnlimitedTier"] ?? false);

    protected IActionResult RequireUnlimitedTier()
    {
        if (!IsUnlimitedTier)
        {
            return StatusCode(402, new { 
                message = "This feature requires Unlimited tier subscription",
                upgradeUrl = "/pricing"
            });
        }
        return null; // Continue processing
    }
}

// Usage in controllers
[ApiController]
public class AdvancedAnalyticsController : TierAwareController
{
    [HttpGet("engagement-trends")]
    public async Task<IActionResult> GetEngagementTrends(int clubId)
    {
        var tierCheck = RequireUnlimitedTier();
        if (tierCheck != null) return tierCheck;

        // Process unlimited tier request
        var trends = await _analyticsService.GetEngagementTrendsAsync(clubId);
        return Ok(trends);
    }
}
```

#### 3. Background Service Optimization
```csharp
// backend/src/GatherGrove.Application/Services/TierAwareBackgroundService.cs
public abstract class TierAwareBackgroundService : BackgroundService
{
    protected readonly IClubService _clubService;

    protected async Task<int[]> GetUnlimitedClubIdsAsync()
    {
        return await _clubService.GetClubIdsByTierAsync(SubscriptionTier.Unlimited);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var unlimitedClubs = await GetUnlimitedClubIdsAsync();
                await ProcessUnlimitedClubsAsync(unlimitedClubs, stoppingToken);
            }
            catch (Exception ex)
            {
                // Log error
            }

            await Task.Delay(GetExecutionInterval(), stoppingToken);
        }
    }

    protected abstract Task ProcessUnlimitedClubsAsync(int[] clubIds, CancellationToken cancellationToken);
    protected abstract TimeSpan GetExecutionInterval();
}
```

#### 4. Repository Tier Filtering
```csharp
// backend/src/GatherGrove.Infrastructure/Repositories/TierAwareRepository.cs
public abstract class TierAwareRepository<T> : IRepository<T>
{
    protected readonly AppDbContext _context;

    protected async Task<bool> ValidateUnlimitedTierAsync(int clubId)
    {
        return await _context.Clubs
            .Where(c => c.Id == clubId)
            .Select(c => c.SubscriptionTier == SubscriptionTier.Unlimited)
            .FirstOrDefaultAsync();
    }

    protected async Task<TResult> ExecuteForUnlimitedAsync<TResult>(
        int clubId, 
        Func<Task<TResult>> operation,
        TResult defaultValue = default)
    {
        if (!await ValidateUnlimitedTierAsync(clubId))
        {
            return defaultValue;
        }

        return await operation();
    }
}

// Usage
public class AnalyticsRepository : TierAwareRepository<AnalyticsData>
{
    public async Task<List<EngagementTrend>> GetEngagementTrendsAsync(int clubId)
    {
        return await ExecuteForUnlimitedAsync(clubId, 
            async () => await GetComplexEngagementData(clubId),
            new List<EngagementTrend>() // Empty list for basic tier
        );
    }
}
```

### Service Registration Patterns

#### 1. Conditional Service Registration
```csharp
// backend/src/GatherGrove.API/Extensions/ServiceCollectionExtensions.cs
public static class UnlimitedTierServiceExtensions
{
    public static IServiceCollection AddUnlimitedTierServices(
        this IServiceCollection services)
    {
        // Register tier-aware services
        services.AddScoped<IAdvancedAnalyticsService>(provider =>
        {
            var actualService = provider.GetRequiredService<AdvancedAnalyticsService>();
            var clubService = provider.GetRequiredService<IClubService>();
            return new TierAwareAdvancedAnalyticsService(actualService, clubService);
        });

        services.AddScoped<IDataExportService>(provider =>
        {
            var actualService = provider.GetRequiredService<DataExportService>();
            var clubService = provider.GetRequiredService<IClubService>();
            return new TierAwareDataExportService(actualService, clubService);
        });

        return services;
    }
}
```

#### 2. Feature Flag Integration
```csharp
// backend/src/GatherGrove.API/Configuration/FeatureFlags.cs
public static class FeatureFlags
{
    public const string UnlimitedTierFeatures = "unlimited-tier-features";
    public const string AdvancedAnalytics = "advanced-analytics";
    public const string WhiteLabelBranding = "white-label-branding";
    public const string APIAccess = "api-access";
}

// Usage in controllers
[HttpGet("premium-analytics")]
[RequireFeatureFlag(FeatureFlags.AdvancedAnalytics)]
public async Task<IActionResult> GetPremiumAnalytics(int clubId)
{
    var tierCheck = RequireUnlimitedTier();
    if (tierCheck != null) return tierCheck;

    // Process request
}
```

## 🔧 Database Optimization

### 1. Tier-Aware Queries
```csharp
// Only execute complex queries for unlimited tier
public async Task<List<CohortAnalysis>> GetCohortAnalysisAsync(int clubId)
{
    // Fast tier check using indexed query
    var isUnlimited = await _context.Clubs
        .Where(c => c.Id == clubId)
        .Select(c => c.SubscriptionTier == SubscriptionTier.Unlimited)
        .FirstOrDefaultAsync();

    if (!isUnlimited)
    {
        return new List<CohortAnalysis>();
    }

    // Execute expensive query only for unlimited tier
    return await _context.Members
        .Where(m => m.ClubId == clubId)
        .GroupBy(m => m.JoinDate.Year)
        .Select(g => new CohortAnalysis
        {
            CohortYear = g.Key,
            InitialCount = g.Count(),
            RetentionRates = CalculateRetentionRates(g)
        })
        .ToListAsync();
}
```

### 2. Conditional Indexing
```sql
-- Add indexes specifically for unlimited tier queries
CREATE INDEX IX_Clubs_UnlimitedTier 
ON Clubs (SubscriptionTier) 
WHERE SubscriptionTier = 'Unlimited';

CREATE INDEX IX_AnalyticsData_UnlimitedClubs
ON AnalyticsData (ClubId, CreatedDate)
WHERE ClubId IN (SELECT Id FROM Clubs WHERE SubscriptionTier = 'Unlimited');
```

## 🗂️ Caching Strategies

### 1. Tier-Aware Caching
```csharp
public class TierAwareCacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly IClubService _clubService;

    public async Task SetAsync<T>(string key, T value, TimeSpan expiry)
    {
        var clubId = ExtractClubIdFromKey(key);
        if (clubId.HasValue)
        {
            var club = await _clubService.GetByIdAsync(clubId.Value);
            if (club.SubscriptionTier != SubscriptionTier.Unlimited)
            {
                return; // Don't cache for basic tier
            }
        }

        await _cache.SetStringAsync(key, 
            JsonSerializer.Serialize(value), 
            new DistributedCacheEntryOptions 
            { 
                AbsoluteExpirationRelativeToNow = expiry 
            });
    }
}
```

### 2. Cache Key Patterns
```csharp
// Include tier in cache keys for isolation
public static class CacheKeys
{
    public static string AnalyticsKey(int clubId, string metric) =>
        $"analytics:unlimited:{clubId}:{metric}";
    
    public static string ExportKey(int clubId, string type) =>
        $"exports:unlimited:{clubId}:{type}";
}
```

## 📊 Performance Monitoring

### 1. Resource Usage Tracking
```csharp
public class ResourceTrackingService : IResourceTrackingService
{
    public async Task TrackResourceUsageAsync(int clubId, string feature, ResourceType type, long units)
    {
        var club = await _clubService.GetByIdAsync(clubId);
        
        var usage = new ResourceUsage
        {
            ClubId = clubId,
            SubscriptionTier = club.SubscriptionTier.ToString(),
            Feature = feature,
            ResourceType = type,
            Units = units,
            Timestamp = DateTime.UtcNow
        };

        await _context.ResourceUsage.AddAsync(usage);
        await _context.SaveChangesAsync();
    }
}
```

### 2. Performance Metrics
```csharp
// Track performance by tier
public class PerformanceMetrics
{
    public static void TrackFeatureUsage(string feature, SubscriptionTier tier, TimeSpan duration)
    {
        using var activity = ActivitySource.StartActivity("feature.usage");
        activity?.SetTag("feature", feature);
        activity?.SetTag("tier", tier.ToString());
        activity?.SetTag("duration_ms", duration.TotalMilliseconds);
    }
}
```

## 🧪 Testing Patterns

### 1. Tier-Aware Tests
```csharp
[Test]
public async Task AdvancedAnalytics_UnlimitedTier_ReturnsData()
{
    // Arrange
    var club = CreateClubWithTier(SubscriptionTier.Unlimited);
    
    // Act
    var result = await _analyticsService.GetAdvancedAnalyticsAsync(club.Id);
    
    // Assert
    Assert.IsNotNull(result);
    Assert.IsNotEmpty(result);
}

[Test]
public async Task AdvancedAnalytics_BasicTier_ReturnsEmpty()
{
    // Arrange
    var club = CreateClubWithTier(SubscriptionTier.Grow);
    
    // Act
    var result = await _analyticsService.GetAdvancedAnalyticsAsync(club.Id);
    
    // Assert
    Assert.IsNotNull(result);
    Assert.IsEmpty(result);
}
```

### 2. Resource Usage Tests
```csharp
[Test]
public async Task BackgroundService_OnlyProcessesUnlimitedClubs()
{
    // Arrange
    var unlimitedClub = CreateClubWithTier(SubscriptionTier.Unlimited);
    var basicClub = CreateClubWithTier(SubscriptionTier.Grow);
    
    // Act
    await _backgroundService.ExecuteOnceAsync();
    
    // Assert
    Assert.That(ProcessedClubs, Contains.Item(unlimitedClub.Id));
    Assert.That(ProcessedClubs, Does.Not.Contain(basicClub.Id));
}
```

## 🚀 Deployment Checklist

### Pre-Deployment Validation
- [ ] All unlimited features wrapped in TierGate components
- [ ] All services implement tier validation
- [ ] Background services filter by tier
- [ ] Database queries include tier checks
- [ ] Caching only occurs for unlimited tier
- [ ] Resource usage monitoring implemented
- [ ] Performance tests validate resource savings
- [ ] Feature flags configured for rollback capability

### Post-Deployment Monitoring
- [ ] Resource usage metrics by tier
- [ ] Performance impact assessment
- [ ] Error rates for tier validation
- [ ] Feature adoption rates
- [ ] Customer satisfaction for unlimited tier

This comprehensive approach ensures that unlimited tier features provide value exclusively to paying customers while dramatically reducing resource waste and infrastructure costs.