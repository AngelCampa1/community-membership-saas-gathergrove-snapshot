using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class MarketingServiceTests
{
    private GatherGroveDbContext _context = null!;
    private Mock<IEmailService> _emailServiceMock = null!;
    private Mock<IPdfGenerationService> _pdfGenerationServiceMock = null!;
    private Mock<ISequencerService> _sequencerServiceMock = null!;
    private ILogger<MarketingService> _logger = null!;
    private MarketingService _service = null!;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new GatherGroveDbContext(options);
        _emailServiceMock = new Mock<IEmailService>();
        _pdfGenerationServiceMock = new Mock<IPdfGenerationService>();
        _sequencerServiceMock = new Mock<ISequencerService>();
        _logger = NullLogger<MarketingService>.Instance;
        _service = new MarketingService(
            _context,
            _logger,
            _emailServiceMock.Object,
            _pdfGenerationServiceMock.Object,
            _sequencerServiceMock.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region CaptureLeadAsync Tests

    [Test]
    public async Task CaptureLeadAsync_NewLead_CreatesLeadAndReturnsSuccess()
    {
        // Arrange
        var request = new CaptureLeadRequest
        {
            Email = "test@example.com",
            Name = "John Doe",
            Source = "newsletter"
        };

        // Act
        var result = await _service.CaptureLeadAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.LeadId, Is.Not.Null);
        Assert.That(result.Message, Does.Contain("Thank you"));

        var savedLead = await _context.MarketingLeads.FirstOrDefaultAsync();
        Assert.That(savedLead, Is.Not.Null);
        Assert.That(savedLead!.Email, Is.EqualTo("test@example.com"));
        Assert.That(savedLead.Name, Is.EqualTo("John Doe"));
        Assert.That(savedLead.Source, Is.EqualTo("newsletter"));

        _sequencerServiceMock.Verify(x => x.EnrollMarketingLeadAsync(
            It.Is<MarketingLead>(l => l.Email == "test@example.com"),
            request,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task CaptureLeadAsync_WithAllFields_SavesAllData()
    {
        // Arrange
        var request = new CaptureLeadRequest
        {
            Email = "complete@example.com",
            Name = "Jane Smith",
            Source = "exit-intent",
            Variant = "variant-a",
            UserAgent = "Mozilla/5.0",
            Referrer = "https://google.com",
            CurrentUrl = "https://gathergrove.club/pricing",
            SessionId = "session_123",
            Metadata = "{\"campaign\": \"summer2024\"}"
        };

        // Act
        var result = await _service.CaptureLeadAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);

        var savedLead = await _context.MarketingLeads.FirstOrDefaultAsync();
        Assert.That(savedLead, Is.Not.Null);
        Assert.That(savedLead!.Variant, Is.EqualTo("variant-a"));
        Assert.That(savedLead.UserAgent, Is.EqualTo("Mozilla/5.0"));
        Assert.That(savedLead.ReferrerUrl, Is.EqualTo("https://google.com"));
        Assert.That(savedLead.CurrentUrl, Is.EqualTo("https://gathergrove.club/pricing"));
        Assert.That(savedLead.SessionId, Is.EqualTo("session_123"));
        Assert.That(savedLead.Metadata, Is.EqualTo("{\"campaign\": \"summer2024\"}"));
    }

    [Test]
    public async Task CaptureLeadAsync_DuplicateLead_ReturnsExistingLeadId()
    {
        // Arrange
        var existingLead = new MarketingLead
        {
            Id = 100,
            Email = "duplicate@example.com",
            Source = "newsletter",
            CreatedAt = DateTime.UtcNow.AddDays(-7)
        };
        _context.MarketingLeads.Add(existingLead);
        await _context.SaveChangesAsync();

        var request = new CaptureLeadRequest
        {
            Email = "duplicate@example.com",
            Source = "newsletter"
        };

        // Act
        var result = await _service.CaptureLeadAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.LeadId, Is.EqualTo("100"));
        Assert.That(result.Message, Does.Contain("Thank you"));

        // Verify no new lead was created
        var leadCount = await _context.MarketingLeads.CountAsync();
        Assert.That(leadCount, Is.EqualTo(1));
        _sequencerServiceMock.Verify(x => x.EnrollMarketingLeadAsync(
            It.IsAny<MarketingLead>(),
            It.IsAny<CaptureLeadRequest>(),
            It.IsAny<CancellationToken>()), Times.Never);
        _emailServiceMock.Verify(x => x.SendLeadMagnetEmailAsync(
            It.IsAny<string>(),
            It.IsAny<string?>(),
            It.IsAny<string>(),
            It.IsAny<byte[]>()), Times.Never);
    }

    [Test]
    public async Task CaptureLeadAsync_DuplicateLeadMagnet_DoesNotSendFulfillmentEmail()
    {
        // Arrange
        _context.MarketingLeads.Add(new MarketingLead
        {
            Id = 101,
            Email = "duplicate-magnet@example.com",
            Source = "lead-magnet",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        });
        await _context.SaveChangesAsync();

        var request = new CaptureLeadRequest
        {
            Email = "duplicate-magnet@example.com",
            Name = "Duplicate",
            Source = "lead-magnet"
        };

        // Act
        var result = await _service.CaptureLeadAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(await _context.MarketingLeads.CountAsync(), Is.EqualTo(1));
        _sequencerServiceMock.Verify(x => x.EnrollMarketingLeadAsync(
            It.IsAny<MarketingLead>(),
            It.IsAny<CaptureLeadRequest>(),
            It.IsAny<CancellationToken>()), Times.Never);
        _pdfGenerationServiceMock.Verify(x => x.GenerateClubManagementChecklistPdfAsync(), Times.Never);
        _emailServiceMock.Verify(x => x.SendLeadMagnetEmailAsync(
            It.IsAny<string>(),
            It.IsAny<string?>(),
            It.IsAny<string>(),
            It.IsAny<byte[]>()), Times.Never);
    }

    [Test]
    public async Task CaptureLeadAsync_SameEmailDifferentSource_CreatesBothLeads()
    {
        // Arrange
        var existingLead = new MarketingLead
        {
            Email = "multi@example.com",
            Source = "newsletter",
            CreatedAt = DateTime.UtcNow.AddDays(-7)
        };
        _context.MarketingLeads.Add(existingLead);
        await _context.SaveChangesAsync();

        var request = new CaptureLeadRequest
        {
            Email = "multi@example.com",
            Source = "exit-intent" // Different source
        };

        // Act
        var result = await _service.CaptureLeadAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);

        var leadCount = await _context.MarketingLeads.CountAsync();
        Assert.That(leadCount, Is.EqualTo(2));
    }

    [Test]
    public async Task CaptureLeadAsync_SourceCaseVariant_ReturnsDuplicateWithoutSideEffects()
    {
        // Arrange
        _context.MarketingLeads.Add(new MarketingLead
        {
            Id = 102,
            Email = "case-source@example.com",
            Source = "lead-magnet",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        });
        await _context.SaveChangesAsync();

        var request = new CaptureLeadRequest
        {
            Email = "case-source@example.com",
            Source = " Lead-Magnet "
        };

        // Act
        var result = await _service.CaptureLeadAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.LeadId, Is.EqualTo("102"));
        Assert.That(await _context.MarketingLeads.CountAsync(), Is.EqualTo(1));
        _sequencerServiceMock.Verify(x => x.EnrollMarketingLeadAsync(
            It.IsAny<MarketingLead>(),
            It.IsAny<CaptureLeadRequest>(),
            It.IsAny<CancellationToken>()), Times.Never);
        _emailServiceMock.Verify(x => x.SendLeadMagnetEmailAsync(
            It.IsAny<string>(),
            It.IsAny<string?>(),
            It.IsAny<string>(),
            It.IsAny<byte[]>()), Times.Never);
    }

    [Test]
    public async Task CaptureLeadAsync_LeadMagnetSource_TriggersLeadMagnetEmail()
    {
        // Arrange
        _pdfGenerationServiceMock
            .Setup(x => x.GenerateClubManagementChecklistPdfAsync())
            .ReturnsAsync(new byte[] { 0x25, 0x50, 0x44, 0x46 }); // PDF header

        var request = new CaptureLeadRequest
        {
            Email = "leadmagnet@example.com",
            Name = "Lead Magnet User",
            Source = "lead-magnet"
        };

        // Act
        var result = await _service.CaptureLeadAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);
        await WaitForAsync(() =>
        {
            _emailServiceMock.Verify(x => x.SendLeadMagnetEmailAsync(
                "leadmagnet@example.com",
                "Lead Magnet User",
                "club-management-checklist",
                It.Is<byte[]>(b => b.Length == 4)), Times.Once);
        });
        _sequencerServiceMock.Verify(x => x.EnrollMarketingLeadAsync(
            It.Is<MarketingLead>(l => l.Email == "leadmagnet@example.com"),
            request,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task CaptureLeadAsync_ExitIntentSource_TriggersLeadMagnetEmail()
    {
        // Arrange
        _pdfGenerationServiceMock
            .Setup(x => x.GenerateClubManagementChecklistPdfAsync())
            .ReturnsAsync(new byte[] { 0x25, 0x50, 0x44, 0x46 });

        var request = new CaptureLeadRequest
        {
            Email = "exitintent@example.com",
            Name = "Exit Intent User",
            Source = "exit-intent"
        };

        // Act
        var result = await _service.CaptureLeadAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Does.Contain("Check your email"));
        await WaitForAsync(() =>
        {
            _emailServiceMock.Verify(x => x.SendLeadMagnetEmailAsync(
                "exitintent@example.com",
                "Exit Intent User",
                "club-management-checklist",
                It.Is<byte[]>(b => b.Length == 4)), Times.Once);
        });
        _sequencerServiceMock.Verify(x => x.EnrollMarketingLeadAsync(
            It.Is<MarketingLead>(l => l.Email == "exitintent@example.com"),
            request,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task CaptureLeadAsync_SequencerFailure_StillReturnsSuccess()
    {
        // Arrange
        _sequencerServiceMock
            .Setup(x => x.EnrollMarketingLeadAsync(
                It.IsAny<MarketingLead>(),
                It.IsAny<CaptureLeadRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Sequencer unavailable"));

        var request = new CaptureLeadRequest
        {
            Email = "sequencer-failure@example.com",
            Name = "Sequencer Failure",
            Source = "newsletter"
        };

        // Act
        var result = await _service.CaptureLeadAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);
        var savedLead = await _context.MarketingLeads.FirstOrDefaultAsync();
        Assert.That(savedLead, Is.Not.Null);
    }

    [Test]
    public async Task CaptureLeadAsync_SetsCreatedAtToUtcNow()
    {
        // Arrange
        var beforeCapture = DateTime.UtcNow;

        var request = new CaptureLeadRequest
        {
            Email = "timestamp@example.com",
            Source = "newsletter"
        };

        // Act
        await _service.CaptureLeadAsync(request);
        var afterCapture = DateTime.UtcNow;

        // Assert
        var savedLead = await _context.MarketingLeads.FirstOrDefaultAsync();
        Assert.That(savedLead, Is.Not.Null);
        Assert.That(savedLead!.CreatedAt, Is.GreaterThanOrEqualTo(beforeCapture));
        Assert.That(savedLead.CreatedAt, Is.LessThanOrEqualTo(afterCapture));
    }

    #endregion

    #region TrackEventAsync Tests

    [Test]
    public async Task TrackEventAsync_NewSession_CreatesSessionAndEvent()
    {
        // Arrange
        var sessionId = $"session_{Guid.NewGuid():N}";
        var request = new TrackAnalyticsRequest
        {
            EventName = "page_view",
            Category = "Navigation",
            SessionId = sessionId,
            Url = "https://gathergrove.club/features",
            UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var session = await _context.AnalyticsSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        Assert.That(session, Is.Not.Null);
        Assert.That(session!.EntryUrl, Is.EqualTo("https://gathergrove.club/features"));

        var analyticsEvent = await _context.AnalyticsEvents.FirstOrDefaultAsync();
        Assert.That(analyticsEvent, Is.Not.Null);
        Assert.That(analyticsEvent!.EventType, Is.EqualTo("page_view"));
        Assert.That(analyticsEvent.Category, Is.EqualTo("Navigation"));
    }

    [Test]
    public async Task TrackEventAsync_ExistingSession_UpdatesSessionAndCreatesEvent()
    {
        // Arrange
        var sessionId = "existing_session_123";
        var originalLastActivity = DateTime.UtcNow.AddMinutes(-2);
        var existingSession = new AnalyticsSession
        {
            Id = sessionId,
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            LastActivityAt = originalLastActivity,
            Platform = "Desktop",
            EventCount = 3
        };
        _context.AnalyticsSessions.Add(existingSession);
        await _context.SaveChangesAsync();

        var request = new TrackAnalyticsRequest
        {
            EventName = "button_click",
            Category = "Interaction",
            SessionId = sessionId
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var session = await _context.AnalyticsSessions.FirstAsync(s => s.Id == sessionId);
        Assert.That(session.EventCount, Is.EqualTo(4));
        Assert.That(session.LastActivityAt, Is.GreaterThan(originalLastActivity));
    }

    [Test]
    public async Task TrackEventAsync_NoSessionId_GeneratesNewSessionId()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "cta_click",
            Category = "Marketing"
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var sessions = await _context.AnalyticsSessions.ToListAsync();
        Assert.That(sessions, Has.Count.EqualTo(1));
        Assert.That(sessions[0].Id, Does.StartWith("session_"));
    }

    [Test]
    public async Task TrackEventAsync_MobileUserAgent_SetsPlatformToMobile()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "scroll",
            SessionId = "mobile_session",
            UserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var session = await _context.AnalyticsSessions.FirstAsync();
        Assert.That(session.Platform, Is.EqualTo("Mobile"));
    }

    [Test]
    public async Task TrackEventAsync_AndroidUserAgent_SetsPlatformToMobile()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "tap",
            SessionId = "android_session",
            UserAgent = "Mozilla/5.0 (Linux; Android 11; SM-G991B)"
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var session = await _context.AnalyticsSessions.FirstAsync();
        Assert.That(session.Platform, Is.EqualTo("Mobile"));
    }

    [Test]
    public async Task TrackEventAsync_TabletUserAgent_SetsPlatformToTablet()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "gesture",
            SessionId = "tablet_session",
            UserAgent = "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)"
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var session = await _context.AnalyticsSessions.FirstAsync();
        Assert.That(session.Platform, Is.EqualTo("Tablet"));
    }

    [Test]
    public async Task TrackEventAsync_DesktopUserAgent_SetsPlatformToDesktop()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "hover",
            SessionId = "desktop_session",
            UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var session = await _context.AnalyticsSessions.FirstAsync();
        Assert.That(session.Platform, Is.EqualTo("Desktop"));
    }

    [Test]
    public async Task TrackEventAsync_NullUserAgent_SetsPlatformToUnknown()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "unknown_device",
            SessionId = "unknown_session",
            UserAgent = null
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var session = await _context.AnalyticsSessions.FirstAsync();
        Assert.That(session.Platform, Is.EqualTo("Unknown"));
    }

    [Test]
    public async Task TrackEventAsync_EmptyUserAgent_SetsPlatformToUnknown()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "empty_ua",
            SessionId = "empty_ua_session",
            UserAgent = ""
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var session = await _context.AnalyticsSessions.FirstAsync();
        Assert.That(session.Platform, Is.EqualTo("Unknown"));
    }

    [Test]
    public async Task TrackEventAsync_NullEventName_SetsEventTypeToUnknown()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = null,
            SessionId = "null_event_session"
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var analyticsEvent = await _context.AnalyticsEvents.FirstAsync();
        Assert.That(analyticsEvent.EventType, Is.EqualTo("unknown"));
        Assert.That(analyticsEvent.Action, Is.EqualTo("unknown"));
    }

    [Test]
    public async Task TrackEventAsync_NullCategory_DefaultsToMarketing()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "test_event",
            Category = null,
            SessionId = "null_category_session"
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var analyticsEvent = await _context.AnalyticsEvents.FirstAsync();
        Assert.That(analyticsEvent.Category, Is.EqualTo("Marketing"));
    }

    [Test]
    public async Task TrackEventAsync_WithEventData_StoresProperties()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "form_submit",
            SessionId = "data_session",
            Data = "{\"field_count\": 5, \"form_type\": \"contact\"}"
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var analyticsEvent = await _context.AnalyticsEvents.FirstAsync();
        Assert.That(analyticsEvent.Properties, Is.EqualTo("{\"field_count\": 5, \"form_type\": \"contact\"}"));
    }

    [Test]
    public async Task TrackEventAsync_SetsCreatedAtCorrectly()
    {
        // Arrange
        var beforeTrack = DateTime.UtcNow;

        var request = new TrackAnalyticsRequest
        {
            EventName = "timestamp_test",
            SessionId = "timestamp_session"
        };

        // Act
        await _service.TrackEventAsync(request);
        var afterTrack = DateTime.UtcNow;

        // Assert
        var analyticsEvent = await _context.AnalyticsEvents.FirstAsync();
        Assert.That(analyticsEvent.CreatedAt, Is.GreaterThanOrEqualTo(beforeTrack));
        Assert.That(analyticsEvent.CreatedAt, Is.LessThanOrEqualTo(afterTrack));
    }

    #endregion

    #region GetLeadMagnetAsync Tests

    [Test]
    public async Task GetLeadMagnetAsync_ClubManagementChecklist_ReturnsCorrectData()
    {
        // Act
        var (downloadUrl, fileName) = await _service.GetLeadMagnetAsync("club-management-checklist");

        // Assert
        Assert.That(downloadUrl, Is.EqualTo("/api/v1/marketing/lead-magnets/club-management-checklist/download"));
        Assert.That(fileName, Is.EqualTo("Ultimate Club Management Checklist.pdf"));
    }

    [Test]
    public async Task GetLeadMagnetAsync_CaseInsensitive_Works()
    {
        // Act
        var (downloadUrl, fileName) = await _service.GetLeadMagnetAsync("Club-Management-CHECKLIST");

        // Assert
        Assert.That(downloadUrl, Is.EqualTo("/api/v1/marketing/lead-magnets/club-management-checklist/download"));
        Assert.That(fileName, Is.EqualTo("Ultimate Club Management Checklist.pdf"));
    }

    [Test]
    public void GetLeadMagnetAsync_UnknownType_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.GetLeadMagnetAsync("unknown-type"));

        Assert.That(ex!.Message, Does.Contain("Unknown lead magnet type"));
    }

    [Test]
    public void GetLeadMagnetAsync_EmptyType_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.GetLeadMagnetAsync(""));

        Assert.That(ex!.Message, Does.Contain("Unknown lead magnet type"));
    }

    #endregion

    #region Multiple Events in Session Tests

    [Test]
    public async Task TrackEventAsync_MultipleEventsInSession_IncreasesEventCount()
    {
        // Arrange
        var sessionId = "multi_event_session";

        // Act - Track 5 events
        for (int i = 0; i < 5; i++)
        {
            await _service.TrackEventAsync(new TrackAnalyticsRequest
            {
                EventName = $"event_{i}",
                SessionId = sessionId
            });
        }

        // Assert
        var session = await _context.AnalyticsSessions.FirstAsync(s => s.Id == sessionId);
        Assert.That(session.EventCount, Is.EqualTo(4)); // First event creates session, 4 more increments

        var events = await _context.AnalyticsEvents.Where(e => e.SessionId == sessionId).ToListAsync();
        Assert.That(events, Has.Count.EqualTo(5));
    }

    #endregion

    #region Edge Cases Tests

    [Test]
    public async Task CaptureLeadAsync_MinimalRequest_Works()
    {
        // Arrange
        var request = new CaptureLeadRequest
        {
            Email = "minimal@example.com",
            Source = "test"
        };

        // Act
        var result = await _service.CaptureLeadAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task TrackEventAsync_MinimalRequest_Works()
    {
        // Arrange
        var request = new TrackAnalyticsRequest();

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var session = await _context.AnalyticsSessions.FirstOrDefaultAsync();
        Assert.That(session, Is.Not.Null);
    }

    [Test]
    public async Task CaptureLeadAsync_SpecialCharactersInEmail_Handled()
    {
        // Arrange
        var request = new CaptureLeadRequest
        {
            Email = "test+special@example.com",
            Source = "newsletter"
        };

        // Act
        var result = await _service.CaptureLeadAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);
        var lead = await _context.MarketingLeads.FirstAsync();
        Assert.That(lead.Email, Is.EqualTo("test+special@example.com"));
    }

    [Test]
    public async Task TrackEventAsync_VeryLongUserAgent_Handled()
    {
        // Arrange
        var longUserAgent = new string('A', 500);
        var request = new TrackAnalyticsRequest
        {
            EventName = "test",
            SessionId = "long_ua_session",
            UserAgent = longUserAgent
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var session = await _context.AnalyticsSessions.FirstAsync();
        Assert.That(session.UserAgent, Is.EqualTo(longUserAgent));
    }

    [Test]
    public async Task TrackEventAsync_UnicodeInEventName_Handled()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "emoji_click_🎉",
            SessionId = "unicode_session"
        };

        // Act
        await _service.TrackEventAsync(request);

        // Assert
        var analyticsEvent = await _context.AnalyticsEvents.FirstAsync();
        Assert.That(analyticsEvent.EventType, Is.EqualTo("emoji_click_🎉"));
    }

    #endregion

    #region Concurrent Access Tests

    [Test]
    public async Task CaptureLeadAsync_ConcurrentCaptures_AllSucceed()
    {
        // Arrange
        var tasks = new List<Task<CaptureLeadResponse>>();

        // Act - Create 10 different leads concurrently
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(_service.CaptureLeadAsync(new CaptureLeadRequest
            {
                Email = $"concurrent{i}@example.com",
                Source = "test"
            }));
        }

        var results = await Task.WhenAll(tasks);

        // Assert
        Assert.That(results.All(r => r.Success), Is.True);
        var leadCount = await _context.MarketingLeads.CountAsync();
        Assert.That(leadCount, Is.EqualTo(10));
    }

    [Test]
    public async Task TrackEventAsync_ConcurrentEvents_AllTracked()
    {
        // Arrange
        var sessionId = "concurrent_session";
        var tasks = new List<Task>();

        // Act - Track 10 events concurrently
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(_service.TrackEventAsync(new TrackAnalyticsRequest
            {
                EventName = $"concurrent_event_{i}",
                SessionId = sessionId
            }));
        }

        await Task.WhenAll(tasks);

        // Assert
        var events = await _context.AnalyticsEvents.Where(e => e.SessionId == sessionId).ToListAsync();
        Assert.That(events, Has.Count.EqualTo(10));
    }

    #endregion

    private static async Task WaitForAsync(Action assertion, int timeoutMilliseconds = 2000)
    {
        var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMilliseconds);
        Exception? lastException = null;

        while (DateTime.UtcNow < deadline)
        {
            try
            {
                assertion();
                return;
            }
            catch (Exception ex)
            {
                lastException = ex;
                await Task.Delay(50);
            }
        }

        assertion();
        throw lastException ?? new TimeoutException("Timed out waiting for assertion.");
    }
}
