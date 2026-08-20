using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class MemberEngagementScoreTests
{
    #region Default Value Tests (3 tests)

    [Test]
    public void ActivityLevel_DefaultsToUnknown()
    {
        var score = new MemberEngagementScore();
        Assert.That(score.ActivityLevel, Is.EqualTo("Unknown"));
    }

    [Test]
    public void EngagementLevel_DefaultsToRed()
    {
        var score = new MemberEngagementScore();
        Assert.That(score.EngagementLevel, Is.EqualTo("Red"));
    }

    [Test]
    public void IsAtRisk_DefaultsToFalse()
    {
        var score = new MemberEngagementScore();
        Assert.That(score.IsAtRisk, Is.False);
    }

    #endregion

    #region Score Component Tests (5 tests)

    [Test]
    public void OverallScore_CanBeSet()
    {
        var score = new MemberEngagementScore { OverallScore = 85.5m };
        Assert.That(score.OverallScore, Is.EqualTo(85.5m));
    }

    [Test]
    public void LoginScore_CanBeSet()
    {
        var score = new MemberEngagementScore { LoginScore = 90.0m };
        Assert.That(score.LoginScore, Is.EqualTo(90.0m));
    }

    [Test]
    public void EventScore_CanBeSet()
    {
        var score = new MemberEngagementScore { EventScore = 75.0m };
        Assert.That(score.EventScore, Is.EqualTo(75.0m));
    }

    [Test]
    public void CommunicationScore_CanBeSet()
    {
        var score = new MemberEngagementScore { CommunicationScore = 60.0m };
        Assert.That(score.CommunicationScore, Is.EqualTo(60.0m));
    }

    [Test]
    public void AllScoreComponents_CanBeSetTogether()
    {
        var score = new MemberEngagementScore
        {
            OverallScore = 80.0m,
            LoginScore = 85.0m,
            EventScore = 75.0m,
            CommunicationScore = 70.0m,
            FeatureUsageScore = 90.0m,
            ProfileCompletenessScore = 80.0m
        };

        Assert.That(score.OverallScore, Is.EqualTo(80.0m));
        Assert.That(score.LoginScore, Is.EqualTo(85.0m));
        Assert.That(score.EventScore, Is.EqualTo(75.0m));
        Assert.That(score.CommunicationScore, Is.EqualTo(70.0m));
        Assert.That(score.FeatureUsageScore, Is.EqualTo(90.0m));
        Assert.That(score.ProfileCompletenessScore, Is.EqualTo(80.0m));
    }

    #endregion

    #region Login Activity Metrics Tests (5 tests)

    [Test]
    public void LoginCount7Days_CanBeTracked()
    {
        var score = new MemberEngagementScore { LoginCount7Days = 5 };
        Assert.That(score.LoginCount7Days, Is.EqualTo(5));
    }

    [Test]
    public void LoginCount30Days_CanBeTracked()
    {
        var score = new MemberEngagementScore { LoginCount30Days = 15 };
        Assert.That(score.LoginCount30Days, Is.EqualTo(15));
    }

    [Test]
    public void LoginStreakDays_CanBeTracked()
    {
        var score = new MemberEngagementScore { LoginStreakDays = 7 };
        Assert.That(score.LoginStreakDays, Is.EqualTo(7));
    }

    [Test]
    public void AverageSessionDurationMinutes_CanBeCalculated()
    {
        var score = new MemberEngagementScore { AverageSessionDurationMinutes = 25.5m };
        Assert.That(score.AverageSessionDurationMinutes, Is.EqualTo(25.5m));
    }

    [Test]
    public void LoginActivityMetrics_CanBeSetTogether()
    {
        var score = new MemberEngagementScore
        {
            LoginCount7Days = 5,
            LoginCount30Days = 18,
            LoginCount90Days = 45,
            LastLoginDate = DateTime.UtcNow,
            LoginStreakDays = 3,
            AverageSessionDurationMinutes = 22.5m
        };

        Assert.That(score.LoginCount7Days, Is.EqualTo(5));
        Assert.That(score.LoginCount30Days, Is.EqualTo(18));
        Assert.That(score.LoginCount90Days, Is.EqualTo(45));
        Assert.That(score.LoginStreakDays, Is.EqualTo(3));
    }

    #endregion

    #region Activity Classification Tests (4 tests)

    [Test]
    public void ActivityLevel_CanBeSetToHighlyActive()
    {
        var score = new MemberEngagementScore { ActivityLevel = "HighlyActive" };
        Assert.That(score.ActivityLevel, Is.EqualTo("HighlyActive"));
    }

    [Test]
    public void ActivityLevel_CanBeSetToModerate()
    {
        var score = new MemberEngagementScore { ActivityLevel = "Moderate" };
        Assert.That(score.ActivityLevel, Is.EqualTo("Moderate"));
    }

    [Test]
    public void ActivityLevel_CanBeSetToInactive()
    {
        var score = new MemberEngagementScore { ActivityLevel = "Inactive" };
        Assert.That(score.ActivityLevel, Is.EqualTo("Inactive"));
    }

    [Test]
    public void EngagementLevel_SupportsGreenYellowRed()
    {
        var greenScore = new MemberEngagementScore { EngagementLevel = "Green" };
        var yellowScore = new MemberEngagementScore { EngagementLevel = "Yellow" };
        var redScore = new MemberEngagementScore { EngagementLevel = "Red" };

        Assert.That(greenScore.EngagementLevel, Is.EqualTo("Green"));
        Assert.That(yellowScore.EngagementLevel, Is.EqualTo("Yellow"));
        Assert.That(redScore.EngagementLevel, Is.EqualTo("Red"));
    }

    #endregion

    #region Risk Detection Tests (3 tests)

    [Test]
    public void IsAtRisk_CanBeSetToTrue()
    {
        var score = new MemberEngagementScore { IsAtRisk = true };
        Assert.That(score.IsAtRisk, Is.True);
    }

    [Test]
    public void DaysSinceLastLogin_CanBeTracked()
    {
        var score = new MemberEngagementScore { DaysSinceLastLogin = 35 };
        Assert.That(score.DaysSinceLastLogin, Is.EqualTo(35));
    }

    [Test]
    public void AtRiskMember_HasHighDaysSinceLastLogin()
    {
        var score = new MemberEngagementScore
        {
            DaysSinceLastLogin = 45,
            IsAtRisk = true,
            ActivityLevel = "Inactive",
            EngagementLevel = "Red",
            LoginCount30Days = 0
        };

        Assert.That(score.IsAtRisk, Is.True);
        Assert.That(score.DaysSinceLastLogin, Is.GreaterThan(30));
        Assert.That(score.ActivityLevel, Is.EqualTo("Inactive"));
        Assert.That(score.EngagementLevel, Is.EqualTo("Red"));
    }

    #endregion
}
