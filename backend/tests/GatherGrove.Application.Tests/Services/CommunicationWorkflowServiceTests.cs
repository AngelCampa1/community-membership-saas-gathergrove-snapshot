using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class CommunicationWorkflowServiceTests
{
    private GatherGroveDbContext _context = null!;
    private CommunicationWorkflowService _service = null!;
    private Mock<ILogger<CommunicationWorkflowService>> _mockLogger = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<CommunicationWorkflowService>>();
        _service = new CommunicationWorkflowService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region CreateWorkflowAsync Tests

    [Test]
    public async Task CreateWorkflowAsync_ValidRequest_ReturnsWorkflowResponse()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new CreateWorkflowRequest
        {
            WorkflowName = "Welcome Email",
            TriggerType = "MemberJoin",
            WorkflowSteps = "[{\"action\":\"SendEmail\",\"templateId\":1}]"
        };

        // Act
        var result = await _service.CreateWorkflowAsync(clubId, userId, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.WorkflowName, Is.EqualTo("Welcome Email"));
        Assert.That(result.TriggerType, Is.EqualTo("MemberJoin"));
        Assert.That(result.IsActive, Is.True);
    }

    [Test]
    public async Task CreateWorkflowAsync_ValidRequest_SavesWorkflowToDatabase()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new CreateWorkflowRequest
        {
            WorkflowName = "Test Workflow",
            TriggerType = "EventRSVP",
            WorkflowSteps = "[]"
        };

        // Act
        await _service.CreateWorkflowAsync(clubId, userId, request);

        // Assert
        var savedWorkflow = await _context.CommunicationWorkflows.FirstOrDefaultAsync();
        Assert.That(savedWorkflow, Is.Not.Null);
        Assert.That(savedWorkflow!.ClubId, Is.EqualTo(clubId));
        Assert.That(savedWorkflow.CreatedByUserId, Is.EqualTo(userId));
    }

    [Test]
    public async Task CreateWorkflowAsync_ValidRequest_ReturnsCorrectId()
    {
        // Arrange
        var request = new CreateWorkflowRequest
        {
            WorkflowName = "ID Test Workflow",
            TriggerType = "MemberJoin",
            WorkflowSteps = "[]"
        };

        // Act
        var result = await _service.CreateWorkflowAsync(1, 1, request);

        // Assert
        Assert.That(result.Id, Is.GreaterThan(0));
    }

    [Test]
    public async Task CreateWorkflowAsync_LogsInformation()
    {
        // Arrange
        var clubId = 42;
        var request = new CreateWorkflowRequest
        {
            WorkflowName = "Logging Test",
            TriggerType = "MemberJoin",
            WorkflowSteps = "[]"
        };

        // Act
        await _service.CreateWorkflowAsync(clubId, 1, request);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) =>
                    v.ToString()!.Contains("Creating communication workflow") &&
                    v.ToString()!.Contains("42")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task CreateWorkflowAsync_SetsTimestamps()
    {
        // Arrange
        var before = DateTime.UtcNow;
        var request = new CreateWorkflowRequest
        {
            WorkflowName = "Timestamp Test",
            TriggerType = "MemberJoin",
            WorkflowSteps = "[]"
        };

        // Act
        var result = await _service.CreateWorkflowAsync(1, 1, request);
        var after = DateTime.UtcNow;

        // Assert
        Assert.That(result.CreatedAt, Is.InRange(before, after));
    }

    #endregion

    #region GetWorkflowAsync Tests

    [Test]
    public async Task GetWorkflowAsync_ExistingWorkflow_ReturnsWorkflow()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Test Workflow");

        // Act
        var result = await _service.GetWorkflowAsync(1, workflow.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.WorkflowName, Is.EqualTo("Test Workflow"));
    }

    [Test]
    public void GetWorkflowAsync_NonExistingWorkflow_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.GetWorkflowAsync(1, 999));
        Assert.That(ex!.Message, Does.Contain("Workflow not found"));
    }

    [Test]
    public void GetWorkflowAsync_WrongClub_ThrowsArgumentException()
    {
        // Arrange
        var workflow = CreateTestWorkflow(1, "Test Workflow").Result;

        // Act & Assert - different club ID
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.GetWorkflowAsync(2, workflow.Id));
        Assert.That(ex!.Message, Does.Contain("Workflow not found"));
    }

    #endregion

    #region GetWorkflowsAsync Tests

    [Test]
    public async Task GetWorkflowsAsync_WithActiveWorkflows_ReturnsOnlyActive()
    {
        // Arrange
        await CreateTestWorkflow(1, "Active 1", isActive: true);
        await CreateTestWorkflow(1, "Active 2", isActive: true);
        await CreateTestWorkflow(1, "Inactive", isActive: false);

        // Act
        var results = await _service.GetWorkflowsAsync(1, includeInactive: false);

        // Assert
        Assert.That(results.Count, Is.EqualTo(2));
        Assert.That(results.All(w => w.IsActive), Is.True);
    }

    [Test]
    public async Task GetWorkflowsAsync_IncludeInactive_ReturnsAll()
    {
        // Arrange
        await CreateTestWorkflow(1, "Active", isActive: true);
        await CreateTestWorkflow(1, "Inactive", isActive: false);

        // Act
        var results = await _service.GetWorkflowsAsync(1, includeInactive: true);

        // Assert
        Assert.That(results.Count, Is.EqualTo(2));
    }

    [Test]
    public async Task GetWorkflowsAsync_DifferentClubs_ReturnsOnlyForSpecifiedClub()
    {
        // Arrange
        await CreateTestWorkflow(1, "Club 1 Workflow");
        await CreateTestWorkflow(2, "Club 2 Workflow");

        // Act
        var club1Workflows = await _service.GetWorkflowsAsync(1);
        var club2Workflows = await _service.GetWorkflowsAsync(2);

        // Assert
        Assert.That(club1Workflows.Count, Is.EqualTo(1));
        Assert.That(club2Workflows.Count, Is.EqualTo(1));
        Assert.That(club1Workflows[0].WorkflowName, Is.EqualTo("Club 1 Workflow"));
        Assert.That(club2Workflows[0].WorkflowName, Is.EqualTo("Club 2 Workflow"));
    }

    [Test]
    public async Task GetWorkflowsAsync_NoWorkflows_ReturnsEmptyList()
    {
        // Act
        var results = await _service.GetWorkflowsAsync(999);

        // Assert
        Assert.That(results, Is.Empty);
    }

    [Test]
    public async Task GetWorkflowsAsync_OrdersByCreatedAtDescending()
    {
        // Arrange
        var workflow1 = new CommunicationWorkflow
        {
            ClubId = 1,
            WorkflowName = "First",
            TriggerType = "MemberJoin",
            WorkflowSteps = "[]",
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow
        };
        var workflow2 = new CommunicationWorkflow
        {
            ClubId = 1,
            WorkflowName = "Second",
            TriggerType = "MemberJoin",
            WorkflowSteps = "[]",
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        };
        var workflow3 = new CommunicationWorkflow
        {
            ClubId = 1,
            WorkflowName = "Third",
            TriggerType = "MemberJoin",
            WorkflowSteps = "[]",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CommunicationWorkflows.AddRange(workflow1, workflow2, workflow3);
        await _context.SaveChangesAsync();

        // Act
        var results = await _service.GetWorkflowsAsync(1);

        // Assert - Should be ordered newest first
        Assert.That(results[0].WorkflowName, Is.EqualTo("Third"));
        Assert.That(results[1].WorkflowName, Is.EqualTo("Second"));
        Assert.That(results[2].WorkflowName, Is.EqualTo("First"));
    }

    #endregion

    #region UpdateWorkflowAsync Tests

    [Test]
    public async Task UpdateWorkflowAsync_UpdateName_UpdatesSuccessfully()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Original Name");
        var updateRequest = new UpdateWorkflowRequest { WorkflowName = "Updated Name" };

        // Act
        var result = await _service.UpdateWorkflowAsync(1, workflow.Id, updateRequest);

        // Assert
        Assert.That(result.WorkflowName, Is.EqualTo("Updated Name"));
    }

    [Test]
    public async Task UpdateWorkflowAsync_UpdateSteps_UpdatesSuccessfully()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Workflow");
        var newSteps = "[{\"action\":\"SendSMS\"}]";
        var updateRequest = new UpdateWorkflowRequest { WorkflowSteps = newSteps };

        // Act
        var result = await _service.UpdateWorkflowAsync(1, workflow.Id, updateRequest);

        // Assert
        Assert.That(result.WorkflowSteps, Is.EqualTo(newSteps));
    }

    [Test]
    public async Task UpdateWorkflowAsync_UpdateIsActive_UpdatesSuccessfully()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Workflow", isActive: true);
        var updateRequest = new UpdateWorkflowRequest { IsActive = false };

        // Act
        var result = await _service.UpdateWorkflowAsync(1, workflow.Id, updateRequest);

        // Assert
        Assert.That(result.IsActive, Is.False);
    }

    [Test]
    public void UpdateWorkflowAsync_NonExistingWorkflow_ThrowsArgumentException()
    {
        // Arrange
        var updateRequest = new UpdateWorkflowRequest { WorkflowName = "New Name" };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.UpdateWorkflowAsync(1, 999, updateRequest));
        Assert.That(ex!.Message, Does.Contain("Workflow not found"));
    }

    [Test]
    public async Task UpdateWorkflowAsync_NullName_DoesNotUpdateName()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Original Name");
        var updateRequest = new UpdateWorkflowRequest { WorkflowName = null };

        // Act
        var result = await _service.UpdateWorkflowAsync(1, workflow.Id, updateRequest);

        // Assert
        Assert.That(result.WorkflowName, Is.EqualTo("Original Name"));
    }

    [Test]
    public async Task UpdateWorkflowAsync_LogsInformation()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Logging Test");
        var updateRequest = new UpdateWorkflowRequest { WorkflowName = "Updated" };

        // Act
        await _service.UpdateWorkflowAsync(1, workflow.Id, updateRequest);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Updated workflow")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region DeleteWorkflowAsync Tests

    [Test]
    public async Task DeleteWorkflowAsync_ExistingWorkflow_RemovesFromDatabase()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "To Delete");

        // Act
        await _service.DeleteWorkflowAsync(1, workflow.Id);

        // Assert
        var deleted = await _context.CommunicationWorkflows.FindAsync(workflow.Id);
        Assert.That(deleted, Is.Null);
    }

    [Test]
    public void DeleteWorkflowAsync_NonExistingWorkflow_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.DeleteWorkflowAsync(1, 999));
        Assert.That(ex!.Message, Does.Contain("Workflow not found"));
    }

    [Test]
    public async Task DeleteWorkflowAsync_LogsInformation()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "To Delete");

        // Act
        await _service.DeleteWorkflowAsync(1, workflow.Id);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Deleted workflow")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region ToggleWorkflowAsync Tests

    [Test]
    public async Task ToggleWorkflowAsync_Activate_SetsIsActiveTrue()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Toggle Test", isActive: false);

        // Act
        var result = await _service.ToggleWorkflowAsync(1, workflow.Id, true);

        // Assert
        Assert.That(result.IsActive, Is.True);
    }

    [Test]
    public async Task ToggleWorkflowAsync_Deactivate_SetsIsActiveFalse()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Toggle Test", isActive: true);

        // Act
        var result = await _service.ToggleWorkflowAsync(1, workflow.Id, false);

        // Assert
        Assert.That(result.IsActive, Is.False);
    }

    [Test]
    public void ToggleWorkflowAsync_NonExistingWorkflow_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.ToggleWorkflowAsync(1, 999, true));
        Assert.That(ex!.Message, Does.Contain("Workflow not found"));
    }

    [Test]
    public async Task ToggleWorkflowAsync_LogsInformation()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Toggle Test");

        // Act
        await _service.ToggleWorkflowAsync(1, workflow.Id, false);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Toggled workflow")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region GetWorkflowStatsAsync Tests

    [Test]
    public async Task GetWorkflowStatsAsync_ExistingWorkflow_ReturnsStats()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Stats Test");

        // Act
        var stats = await _service.GetWorkflowStatsAsync(1, workflow.Id);

        // Assert
        Assert.That(stats, Is.Not.Null);
        Assert.That(stats.WorkflowId, Is.EqualTo(workflow.Id));
        Assert.That(stats.WorkflowName, Is.EqualTo("Stats Test"));
    }

    [Test]
    public async Task GetWorkflowStatsAsync_ReturnsDefaultStats()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Stats Test");

        // Act
        var stats = await _service.GetWorkflowStatsAsync(1, workflow.Id);

        // Assert
        Assert.That(stats.TotalExecutions, Is.EqualTo(0));
        Assert.That(stats.SuccessfulExecutions, Is.EqualTo(0));
        Assert.That(stats.FailedExecutions, Is.EqualTo(0));
        Assert.That(stats.SuccessRate, Is.EqualTo(0));
    }

    [Test]
    public void GetWorkflowStatsAsync_NonExistingWorkflow_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.GetWorkflowStatsAsync(1, 999));
        Assert.That(ex!.Message, Does.Contain("Workflow not found"));
    }

    #endregion

    #region ExecuteWorkflowAsync Tests

    [Test]
    public async Task ExecuteWorkflowAsync_ActiveWorkflow_CompletesSuccessfully()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Execute Test", isActive: true);
        var request = new ExecuteWorkflowRequest { MemberIds = new List<int> { 1, 2, 3 } };

        // Act & Assert - Should not throw
        await _service.ExecuteWorkflowAsync(1, workflow.Id, request);
    }

    [Test]
    public void ExecuteWorkflowAsync_InactiveWorkflow_ThrowsInvalidOperationException()
    {
        // Arrange
        var workflow = CreateTestWorkflow(1, "Inactive", isActive: false).Result;
        var request = new ExecuteWorkflowRequest();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.ExecuteWorkflowAsync(1, workflow.Id, request));
        Assert.That(ex!.Message, Does.Contain("Workflow is not active"));
    }

    [Test]
    public void ExecuteWorkflowAsync_NonExistingWorkflow_ThrowsArgumentException()
    {
        // Arrange
        var request = new ExecuteWorkflowRequest();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.ExecuteWorkflowAsync(1, 999, request));
        Assert.That(ex!.Message, Does.Contain("Workflow not found"));
    }

    [Test]
    public async Task ExecuteWorkflowAsync_LogsInformation()
    {
        // Arrange
        var workflow = await CreateTestWorkflow(1, "Logging Test", isActive: true);
        var request = new ExecuteWorkflowRequest();

        // Act
        await _service.ExecuteWorkflowAsync(1, workflow.Id, request);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Executing workflow")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Helper Methods

    private async Task<CommunicationWorkflow> CreateTestWorkflow(int clubId, string name, bool isActive = true)
    {
        var workflow = new CommunicationWorkflow
        {
            ClubId = clubId,
            WorkflowName = name,
            TriggerType = "MemberJoin",
            WorkflowSteps = "[]",
            IsActive = isActive,
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CommunicationWorkflows.Add(workflow);
        await _context.SaveChangesAsync();

        return workflow;
    }

    #endregion
}
