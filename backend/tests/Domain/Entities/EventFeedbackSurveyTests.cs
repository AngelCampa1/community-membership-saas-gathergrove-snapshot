using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class EventFeedbackSurveyTests
{
    #region Default Value Tests (5 tests)

    [Test]
    public void IsAnonymous_DefaultsToFalse()
    {
        var survey = new EventFeedbackSurvey();
        Assert.That(survey.IsAnonymous, Is.False);
    }

    [Test]
    public void IsActive_DefaultsToTrue()
    {
        var survey = new EventFeedbackSurvey();
        Assert.That(survey.IsActive, Is.True);
    }

    [Test]
    public void Title_DefaultsToEmptyString()
    {
        var survey = new EventFeedbackSurvey();
        Assert.That(survey.Title, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Description_DefaultsToEmptyString()
    {
        var survey = new EventFeedbackSurvey();
        Assert.That(survey.Description, Is.EqualTo(string.Empty));
    }

    [Test]
    public void ClosesAt_DefaultsToNull()
    {
        var survey = new EventFeedbackSurvey();
        Assert.That(survey.ClosesAt, Is.Null);
    }

    #endregion

    #region Anonymous Survey Tests (5 tests)

    [Test]
    public void IsAnonymous_CanBeSetToTrue()
    {
        var survey = new EventFeedbackSurvey { IsAnonymous = true };
        Assert.That(survey.IsAnonymous, Is.True);
    }

    [Test]
    public void IsAnonymous_CanBeToggled()
    {
        var survey = new EventFeedbackSurvey { IsAnonymous = true };
        survey.IsAnonymous = false;
        Assert.That(survey.IsAnonymous, Is.False);
    }

    [Test]
    public void IsAnonymous_SupportsAnonymousResponses()
    {
        var survey = new EventFeedbackSurvey { IsAnonymous = true };
        var response = new EventFeedbackResponse
        {
            SurveyId = survey.Id,
            MemberId = null // Anonymous - no member association
        };

        Assert.That(response.MemberId, Is.Null);
        Assert.That(survey.IsAnonymous, Is.True);
    }

    [Test]
    public void IsAnonymous_SupportsNonAnonymousResponses()
    {
        var survey = new EventFeedbackSurvey { IsAnonymous = false };
        var response = new EventFeedbackResponse
        {
            SurveyId = survey.Id,
            MemberId = 123 // Non-anonymous - member associated
        };

        Assert.That(response.MemberId, Is.EqualTo(123));
        Assert.That(survey.IsAnonymous, Is.False);
    }

    [Test]
    public void IsAnonymous_CanBeSetAfterCreation()
    {
        var survey = new EventFeedbackSurvey();
        Assert.That(survey.IsAnonymous, Is.False);

        survey.IsAnonymous = true;
        Assert.That(survey.IsAnonymous, Is.True);
    }

    #endregion

    #region Survey Closure Tests (5 tests)

    [Test]
    public void ClosesAt_CanBeSetToFutureDate()
    {
        var futureDate = DateTime.UtcNow.AddDays(7);
        var survey = new EventFeedbackSurvey { ClosesAt = futureDate };
        Assert.That(survey.ClosesAt, Is.EqualTo(futureDate));
    }

    [Test]
    public void ClosesAt_CanBeSetToPastDate()
    {
        var pastDate = DateTime.UtcNow.AddDays(-1);
        var survey = new EventFeedbackSurvey { ClosesAt = pastDate };
        Assert.That(survey.ClosesAt, Is.EqualTo(pastDate));
    }

    [Test]
    public void ClosesAt_CanRemainNull_ForNeverClosingSurvey()
    {
        var survey = new EventFeedbackSurvey { ClosesAt = null };
        Assert.That(survey.ClosesAt, Is.Null);
    }

    [Test]
    public void ClosesAt_CanBeUpdated()
    {
        var survey = new EventFeedbackSurvey { ClosesAt = DateTime.UtcNow.AddDays(1) };
        var newClosing = DateTime.UtcNow.AddDays(7);
        survey.ClosesAt = newClosing;
        Assert.That(survey.ClosesAt, Is.EqualTo(newClosing));
    }

    [Test]
    public void ClosesAt_PreservesDateTimePrecision()
    {
        var preciseTime = new DateTime(2025, 1, 31, 23, 59, 59, 999);
        var survey = new EventFeedbackSurvey { ClosesAt = preciseTime };
        Assert.That(survey.ClosesAt?.Millisecond, Is.EqualTo(999));
    }

    #endregion

    #region Survey Status Tests (3 tests)

    [Test]
    public void IsActive_CanBeSetToFalse()
    {
        var survey = new EventFeedbackSurvey { IsActive = false };
        Assert.That(survey.IsActive, Is.False);
    }

    [Test]
    public void IsActive_CanBeToggled()
    {
        var survey = new EventFeedbackSurvey { IsActive = false };
        survey.IsActive = true;
        Assert.That(survey.IsActive, Is.True);
    }

    [Test]
    public void IsActive_SupportsActivationDeactivationCycle()
    {
        var survey = new EventFeedbackSurvey { IsActive = true };
        Assert.That(survey.IsActive, Is.True);

        // Deactivate
        survey.IsActive = false;
        Assert.That(survey.IsActive, Is.False);

        // Reactivate
        survey.IsActive = true;
        Assert.That(survey.IsActive, Is.True);
    }

    #endregion

    #region Title and Description Tests (2 tests)

    [Test]
    public void Title_CanBeSet()
    {
        var survey = new EventFeedbackSurvey { Title = "Post-Event Feedback" };
        Assert.That(survey.Title, Is.EqualTo("Post-Event Feedback"));
    }

    [Test]
    public void Description_CanBeSet()
    {
        var description = "Please share your thoughts about the event to help us improve future experiences.";
        var survey = new EventFeedbackSurvey { Description = description };
        Assert.That(survey.Description, Is.EqualTo(description));
    }

    #endregion
}
