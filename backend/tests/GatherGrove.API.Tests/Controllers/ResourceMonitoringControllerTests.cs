using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services.Caching;
using GatherGrove.Application.Services.Monitoring;
using GatherGrove.Application.Services.TierValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

// Import actual models from application layer

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class ResourceMonitoringControllerTests
{
    private Mock<IResourceOptimizationMonitor> _resourceMonitorMock = null!;
    private Mock<ITierAwareCacheService> _cacheServiceMock = null!;
    private Mock<ITierGateService> _tierGateServiceMock = null!;
    private Mock<ILogger<ResourceMonitoringController>> _loggerMock = null!;
    private ResourceMonitoringController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _resourceMonitorMock = new Mock<IResourceOptimizationMonitor>();
        _cacheServiceMock = new Mock<ITierAwareCacheService>();
        _tierGateServiceMock = new Mock<ITierGateService>();
        _loggerMock = new Mock<ILogger<ResourceMonitoringController>>();

        _controller = new ResourceMonitoringController(
            _resourceMonitorMock.Object,
            _cacheServiceMock.Object,
            _tierGateServiceMock.Object,
            _loggerMock.Object);

        // Setup controller context with authenticated user
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = CreateAuthenticatedUser()
            }
        };
    }

    #region GetOptimizationReport Tests

    [Test]
    public async Task GetOptimizationReport_ValidRequest_ReturnsReport()
    {
        // Arrange
        var report = new ResourceOptimizationReport
        {
            OptimizationRate = 75.5,
            TotalOperations = 1000,
            BlockedOperations = 755,
            AllowedOperations = 245
        };
        _resourceMonitorMock.Setup(r => r.GetOptimizationReportAsync())
            .ReturnsAsync(report);

        // Act
        var result = await _controller.GetOptimizationReport();

        // Assert
        result.Should().BeOfType<ActionResult<ResourceOptimizationReport>>();
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(report);
    }

    [Test]
    public async Task GetOptimizationReport_ServiceThrowsException_Returns500()
    {
        // Arrange
        _resourceMonitorMock.Setup(r => r.GetOptimizationReportAsync())
            .ThrowsAsync(new InvalidOperationException("Test error"));

        // Act
        var result = await _controller.GetOptimizationReport();

        // Assert
        var objectResult = result.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetDetailedMetrics Tests

    [Test]
    public async Task GetDetailedMetrics_ValidRequest_ReturnsMetrics()
    {
        // Arrange
        var metrics = new Dictionary<string, ResourceMetrics>
        {
            { "Query", new ResourceMetrics
                {
                    OperationType = "Query",
                    Count = 500,
                    TotalEstimatedCost = TimeSpan.FromSeconds(100),
                    LastRecorded = DateTime.UtcNow
                }
            },
            { "AnalyticsCalculation", new ResourceMetrics
                {
                    OperationType = "AnalyticsCalculation",
                    Count = 300,
                    TotalEstimatedCost = TimeSpan.FromSeconds(75),
                    LastRecorded = DateTime.UtcNow
                }
            }
        };
        _resourceMonitorMock.Setup(r => r.GetDetailedMetricsAsync())
            .ReturnsAsync(metrics);

        // Act
        var result = await _controller.GetDetailedMetrics();

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        var returnedMetrics = okResult!.Value as Dictionary<string, ResourceMetrics>;
        returnedMetrics.Should().NotBeNull();
        returnedMetrics!.Should().HaveCount(2);
        returnedMetrics.Should().ContainKey("Query");
        returnedMetrics.Should().ContainKey("AnalyticsCalculation");
    }

    [Test]
    public async Task GetDetailedMetrics_ServiceThrowsException_Returns500()
    {
        // Arrange
        _resourceMonitorMock.Setup(r => r.GetDetailedMetricsAsync())
            .ThrowsAsync(new InvalidOperationException("Test error"));

        // Act
        var result = await _controller.GetDetailedMetrics();

        // Assert
        var objectResult = result.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region ValidateOptimizationTargets Tests

    [Test]
    public async Task ValidateOptimizationTargets_AllTargetsMet_ReturnsStatus()
    {
        // Arrange
        var targetStatus = new OptimizationTargetStatus
        {
            CpuTarget = new TargetStatus { IsMet = true, Actual = 70 },
            MemoryTarget = new TargetStatus { IsMet = true, Actual = 60 },
            DatabaseTarget = new TargetStatus { IsMet = true, Actual = 50 }
        };
        _resourceMonitorMock.Setup(r => r.ValidateOptimizationTargetsAsync())
            .ReturnsAsync(targetStatus);

        // Act
        var result = await _controller.ValidateOptimizationTargets();

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(targetStatus);
    }

    [Test]
    public async Task ValidateOptimizationTargets_SomeTargetsNotMet_ReturnsStatus()
    {
        // Arrange
        var targetStatus = new OptimizationTargetStatus
        {
            CpuTarget = new TargetStatus { IsMet = false, Actual = 40 },
            MemoryTarget = new TargetStatus { IsMet = true, Actual = 60 },
            DatabaseTarget = new TargetStatus { IsMet = true, Actual = 50 }
        };
        _resourceMonitorMock.Setup(r => r.ValidateOptimizationTargetsAsync())
            .ReturnsAsync(targetStatus);

        // Act
        var result = await _controller.ValidateOptimizationTargets();

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(targetStatus);
    }

    [Test]
    public async Task ValidateOptimizationTargets_ServiceThrowsException_Returns500()
    {
        // Arrange
        _resourceMonitorMock.Setup(r => r.ValidateOptimizationTargetsAsync())
            .ThrowsAsync(new InvalidOperationException("Test error"));

        // Act
        var result = await _controller.ValidateOptimizationTargets();

        // Assert
        var objectResult = result.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetCacheStatistics Tests

    [Test]
    public async Task GetCacheStatistics_ValidRequest_ReturnsStatistics()
    {
        // Arrange
        var cacheStats = new CacheStatistics
        {
            MemorySavingsPercentage = 65.5,
            CacheHitsUnlimited = 850,
            CacheBypassesBasic = 150,
            TotalRequests = 1000
        };
        _cacheServiceMock.Setup(c => c.GetCacheStatisticsAsync())
            .ReturnsAsync(cacheStats);

        // Act
        var result = await _controller.GetCacheStatistics();

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(cacheStats);
    }

    [Test]
    public async Task GetCacheStatistics_ServiceThrowsException_Returns500()
    {
        // Arrange
        _cacheServiceMock.Setup(c => c.GetCacheStatisticsAsync())
            .ThrowsAsync(new InvalidOperationException("Test error"));

        // Act
        var result = await _controller.GetCacheStatistics();

        // Assert
        var objectResult = result.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region RecordBlockedOperation Tests

    [Test]
    public async Task RecordBlockedOperation_ValidRequest_ReturnsSuccess()
    {
        // Arrange
        var request = new RecordBlockedOperationRequest
        {
            ClubId = 1,
            OperationType = "Query",
            EstimatedCostMs = 150.5
        };
        _resourceMonitorMock.Setup(r => r.RecordBlockedOperationAsync(
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<TimeSpan>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.RecordBlockedOperation(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        _resourceMonitorMock.Verify(r => r.RecordBlockedOperationAsync(
            1,
            "Query",
            It.Is<TimeSpan>(t => Math.Abs(t.TotalMilliseconds - 150.5) < 0.1)),
            Times.Once);
    }

    [Test]
    public async Task RecordBlockedOperation_ServiceThrowsException_Returns500()
    {
        // Arrange
        var request = new RecordBlockedOperationRequest
        {
            ClubId = 1,
            OperationType = "Query",
            EstimatedCostMs = 150.5
        };
        _resourceMonitorMock.Setup(r => r.RecordBlockedOperationAsync(
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<TimeSpan>()))
            .ThrowsAsync(new InvalidOperationException("Test error"));

        // Act
        var result = await _controller.RecordBlockedOperation(request);

        // Assert
        var objectResult = result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region RecordAllowedOperation Tests

    [Test]
    public async Task RecordAllowedOperation_ValidRequest_ReturnsSuccess()
    {
        // Arrange
        var request = new RecordAllowedOperationRequest
        {
            ClubId = 1,
            OperationType = "AnalyticsCalculation",
            ActualCostMs = 250.75
        };
        _resourceMonitorMock.Setup(r => r.RecordAllowedOperationAsync(
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<TimeSpan>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.RecordAllowedOperation(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        _resourceMonitorMock.Verify(r => r.RecordAllowedOperationAsync(
            1,
            "AnalyticsCalculation",
            It.Is<TimeSpan>(t => Math.Abs(t.TotalMilliseconds - 250.75) < 0.1)),
            Times.Once);
    }

    [Test]
    public async Task RecordAllowedOperation_ServiceThrowsException_Returns500()
    {
        // Arrange
        var request = new RecordAllowedOperationRequest
        {
            ClubId = 1,
            OperationType = "AnalyticsCalculation",
            ActualCostMs = 250.75
        };
        _resourceMonitorMock.Setup(r => r.RecordAllowedOperationAsync(
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<TimeSpan>()))
            .ThrowsAsync(new InvalidOperationException("Test error"));

        // Act
        var result = await _controller.RecordAllowedOperation(request);

        // Assert
        var objectResult = result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region ResetMetrics Tests

    [Test]
    public async Task ResetMetrics_ValidRequest_ResetsAllMetrics()
    {
        // Arrange
        _resourceMonitorMock.Setup(r => r.ResetMetricsAsync())
            .Returns(Task.CompletedTask);
        _cacheServiceMock.Setup(c => c.ResetStatisticsAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ResetMetrics();

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        _resourceMonitorMock.Verify(r => r.ResetMetricsAsync(), Times.Once);
        _cacheServiceMock.Verify(c => c.ResetStatisticsAsync(), Times.Once);
    }

    [Test]
    public async Task ResetMetrics_ServiceThrowsException_Returns500()
    {
        // Arrange
        _resourceMonitorMock.Setup(r => r.ResetMetricsAsync())
            .ThrowsAsync(new InvalidOperationException("Test error"));

        // Act
        var result = await _controller.ResetMetrics();

        // Assert
        var objectResult = result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetOptimizationHealth Tests

    [Test]
    public async Task GetOptimizationHealth_ExcellentOptimization_ReturnsExcellentStatus()
    {
        // Arrange
        var report = new ResourceOptimizationReport
        {
            OptimizationRate = 75.0,
            CurrentCpuUsage = 30.0,
            CurrentMemoryAvailable = 70.0,
            BlockedOperations = 750
        };
        var cacheStats = new CacheStatistics { MemorySavingsPercentage = 60.0 };
        var targetStatus = new OptimizationTargetStatus
        {
            CpuTarget = new TargetStatus { IsMet = true },
            MemoryTarget = new TargetStatus { IsMet = true },
            DatabaseTarget = new TargetStatus { IsMet = true }
        };

        _resourceMonitorMock.Setup(r => r.GetOptimizationReportAsync())
            .ReturnsAsync(report);
        _cacheServiceMock.Setup(c => c.GetCacheStatisticsAsync())
            .ReturnsAsync(cacheStats);
        _resourceMonitorMock.Setup(r => r.ValidateOptimizationTargetsAsync())
            .ReturnsAsync(targetStatus);

        // Act
        var result = await _controller.GetOptimizationHealth();

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        var health = okResult!.Value as ResourceOptimizationHealth;
        health.Should().NotBeNull();
        health!.OverallStatus.Should().Be("Excellent");
        health.OptimizationRate.Should().Be(75.0);
        health.CacheEfficiency.Should().Be(60.0);
    }

    [Test]
    public async Task GetOptimizationHealth_GoodOptimization_ReturnsGoodStatus()
    {
        // Arrange
        var report = new ResourceOptimizationReport
        {
            OptimizationRate = 55.0,
            CurrentCpuUsage = 40.0,
            CurrentMemoryAvailable = 60.0,
            BlockedOperations = 550
        };
        var cacheStats = new CacheStatistics { MemorySavingsPercentage = 50.0 };
        var targetStatus = new OptimizationTargetStatus();

        _resourceMonitorMock.Setup(r => r.GetOptimizationReportAsync())
            .ReturnsAsync(report);
        _cacheServiceMock.Setup(c => c.GetCacheStatisticsAsync())
            .ReturnsAsync(cacheStats);
        _resourceMonitorMock.Setup(r => r.ValidateOptimizationTargetsAsync())
            .ReturnsAsync(targetStatus);

        // Act
        var result = await _controller.GetOptimizationHealth();

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        var health = okResult!.Value as ResourceOptimizationHealth;
        health.Should().NotBeNull();
        health!.OverallStatus.Should().Be("Good");
        health.OptimizationRate.Should().Be(55.0);
    }

    [Test]
    public async Task GetOptimizationHealth_FairOptimization_ReturnsFairStatus()
    {
        // Arrange
        var report = new ResourceOptimizationReport
        {
            OptimizationRate = 35.0,
            CurrentCpuUsage = 60.0,
            CurrentMemoryAvailable = 40.0,
            BlockedOperations = 350
        };
        var cacheStats = new CacheStatistics { MemorySavingsPercentage = 30.0 };
        var targetStatus = new OptimizationTargetStatus();

        _resourceMonitorMock.Setup(r => r.GetOptimizationReportAsync())
            .ReturnsAsync(report);
        _cacheServiceMock.Setup(c => c.GetCacheStatisticsAsync())
            .ReturnsAsync(cacheStats);
        _resourceMonitorMock.Setup(r => r.ValidateOptimizationTargetsAsync())
            .ReturnsAsync(targetStatus);

        // Act
        var result = await _controller.GetOptimizationHealth();

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        var health = okResult!.Value as ResourceOptimizationHealth;
        health.Should().NotBeNull();
        health!.OverallStatus.Should().Be("Fair");
    }

    [Test]
    public async Task GetOptimizationHealth_PoorOptimization_ReturnsPoorStatus()
    {
        // Arrange
        var report = new ResourceOptimizationReport
        {
            OptimizationRate = 15.0,
            CurrentCpuUsage = 80.0,
            CurrentMemoryAvailable = 20.0,
            BlockedOperations = 150
        };
        var cacheStats = new CacheStatistics { MemorySavingsPercentage = 10.0 };
        var targetStatus = new OptimizationTargetStatus();

        _resourceMonitorMock.Setup(r => r.GetOptimizationReportAsync())
            .ReturnsAsync(report);
        _cacheServiceMock.Setup(c => c.GetCacheStatisticsAsync())
            .ReturnsAsync(cacheStats);
        _resourceMonitorMock.Setup(r => r.ValidateOptimizationTargetsAsync())
            .ReturnsAsync(targetStatus);

        // Act
        var result = await _controller.GetOptimizationHealth();

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        var health = okResult!.Value as ResourceOptimizationHealth;
        health.Should().NotBeNull();
        health!.OverallStatus.Should().Be("Poor");
    }

    [Test]
    public async Task GetOptimizationHealth_ServiceThrowsException_Returns500()
    {
        // Arrange
        _resourceMonitorMock.Setup(r => r.GetOptimizationReportAsync())
            .ThrowsAsync(new InvalidOperationException("Test error"));

        // Act
        var result = await _controller.GetOptimizationHealth();

        // Assert
        var objectResult = result.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetTierDistribution Tests

    [Test]
    public async Task GetTierDistribution_ValidRequest_ReturnsDistribution()
    {
        // Arrange
        var report = new ResourceOptimizationReport
        {
            AllowedOperations = 300,
            BlockedOperations = 700,
            TotalOperations = 1000,
            OptimizationRate = 70.0,
            EstimatedCpuSavings = 65.0,
            EstimatedMemorySavings = 55.0,
            EstimatedDatabaseSavings = 45.0,
            TrackingPeriod = TimeSpan.FromHours(24)
        };
        _resourceMonitorMock.Setup(r => r.GetOptimizationReportAsync())
            .ReturnsAsync(report);

        // Act
        var result = await _controller.GetTierDistribution();

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        var distribution = okResult!.Value as TierDistributionMetrics;
        distribution.Should().NotBeNull();
        distribution!.UnlimitedTierOperations.Should().Be(300);
        distribution.BasicTierOperations.Should().Be(700);
        distribution.TotalOperations.Should().Be(1000);
        distribution.OptimizationEfficiency.Should().Be(70.0);
        distribution.ResourceSavingsBreakdown.CpuSavings.Should().Be(65.0);
        distribution.ResourceSavingsBreakdown.MemorySavings.Should().Be(55.0);
        distribution.ResourceSavingsBreakdown.DatabaseSavings.Should().Be(45.0);
    }

    [Test]
    public async Task GetTierDistribution_ServiceThrowsException_Returns500()
    {
        // Arrange
        _resourceMonitorMock.Setup(r => r.GetOptimizationReportAsync())
            .ThrowsAsync(new InvalidOperationException("Test error"));

        // Act
        var result = await _controller.GetTierDistribution();

        // Assert
        var objectResult = result.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region TriggerCacheWarmup Tests

    [Test]
    public async Task TriggerCacheWarmup_WithClubIdsAndKeys_WarmsUpCache()
    {
        // Arrange
        var request = new CacheWarmupRequest
        {
            ClubIds = new[] { 1, 2, 3 },
            CacheKeys = new[] { "key1", "key2" }
        };
        _cacheServiceMock.Setup(c => c.WarmupCacheAsync(
                It.IsAny<int[]>(),
                It.IsAny<string[]>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.TriggerCacheWarmup(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        _cacheServiceMock.Verify(c => c.WarmupCacheAsync(
            It.Is<int[]>(ids => ids.Length == 3),
            It.Is<string[]>(keys => keys.Length == 2)),
            Times.Once);
    }

    [Test]
    public async Task TriggerCacheWarmup_WithNullArrays_UsesEmptyArrays()
    {
        // Arrange
        var request = new CacheWarmupRequest
        {
            ClubIds = null,
            CacheKeys = null
        };
        _cacheServiceMock.Setup(c => c.WarmupCacheAsync(
                It.IsAny<int[]>(),
                It.IsAny<string[]>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.TriggerCacheWarmup(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        _cacheServiceMock.Verify(c => c.WarmupCacheAsync(
            It.Is<int[]>(ids => ids.Length == 0),
            It.Is<string[]>(keys => keys.Length == 0)),
            Times.Once);
    }

    [Test]
    public async Task TriggerCacheWarmup_ServiceThrowsException_Returns500()
    {
        // Arrange
        var request = new CacheWarmupRequest
        {
            ClubIds = new[] { 1, 2, 3 },
            CacheKeys = new[] { "key1", "key2" }
        };
        _cacheServiceMock.Setup(c => c.WarmupCacheAsync(
                It.IsAny<int[]>(),
                It.IsAny<string[]>()))
            .ThrowsAsync(new InvalidOperationException("Test error"));

        // Act
        var result = await _controller.TriggerCacheWarmup(request);

        // Assert
        var objectResult = result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region Helper Methods

    private ClaimsPrincipal CreateAuthenticatedUser(bool isAdmin = false)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Name, "testuser@example.com"),
            new("ClubId", "1")
        };

        if (isAdmin)
        {
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        }

        var identity = new ClaimsIdentity(claims, "TestAuth");
        return new ClaimsPrincipal(identity);
    }

    #endregion
}
