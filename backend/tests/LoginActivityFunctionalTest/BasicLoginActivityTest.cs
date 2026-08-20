using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace LoginActivityFunctionalTest;

[TestFixture]
public class BasicLoginActivityTest
{
    [Test]
    public void EngagementScoringService_CanBeInstantiated()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new GatherGroveDbContext(options);
        var loggerMock = new Mock<ILogger<EngagementScoringService>>();
        
        var service = new EngagementScoringService(context, loggerMock.Object);
        
        Assert.That(service, Is.Not.Null);
    }

    [Test]
    public void LoginActivityService_CanBeInstantiated()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new GatherGroveDbContext(options);
        var loggerMock = new Mock<ILogger<LoginActivityService>>();
        
        var service = new LoginActivityService(context, loggerMock.Object);
        
        Assert.That(service, Is.Not.Null);
    }

    [Test]
    public void ClubService_CanBeInstantiated()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new GatherGroveDbContext(options);
        var loggerMock = new Mock<ILogger<ClubService>>();
        
        var service = new ClubService(context, loggerMock.Object);
        
        Assert.That(service, Is.Not.Null);
    }
}