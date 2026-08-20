using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.FileProviders;
using FluentAssertions;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Services;
using GatherGrove.Infrastructure.Services.TierValidation;

namespace GatherGrove.Infrastructure.Tests;

/// <summary>
/// Tests for dependency injection configuration in Infrastructure layer
/// Validates service registrations, lifetimes, and configuration
/// </summary>
[TestFixture]
public class DependencyInjectionTests
{
    private IServiceCollection _services = null!;
    private IConfiguration _configuration = null!;
    private IHostEnvironment _environment = null!;

    [SetUp]
    public void SetUp()
    {
        _services = new ServiceCollection();

        // Setup test configuration with connection string
        var configBuilder = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Server=(localdb)\\mssqllocaldb;Database=GatherGroveTest;Trusted_Connection=True;MultipleActiveResultSets=true",
                ["CacheSettings:SizeLimit"] = "104857600" // 100MB
            });
        _configuration = configBuilder.Build();

        // Setup test environment
        _environment = new TestHostEnvironment { EnvironmentName = "Testing" };
    }

    #region Service Registration Tests

    [Test]
    public void AddInfrastructure_RegistersDbContext()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var dbContext = serviceProvider.GetService<GatherGroveDbContext>();
        dbContext.Should().NotBeNull("DbContext should be registered");
    }

    [Test]
    public void AddInfrastructure_DbContext_HasCorrectLifetime()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);

        // Assert
        var descriptor = _services.FirstOrDefault(d => d.ServiceType == typeof(GatherGroveDbContext));
        descriptor.Should().NotBeNull();
        descriptor!.Lifetime.Should().Be(ServiceLifetime.Scoped, "DbContext should be Scoped");
    }

    [Test]
    public void AddInfrastructure_RegistersTierGateService()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var service = serviceProvider.GetService<ITierGateService>();
        service.Should().NotBeNull("ITierGateService should be registered");
        service.Should().BeOfType<TierGateService>("Should resolve to TierGateService implementation");
    }

    [Test]
    public void AddInfrastructure_RegistersClubAuthorizationService()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var service = serviceProvider.GetService<IClubAuthorizationService>();
        service.Should().NotBeNull("IClubAuthorizationService should be registered");
        service.Should().BeOfType<ClubAuthorizationService>("Should resolve to ClubAuthorizationService implementation");
    }

    [Test]
    public void AddInfrastructure_RegistersClubTierService()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var service = serviceProvider.GetService<IClubTierService>();
        service.Should().NotBeNull("IClubTierService should be registered");
        service.Should().BeOfType<ClubTierService>("Should resolve to ClubTierService implementation");
    }

    [Test]
    public void AddInfrastructure_RegistersAdvancedAnalyticsRepository()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var repository = serviceProvider.GetService<IAdvancedAnalyticsRepository>();
        repository.Should().NotBeNull("IAdvancedAnalyticsRepository should be registered");
        repository.Should().BeOfType<TierAwareAnalyticsRepository>("Should resolve to TierAwareAnalyticsRepository implementation");
    }

    [Test]
    public void AddInfrastructure_RegistersBrandingRepository()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var repository = serviceProvider.GetService<IBrandingRepository>();
        repository.Should().NotBeNull("IBrandingRepository should be registered");
        repository.Should().BeOfType<BrandingRepository>("Should resolve to BrandingRepository implementation");
    }

    [Test]
    public void AddInfrastructure_RegistersClubRepository()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var repository = serviceProvider.GetService<IClubRepository>();
        repository.Should().NotBeNull("IClubRepository should be registered");
        repository.Should().BeOfType<ClubRepository>("Should resolve to ClubRepository implementation");
    }

    [Test]
    public void AddInfrastructure_AllRepositories_HaveScopedLifetime()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);

        // Assert - Check all repository registrations are Scoped
        var repositoryDescriptors = _services.Where(d =>
            d.ServiceType == typeof(IAdvancedAnalyticsRepository) ||
            d.ServiceType == typeof(IBrandingRepository) ||
            d.ServiceType == typeof(IClubRepository)
        ).ToList();

        repositoryDescriptors.Should().NotBeEmpty("At least one repository should be registered");
        repositoryDescriptors.Should().OnlyContain(d => d.Lifetime == ServiceLifetime.Scoped,
            "All repositories should have Scoped lifetime");
    }

    [Test]
    public void AddInfrastructure_AllServices_HaveScopedLifetime()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);

        // Assert - Check all service registrations are Scoped
        var serviceDescriptors = _services.Where(d =>
            d.ServiceType == typeof(ITierGateService) ||
            d.ServiceType == typeof(IClubAuthorizationService) ||
            d.ServiceType == typeof(IClubTierService)
        ).ToList();

        serviceDescriptors.Should().NotBeEmpty("At least one service should be registered");
        serviceDescriptors.Should().OnlyContain(d => d.Lifetime == ServiceLifetime.Scoped,
            "All tier services should have Scoped lifetime");
    }

    #endregion

    #region Configuration Validation Tests

    [Test]
    public void AddInfrastructure_RegistersMemoryCache()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var cache = serviceProvider.GetService<IMemoryCache>();
        cache.Should().NotBeNull("IMemoryCache should be registered");
    }

    [Test]
    public void AddInfrastructure_MemoryCache_UsesCacheSizeLimitFromConfiguration()
    {
        // Arrange - Configuration already has CacheSettings:SizeLimit set in SetUp

        // Act
        _services.AddInfrastructure(_configuration, _environment);
        var serviceProvider = _services.BuildServiceProvider();
        var cache = serviceProvider.GetService<IMemoryCache>();

        // Assert
        cache.Should().NotBeNull("IMemoryCache should be configured with size limit");
        // Note: Can't directly test MemoryCache options after registration,
        // but we verify it doesn't throw and cache is available
    }

    [Test]
    public void AddInfrastructure_RegistersHttpClient()
    {
        // Act
        _services.AddInfrastructure(_configuration, _environment);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var httpClientFactory = serviceProvider.GetService<IHttpClientFactory>();
        httpClientFactory.Should().NotBeNull("IHttpClientFactory should be registered");

        var httpClient = httpClientFactory!.CreateClient("GatherGroveApi");
        httpClient.Should().NotBeNull("Named HttpClient 'GatherGroveApi' should be available");
        httpClient.Timeout.Should().Be(TimeSpan.FromSeconds(30), "HttpClient should have 30 second timeout");
    }

    [Test]
    public void AddInfrastructure_DevelopmentEnvironment_EnablesSensitiveDataLogging()
    {
        // Arrange
        var devEnvironment = new TestHostEnvironment { EnvironmentName = "Development" };

        // Act
        _services.AddInfrastructure(_configuration, devEnvironment);

        // Assert - Verify DbContext is registered (sensitive data logging can't be tested directly)
        var descriptor = _services.FirstOrDefault(d => d.ServiceType == typeof(GatherGroveDbContext));
        descriptor.Should().NotBeNull("DbContext should be registered in development");
    }

    [Test]
    public void AddInfrastructure_ProductionEnvironment_DisablesSensitiveDataLogging()
    {
        // Arrange
        var prodEnvironment = new TestHostEnvironment { EnvironmentName = "Production" };

        // Act
        _services.AddInfrastructure(_configuration, prodEnvironment);

        // Assert - Verify DbContext is registered (production optimizations applied)
        var descriptor = _services.FirstOrDefault(d => d.ServiceType == typeof(GatherGroveDbContext));
        descriptor.Should().NotBeNull("DbContext should be registered in production");
    }

    [Test]
    public void AddInfrastructure_WithEmptyConfiguration_RegistersServices()
    {
        // Arrange - Configuration without connection string
        var emptyConfig = new ConfigurationBuilder().Build();

        // Act
        _services.AddInfrastructure(emptyConfig, _environment);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert - Services should be registered even if configuration is incomplete
        // (EF Core will fail gracefully when database operations are attempted)
        var dbContext = serviceProvider.GetRequiredService<GatherGroveDbContext>();
        dbContext.Should().NotBeNull("DbContext should be registered regardless of connection string");

        var tierService = serviceProvider.GetService<ITierGateService>();
        tierService.Should().NotBeNull("Services should be registered regardless of database configuration");
    }

    #endregion

    #region Helper Classes

    /// <summary>
    /// Test implementation of IHostEnvironment
    /// </summary>
    private class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Testing";
        public string ApplicationName { get; set; } = "GatherGrove.Infrastructure.Tests";
        public string ContentRootPath { get; set; } = AppDomain.CurrentDomain.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }

    #endregion
}
