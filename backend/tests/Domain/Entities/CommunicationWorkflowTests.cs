using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class CommunicationWorkflowTests
{
    #region Default Value Tests (4 tests)

    [Test]
    public void WorkflowName_DefaultsToEmptyString()
    {
        var workflow = new CommunicationWorkflow();
        Assert.That(workflow.WorkflowName, Is.EqualTo(string.Empty));
    }

    [Test]
    public void TriggerType_DefaultsToEmptyString()
    {
        var workflow = new CommunicationWorkflow();
        Assert.That(workflow.TriggerType, Is.EqualTo(string.Empty));
    }

    [Test]
    public void WorkflowSteps_DefaultsToEmptyJsonArray()
    {
        var workflow = new CommunicationWorkflow();
        Assert.That(workflow.WorkflowSteps, Is.EqualTo("[]"));
    }

    [Test]
    public void IsActive_DefaultsToFalse()
    {
        var workflow = new CommunicationWorkflow();
        Assert.That(workflow.IsActive, Is.False);
    }

    #endregion

    #region Trigger Type Tests (5 tests)

    [Test]
    public void TriggerType_CanBeMemberJoin()
    {
        var workflow = new CommunicationWorkflow { TriggerType = "MemberJoin" };
        Assert.That(workflow.TriggerType, Is.EqualTo("MemberJoin"));
    }

    [Test]
    public void TriggerType_CanBeEventRSVP()
    {
        var workflow = new CommunicationWorkflow { TriggerType = "EventRSVP" };
        Assert.That(workflow.TriggerType, Is.EqualTo("EventRSVP"));
    }

    [Test]
    public void TriggerType_CanBeMemberInactivity()
    {
        var workflow = new CommunicationWorkflow { TriggerType = "MemberInactivity" };
        Assert.That(workflow.TriggerType, Is.EqualTo("MemberInactivity"));
    }

    [Test]
    public void TriggerType_CanBeCustomDate()
    {
        var workflow = new CommunicationWorkflow { TriggerType = "CustomDate" };
        Assert.That(workflow.TriggerType, Is.EqualTo("CustomDate"));
    }

    [Test]
    public void TriggerType_CanBeMemberBehavior()
    {
        var workflow = new CommunicationWorkflow { TriggerType = "MemberBehavior" };
        Assert.That(workflow.TriggerType, Is.EqualTo("MemberBehavior"));
    }

    #endregion

    #region Configuration Tests (4 tests)

    [Test]
    public void TriggerConfig_CanStoreJson()
    {
        var workflow = new CommunicationWorkflow
        {
            TriggerConfig = "{\"inactiveDays\":30,\"threshold\":3}"
        };
        Assert.That(workflow.TriggerConfig, Contains.Substring("inactiveDays"));
    }

    [Test]
    public void WorkflowSteps_CanStoreMultipleSteps()
    {
        var workflow = new CommunicationWorkflow
        {
            WorkflowSteps = "[{\"type\":\"email\",\"templateId\":5},{\"type\":\"delay\",\"hours\":24}]"
        };
        Assert.That(workflow.WorkflowSteps, Contains.Substring("email"));
        Assert.That(workflow.WorkflowSteps, Contains.Substring("delay"));
    }

    [Test]
    public void SegmentId_CanBeSet()
    {
        var workflow = new CommunicationWorkflow { SegmentId = 10 };
        Assert.That(workflow.SegmentId, Is.EqualTo(10));
    }

    [Test]
    public void SegmentId_CanBeNull()
    {
        var workflow = new CommunicationWorkflow { SegmentId = null };
        Assert.That(workflow.SegmentId, Is.Null);
    }

    #endregion

    #region Metrics Tests (5 tests)

    [Test]
    public void Counters_DefaultToZero()
    {
        var workflow = new CommunicationWorkflow();
        Assert.That(workflow.TriggerCount, Is.EqualTo(0));
        Assert.That(workflow.SuccessCount, Is.EqualTo(0));
        Assert.That(workflow.FailureCount, Is.EqualTo(0));
    }

    [Test]
    public void TriggerCount_CanBeIncremented()
    {
        var workflow = new CommunicationWorkflow { TriggerCount = 50 };
        Assert.That(workflow.TriggerCount, Is.EqualTo(50));
    }

    [Test]
    public void SuccessCount_TracksCompletions()
    {
        var workflow = new CommunicationWorkflow
        {
            TriggerCount = 100,
            SuccessCount = 95,
            FailureCount = 5
        };
        Assert.That(workflow.SuccessCount, Is.EqualTo(95));
        Assert.That(workflow.SuccessCount + workflow.FailureCount, Is.EqualTo(workflow.TriggerCount));
    }

    [Test]
    public void LastTriggeredAt_CanBeSet()
    {
        var triggerTime = DateTime.UtcNow;
        var workflow = new CommunicationWorkflow { LastTriggeredAt = triggerTime };
        Assert.That(workflow.LastTriggeredAt, Is.EqualTo(triggerTime));
    }

    [Test]
    public void LastTriggeredAt_CanBeNull()
    {
        var workflow = new CommunicationWorkflow { LastTriggeredAt = null };
        Assert.That(workflow.LastTriggeredAt, Is.Null);
    }

    #endregion

    #region Status Tests (3 tests)

    [Test]
    public void IsActive_CanBeSetToTrue()
    {
        var workflow = new CommunicationWorkflow { IsActive = true };
        Assert.That(workflow.IsActive, Is.True);
    }

    [Test]
    public void InactiveWorkflow_CanBeIdentified()
    {
        var activeWorkflow = new CommunicationWorkflow { IsActive = true };
        var inactiveWorkflow = new CommunicationWorkflow { IsActive = false };

        Assert.That(activeWorkflow.IsActive, Is.True);
        Assert.That(inactiveWorkflow.IsActive, Is.False);
    }

    [Test]
    public void ActiveWorkflow_HasNonZeroTriggerCount()
    {
        var workflow = new CommunicationWorkflow
        {
            IsActive = true,
            TriggerCount = 25,
            SuccessCount = 24,
            FailureCount = 1
        };

        Assert.That(workflow.IsActive, Is.True);
        Assert.That(workflow.TriggerCount, Is.GreaterThan(0));
    }

    #endregion

    #region Complete Workflow Scenarios Tests (5 tests)

    [Test]
    public void WelcomeEmailWorkflow_TriggersOnMemberJoin()
    {
        var workflow = new CommunicationWorkflow
        {
            ClubId = 5,
            WorkflowName = "Welcome Email Series",
            TriggerType = "MemberJoin",
            WorkflowSteps = "[{\"type\":\"email\",\"templateId\":1,\"delay\":0},{\"type\":\"email\",\"templateId\":2,\"delay\":3}]",
            IsActive = true,
            TriggerCount = 150,
            SuccessCount = 148,
            FailureCount = 2
        };

        Assert.That(workflow.TriggerType, Is.EqualTo("MemberJoin"));
        Assert.That(workflow.IsActive, Is.True);
        Assert.That(workflow.SuccessCount, Is.GreaterThan(workflow.FailureCount));
    }

    [Test]
    public void InactivityWorkflow_HasSegmentFilter()
    {
        var workflow = new CommunicationWorkflow
        {
            WorkflowName = "Re-engagement Campaign",
            TriggerType = "MemberInactivity",
            TriggerConfig = "{\"inactiveDays\":30}",
            SegmentId = 10,
            IsActive = true
        };

        Assert.That(workflow.TriggerType, Is.EqualTo("MemberInactivity"));
        Assert.That(workflow.SegmentId, Is.Not.Null);
        Assert.That(workflow.TriggerConfig, Contains.Substring("inactiveDays"));
    }

    [Test]
    public void EventReminderWorkflow_HasMultipleSteps()
    {
        var workflow = new CommunicationWorkflow
        {
            WorkflowName = "Event Reminder Series",
            TriggerType = "EventRSVP",
            WorkflowSteps = "[{\"type\":\"email\",\"templateId\":5,\"delay\":0},{\"type\":\"sms\",\"delay\":1},{\"type\":\"email\",\"templateId\":6,\"delay\":3}]",
            IsActive = true,
            LastTriggeredAt = DateTime.UtcNow.AddHours(-2)
        };

        Assert.That(workflow.WorkflowSteps, Contains.Substring("email"));
        Assert.That(workflow.WorkflowSteps, Contains.Substring("sms"));
        Assert.That(workflow.LastTriggeredAt, Is.Not.Null);
    }

    [Test]
    public void NewWorkflow_HasNoExecutionHistory()
    {
        var workflow = new CommunicationWorkflow
        {
            WorkflowName = "Birthday Wishes",
            TriggerType = "CustomDate",
            IsActive = false,
            TriggerCount = 0,
            LastTriggeredAt = null
        };

        Assert.That(workflow.TriggerCount, Is.EqualTo(0));
        Assert.That(workflow.LastTriggeredAt, Is.Null);
        Assert.That(workflow.IsActive, Is.False);
    }

    [Test]
    public void HighVolumeWorkflow_TracksAccurateMetrics()
    {
        var workflow = new CommunicationWorkflow
        {
            WorkflowName = "Weekly Newsletter",
            TriggerType = "CustomDate",
            IsActive = true,
            TriggerCount = 5000,
            SuccessCount = 4950,
            FailureCount = 50,
            LastTriggeredAt = DateTime.UtcNow.AddDays(-7)
        };

        var successRate = (double)workflow.SuccessCount / workflow.TriggerCount;
        Assert.That(successRate, Is.GreaterThan(0.95)); // 95% success rate
        Assert.That(workflow.TriggerCount, Is.GreaterThan(1000));
    }

    #endregion
}
