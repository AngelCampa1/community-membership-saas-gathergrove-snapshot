using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Tests.TestUtilities;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;

namespace GatherGrove.Infrastructure.Tests.Repositories;

[TestFixture]
public class EventFeedbackRepositoryTests : RepositoryTestBase
{
    private EventFeedbackRepository _repository = null!;
    private Club _testClub = null!;
    private Event _testEvent = null!;
    private Member _testMember = null!;

    [SetUp]
    public void SetUp()
    {
        CreateContext();
        _repository = new EventFeedbackRepository(Context, NullLogger<EventFeedbackRepository>.Instance);

        // Setup test data
        _testClub = new Club
        {
            Id = 1,
            Name = "Test Club",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Clubs.Add(_testClub);

        _testEvent = new Event
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Events.Add(_testEvent);

        _testMember = new Member
        {
            Id = 1,
            ClubId = _testClub.Id,
            FullName = "Test Member",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Members.Add(_testMember);

        Context.SaveChanges();
    }

    #region CreateAsync Tests

    [Test]
    public async Task CreateAsync_ValidFeedback_CreatesAndReturnsFeedback()
    {
        // Arrange
        var feedback = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 5,
            Comments = "Great event!",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        var result = await _repository.CreateAsync(feedback);

        // Assert
        Assert.That(result.Id, Is.GreaterThan(0));
        Assert.That(result.Rating, Is.EqualTo(5));
        Assert.That(result.Comments, Is.EqualTo("Great event!"));
        Assert.That(result.EventId, Is.EqualTo(_testEvent.Id));
        Assert.That(result.MemberId, Is.EqualTo(_testMember.Id));
    }

    [Test]
    public async Task CreateAsync_ValidFeedback_SetsTimestamps()
    {
        // Arrange
        var feedback = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 4,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        var result = await _repository.CreateAsync(feedback);

        // Assert
        Assert.That(result.CreatedAt, Is.Not.EqualTo(default(DateTime)));
        Assert.That(result.UpdatedAt, Is.Not.EqualTo(default(DateTime)));
    }

    #endregion

    #region GetByIdAsync Tests

    [Test]
    public async Task GetByIdAsync_ExistingFeedback_ReturnsFeedbackWithNavigationProperties()
    {
        // Arrange
        var feedback = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 5,
            Comments = "Excellent",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventFeedbacks.Add(feedback);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(feedback.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(feedback.Id));
        Assert.That(result.Event, Is.Not.Null);
        Assert.That(result.Event.Name, Is.EqualTo("Test Event"));
        Assert.That(result.Member, Is.Not.Null);
        Assert.That(result.Member.FullName, Is.EqualTo("Test Member"));
    }

    [Test]
    public async Task GetByIdAsync_NonExistentFeedback_ReturnsNull()
    {
        // Act
        var result = await _repository.GetByIdAsync(999);

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region GetByEventIdAsync Tests

    [Test]
    public async Task GetByEventIdAsync_MultipleFeedbacks_ReturnsAllForEvent()
    {
        // Arrange
        var member2 = new Member
        {
            ClubId = _testClub.Id,
            FullName = "Member 2",
            Email = "member2@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Members.Add(member2);

        var feedback1 = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 5,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var feedback2 = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = member2.Id,
            Rating = 4,
            CreatedAt = DateTime.UtcNow.AddHours(-1),
            UpdatedAt = DateTime.UtcNow.AddHours(-1)
        };
        Context.EventFeedbacks.AddRange(feedback1, feedback2);
        await Context.SaveChangesAsync();

        // Act
        var result = (await _repository.GetByEventIdAsync(_testEvent.Id)).ToList();

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result[0].CreatedAt, Is.GreaterThan(result[1].CreatedAt)); // Most recent first
    }

    [Test]
    public async Task GetByEventIdAsync_NoFeedbacks_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetByEventIdAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region GetByMemberIdAsync Tests

    [Test]
    public async Task GetByMemberIdAsync_MultipleFeedbacks_ReturnsAllForMember()
    {
        // Arrange
        var event2 = new Event
        {
            ClubId = _testClub.Id,
            Name = "Event 2",
            EventDateTime = DateTime.UtcNow.AddDays(14),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Events.Add(event2);

        var feedback1 = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 5,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var feedback2 = new EventFeedback
        {
            EventId = event2.Id,
            MemberId = _testMember.Id,
            Rating = 4,
            CreatedAt = DateTime.UtcNow.AddHours(-1),
            UpdatedAt = DateTime.UtcNow.AddHours(-1)
        };
        Context.EventFeedbacks.AddRange(feedback1, feedback2);
        await Context.SaveChangesAsync();

        // Act
        var result = (await _repository.GetByMemberIdAsync(_testMember.Id)).ToList();

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result[0].CreatedAt, Is.GreaterThan(result[1].CreatedAt)); // Most recent first
    }

    [Test]
    public async Task GetByMemberIdAsync_NoFeedbacks_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetByMemberIdAsync(_testMember.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region HasMemberProvidedFeedbackAsync Tests

    [Test]
    public async Task HasMemberProvidedFeedbackAsync_FeedbackExists_ReturnsTrue()
    {
        // Arrange
        var feedback = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 5,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventFeedbacks.Add(feedback);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.HasMemberProvidedFeedbackAsync(_testEvent.Id, _testMember.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasMemberProvidedFeedbackAsync_NoFeedback_ReturnsFalse()
    {
        // Act
        var result = await _repository.HasMemberProvidedFeedbackAsync(_testEvent.Id, _testMember.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region UpdateAsync Tests

    [Test]
    public async Task UpdateAsync_ValidFeedback_UpdatesAndReturnsFeedback()
    {
        // Arrange
        var feedback = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 3,
            Comments = "Original comment",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventFeedbacks.Add(feedback);
        await Context.SaveChangesAsync();

        feedback.Rating = 5;
        feedback.Comments = "Updated comment";

        // Act
        await _repository.UpdateAsync(feedback);

        // Assert
        var updated = await _repository.GetByIdAsync(feedback.Id);
        Assert.That(updated, Is.Not.Null);
        Assert.That(updated!.Rating, Is.EqualTo(5));
        Assert.That(updated.Comments, Is.EqualTo("Updated comment"));
    }

    #endregion

    #region DeleteAsync Tests

    [Test]
    public async Task DeleteAsync_ExistingFeedback_RemovesFeedback()
    {
        // Arrange
        var feedback = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 5,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventFeedbacks.Add(feedback);
        await Context.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(feedback.Id);

        // Assert
        var result = await _repository.GetByIdAsync(feedback.Id);
        Assert.That(result, Is.Null);
    }

    #endregion

    #region GetAverageRatingAsync Tests

    [Test]
    public async Task GetAverageRatingAsync_MultipleFeedbacks_ReturnsCorrectAverage()
    {
        // Arrange
        var member2 = new Member
        {
            ClubId = _testClub.Id,
            FullName = "Member 2",
            Email = "member2@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Members.Add(member2);

        var feedback1 = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 5,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var feedback2 = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = member2.Id,
            Rating = 3,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventFeedbacks.AddRange(feedback1, feedback2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAverageRatingAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(4.0));
    }

    [Test]
    public async Task GetAverageRatingAsync_NoFeedbacks_ReturnsZero()
    {
        // Act
        var result = await _repository.GetAverageRatingAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(0.0));
    }

    #endregion

    #region GetFeedbackCountAsync Tests

    [Test]
    public async Task GetFeedbackCountAsync_MultipleFeedbacks_ReturnsCorrectCount()
    {
        // Arrange
        var member2 = new Member
        {
            ClubId = _testClub.Id,
            FullName = "Member 2",
            Email = "member2@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Members.Add(member2);

        var feedback1 = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 5,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var feedback2 = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = member2.Id,
            Rating = 4,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventFeedbacks.AddRange(feedback1, feedback2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFeedbackCountAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(2));
    }

    #endregion

    #region GetFeedbackSurveyByEventAsync Tests

    [Test]
    public async Task GetFeedbackSurveyByEventAsync_ExistingSurvey_ReturnsSurveyWithQuestions()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            EventId = _testEvent.Id,
            Title = "Post Event Survey",
            Description = "Please provide feedback",
            IsAnonymous = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventFeedbackSurveys.Add(survey);

        var question = new SurveyQuestion
        {
            Survey = survey,
            QuestionOrder = 1,
            Text = "How was the event?",
            Type = QuestionType.Rating,
            IsRequired = true,
            MinValue = 1,
            MaxValue = 5
        };
        Context.SurveyQuestions.Add(question);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFeedbackSurveyByEventAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Title, Is.EqualTo("Post Event Survey"));
        Assert.That(result.Questions, Has.Count.EqualTo(1));
        Assert.That(result.Questions.First().Text, Is.EqualTo("How was the event?"));
    }

    [Test]
    public async Task GetFeedbackSurveyByEventAsync_NoSurvey_ReturnsNull()
    {
        // Act
        var result = await _repository.GetFeedbackSurveyByEventAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region ExportFeedbackDataAsync Tests

    [Test]
    public async Task ExportFeedbackDataAsync_CSVFormat_GeneratesCSVString()
    {
        // Arrange
        var feedback = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 5,
            Comments = "Great event!",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventFeedbacks.Add(feedback);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.ExportFeedbackDataAsync(_testEvent.Id, "CSV");

        // Assert
        Assert.That(result, Is.Not.Null);
        var resultType = result!.GetType();
        var dataProperty = resultType.GetProperty("Data");
        var data = dataProperty!.GetValue(result) as string;
        Assert.That(data, Does.Contain("Id,MemberId,Rating,Comments,CreatedAt"));
        Assert.That(data, Does.Contain("Great event!"));
    }

    [Test]
    public async Task ExportFeedbackDataAsync_JSONFormat_GeneratesJSONString()
    {
        // Arrange
        var feedback = new EventFeedback
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Rating = 5,
            Comments = "Great event!",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventFeedbacks.Add(feedback);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.ExportFeedbackDataAsync(_testEvent.Id, "JSON");

        // Assert
        Assert.That(result, Is.Not.Null);
        var resultType = result!.GetType();
        var dataProperty = resultType.GetProperty("Data");
        var data = dataProperty!.GetValue(result) as string;
        Assert.That(data, Does.Contain("\"rating\":"));
        Assert.That(data, Does.Contain("\"comments\":"));
    }

    #endregion

    #region HasSubmittedFeedbackAsync Tests

    [Test]
    public async Task HasSubmittedFeedbackAsync_SurveyResponseExists_ReturnsTrue()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            EventId = _testEvent.Id,
            Title = "Survey",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventFeedbackSurveys.Add(survey);

        var response = new EventFeedbackResponse
        {
            Survey = survey,
            MemberId = _testMember.Id,
            SubmittedAt = DateTime.UtcNow
        };
        Context.EventFeedbackResponses.Add(response);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.HasSubmittedFeedbackAsync(survey.Id, _testMember.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    #endregion

    #region CreateResponseAsync Tests

    [Test]
    public async Task CreateResponseAsync_ValidResponse_CreatesAndReturnsResponse()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            EventId = _testEvent.Id,
            Title = "Survey",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventFeedbackSurveys.Add(survey);
        await Context.SaveChangesAsync();

        var response = new EventFeedbackResponse
        {
            SurveyId = survey.Id,
            MemberId = _testMember.Id,
            SubmittedAt = DateTime.UtcNow,
            IpAddress = "127.0.0.1"
        };

        // Act
        var result = await _repository.CreateResponseAsync(response);

        // Assert
        Assert.That(result.Id, Is.GreaterThan(0));
        Assert.That(result.SurveyId, Is.EqualTo(survey.Id));
        Assert.That(result.MemberId, Is.EqualTo(_testMember.Id));
    }

    #endregion

    #region CreateSurveyAsync Tests

    [Test]
    public async Task CreateSurveyAsync_ValidSurvey_CreatesAndReturnsSurvey()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            EventId = _testEvent.Id,
            Title = "Post Event Survey",
            Description = "Please provide feedback",
            IsAnonymous = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        var result = await _repository.CreateSurveyAsync(survey);

        // Assert
        Assert.That(result.Id, Is.GreaterThan(0));
        Assert.That(result.Title, Is.EqualTo("Post Event Survey"));
        Assert.That(result.IsActive, Is.True);
    }

    #endregion
}
