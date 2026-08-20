using NUnit.Framework;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace Domain.Tests.Entities;

[TestFixture]
public class MemberEngagementHistoryTests
{
    #region Default Value Tests (1 test)

    [Test]
    public void MetricsSnapshot_DefaultsToEmptyString()
    {
        var history = new MemberEngagementHistory();
        Assert.That(history.MetricsSnapshot, Is.EqualTo(string.Empty));
    }

    #endregion

    #region Score Component Tests (6 tests)

    [Test]
    public void OverallScore_CanBeSet()
    {
        var history = new MemberEngagementHistory { OverallScore = 75.5m };
        Assert.That(history.OverallScore, Is.EqualTo(75.5m));
    }

    [Test]
    public void LoginFrequencyScore_CanBeSet()
    {
        var history = new MemberEngagementHistory { LoginFrequencyScore = 80.0m };
        Assert.That(history.LoginFrequencyScore, Is.EqualTo(80.0m));
    }

    [Test]
    public void EventParticipationScore_CanBeSet()
    {
        var history = new MemberEngagementHistory { EventParticipationScore = 65.0m };
        Assert.That(history.EventParticipationScore, Is.EqualTo(65.0m));
    }

    [Test]
    public void CommunicationScore_CanBeSet()
    {
        var history = new MemberEngagementHistory { CommunicationScore = 70.0m };
        Assert.That(history.CommunicationScore, Is.EqualTo(70.0m));
    }

    [Test]
    public void AllScores_CanBeSetTogether()
    {
        var history = new MemberEngagementHistory
        {
            OverallScore = 75.0m,
            LoginFrequencyScore = 80.0m,
            EventParticipationScore = 70.0m,
            CommunicationScore = 75.0m,
            FeatureUsageScore = 65.0m,
            ProfileCompletenessScore = 90.0m
        };

        Assert.That(history.OverallScore, Is.EqualTo(75.0m));
        Assert.That(history.LoginFrequencyScore, Is.EqualTo(80.0m));
        Assert.That(history.EventParticipationScore, Is.EqualTo(70.0m));
        Assert.That(history.CommunicationScore, Is.EqualTo(75.0m));
        Assert.That(history.FeatureUsageScore, Is.EqualTo(65.0m));
        Assert.That(history.ProfileCompletenessScore, Is.EqualTo(90.0m));
    }

    [Test]
    public void EngagementLevel_CanBeSet()
    {
        var history = new MemberEngagementHistory { Level = EngagementLevel.Green };
        Assert.That(history.Level, Is.EqualTo(EngagementLevel.Green));
    }

    #endregion

    #region CalculateScoreChange Tests (3 tests)

    [Test]
    public void CalculateScoreChange_ReturnsZeroForNullPrevious()
    {
        var history = new MemberEngagementHistory { OverallScore = 75.0m };
        var change = history.CalculateScoreChange(null);
        Assert.That(change, Is.EqualTo(0));
    }

    [Test]
    public void CalculateScoreChange_ReturnsPositiveForImprovement()
    {
        var previous = new MemberEngagementHistory { OverallScore = 60.0m };
        var current = new MemberEngagementHistory { OverallScore = 75.0m };

        var change = current.CalculateScoreChange(previous);
        Assert.That(change, Is.EqualTo(15.0m));
    }

    [Test]
    public void CalculateScoreChange_ReturnsNegativeForDecline()
    {
        var previous = new MemberEngagementHistory { OverallScore = 80.0m };
        var current = new MemberEngagementHistory { OverallScore = 55.0m };

        var change = current.CalculateScoreChange(previous);
        Assert.That(change, Is.EqualTo(-25.0m));
    }

    #endregion

    #region GetLevelChange Tests (8 tests)

    [Test]
    public void GetLevelChange_ReturnsNewForNullPrevious()
    {
        var history = new MemberEngagementHistory { Level = EngagementLevel.Green };
        var change = history.GetLevelChange(null);
        Assert.That(change, Is.EqualTo("New"));
    }

    [Test]
    public void GetLevelChange_ReturnsUnchangedForSameLevel()
    {
        var previous = new MemberEngagementHistory { Level = EngagementLevel.Yellow };
        var current = new MemberEngagementHistory { Level = EngagementLevel.Yellow };

        var change = current.GetLevelChange(previous);
        Assert.That(change, Is.EqualTo("Unchanged"));
    }

    [Test]
    public void GetLevelChange_ReturnsImprovedForYellowToGreen()
    {
        var previous = new MemberEngagementHistory { Level = EngagementLevel.Yellow };
        var current = new MemberEngagementHistory { Level = EngagementLevel.Green };

        var change = current.GetLevelChange(previous);
        Assert.That(change, Is.EqualTo("Improved"));
    }

    [Test]
    public void GetLevelChange_ReturnsGreatlyImprovedForRedToGreen()
    {
        var previous = new MemberEngagementHistory { Level = EngagementLevel.Red };
        var current = new MemberEngagementHistory { Level = EngagementLevel.Green };

        var change = current.GetLevelChange(previous);
        Assert.That(change, Is.EqualTo("Greatly Improved"));
    }

    [Test]
    public void GetLevelChange_ReturnsDeclinedForGreenToYellow()
    {
        var previous = new MemberEngagementHistory { Level = EngagementLevel.Green };
        var current = new MemberEngagementHistory { Level = EngagementLevel.Yellow };

        var change = current.GetLevelChange(previous);
        Assert.That(change, Is.EqualTo("Declined"));
    }

    [Test]
    public void GetLevelChange_ReturnsGreatlyDeclinedForGreenToRed()
    {
        var previous = new MemberEngagementHistory { Level = EngagementLevel.Green };
        var current = new MemberEngagementHistory { Level = EngagementLevel.Red };

        var change = current.GetLevelChange(previous);
        Assert.That(change, Is.EqualTo("Greatly Declined"));
    }

    [Test]
    public void GetLevelChange_ReturnsImprovedForRedToYellow()
    {
        var previous = new MemberEngagementHistory { Level = EngagementLevel.Red };
        var current = new MemberEngagementHistory { Level = EngagementLevel.Yellow };

        var change = current.GetLevelChange(previous);
        Assert.That(change, Is.EqualTo("Improved"));
    }

    [Test]
    public void GetLevelChange_ReturnsDeclinedForYellowToRed()
    {
        var previous = new MemberEngagementHistory { Level = EngagementLevel.Yellow };
        var current = new MemberEngagementHistory { Level = EngagementLevel.Red };

        var change = current.GetLevelChange(previous);
        Assert.That(change, Is.EqualTo("Declined"));
    }

    #endregion
}
