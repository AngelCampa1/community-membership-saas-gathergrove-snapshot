using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using FluentAssertions;

namespace GatherGrove.Tests.Unit.Services
{
    /// <summary>
    /// TDD Tests for RecurringEventService - US-009 Advanced Event Management
    /// RED PHASE: Comprehensive test specifications for recurring event generation
    /// Tests cover daily, weekly, monthly, and custom recurrence patterns
    /// </summary>
    [TestFixture]
    public class RecurringEventServiceTests
    {
        private GatherGroveDbContext _context;
        private RecurringEventService _recurringEventService;
        private Mock<ILogger<RecurringEventService>> _mockLogger;
        private Mock<IEventService> _mockEventService;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
                .UseInMemoryDatabase(databaseName: $"RecurringEventTestDb_{Guid.NewGuid()}")
                .Options;

            _context = new GatherGroveDbContext(options);
            _mockLogger = new Mock<ILogger<RecurringEventService>>();
            _mockEventService = new Mock<IEventService>();
            
            // This will fail initially as RecurringEventService doesn't exist yet (RED phase)
            _recurringEventService = new RecurringEventService(
                _context, 
                _mockLogger.Object, 
                _mockEventService.Object
            );
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        #region Daily Recurrence Tests

        [Test]
        public async Task GenerateEventsFromPattern_DailyRecurrence_CreatesCorrectSeries()
        {
            // Arrange
            var clubId = 1;
            var startDate = new DateTime(2024, 1, 1, 10, 0, 0);
            var endDate = new DateTime(2024, 1, 7, 10, 0, 0);
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Daily,
                Interval = 1,
                StartDate = startDate,
                EndDate = endDate,
                Count = null
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "Daily Standup",
                Location = "Conference Room A",
                Description = "Daily team meeting",
                EventDateTime = startDate,
                MaxCapacity = 20
            };

            // Act
            var result = await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);

            // Assert
            result.Should().NotBeNull();
            result.Events.Should().HaveCount(7); // 7 days inclusive
            result.Events[0].EventDateTime.Should().Be(startDate);
            result.Events[6].EventDateTime.Should().Be(endDate);
            
            // Verify each event is exactly 1 day apart
            for (int i = 1; i < result.Events.Count; i++)
            {
                var expectedDate = startDate.AddDays(i);
                result.Events[i].EventDateTime.Should().Be(expectedDate);
            }
        }

        [Test]
        public async Task GenerateEventsFromPattern_DailyWithInterval2_SkipsAlternateDays()
        {
            // Arrange
            var clubId = 1;
            var startDate = new DateTime(2024, 1, 1, 10, 0, 0);
            var endDate = new DateTime(2024, 1, 10, 10, 0, 0);
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Daily,
                Interval = 2, // Every other day
                StartDate = startDate,
                EndDate = endDate
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "Every Other Day Meeting",
                Location = "Virtual",
                Description = "Bi-daily check-in",
                EventDateTime = startDate
            };

            // Act
            var result = await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);

            // Assert
            result.Events.Should().HaveCount(5); // Jan 1, 3, 5, 7, 9
            result.Events[0].EventDateTime.Should().Be(new DateTime(2024, 1, 1, 10, 0, 0));
            result.Events[1].EventDateTime.Should().Be(new DateTime(2024, 1, 3, 10, 0, 0));
            result.Events[2].EventDateTime.Should().Be(new DateTime(2024, 1, 5, 10, 0, 0));
            result.Events[3].EventDateTime.Should().Be(new DateTime(2024, 1, 7, 10, 0, 0));
            result.Events[4].EventDateTime.Should().Be(new DateTime(2024, 1, 9, 10, 0, 0));
        }

        [Test]
        public async Task GenerateEventsFromPattern_DailyWithCount_CreatesExactNumber()
        {
            // Arrange
            var clubId = 1;
            var startDate = new DateTime(2024, 1, 1, 14, 30, 0);
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Daily,
                Interval = 1,
                StartDate = startDate,
                Count = 5 // Exactly 5 events
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "5-Day Workshop Series",
                Location = "Training Room",
                Description = "Intensive 5-day training",
                EventDateTime = startDate
            };

            // Act
            var result = await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);

            // Assert
            result.Events.Should().HaveCount(5);
            result.Events[0].EventDateTime.Should().Be(startDate);
            result.Events[4].EventDateTime.Should().Be(startDate.AddDays(4));
        }

        #endregion

        #region Weekly Recurrence Tests

        [Test]
        public async Task GenerateEventsFromPattern_WeeklyRecurrence_CreatesCorrectSeries()
        {
            // Arrange
            var clubId = 1;
            var startDate = new DateTime(2024, 1, 1, 19, 0, 0); // Monday
            var endDate = new DateTime(2024, 1, 29, 19, 0, 0); // 4 weeks later
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Weekly,
                Interval = 1,
                StartDate = startDate,
                EndDate = endDate,
                WeeklyDays = new[] { DayOfWeek.Monday } // Every Monday
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "Weekly Team Meeting",
                Location = "Main Conference Room",
                Description = "Weekly team sync",
                EventDateTime = startDate
            };

            // Act
            var result = await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);

            // Assert
            result.Events.Should().HaveCount(5); // 5 Mondays in the range
            
            foreach (var eventDto in result.Events)
            {
                eventDto.EventDateTime.DayOfWeek.Should().Be(DayOfWeek.Monday);
            }
        }

        [Test]
        public async Task GenerateEventsFromPattern_WeeklyMultipleDays_CreatesAllSpecifiedDays()
        {
            // Arrange
            var clubId = 1;
            var startDate = new DateTime(2024, 1, 1, 10, 0, 0); // Monday
            var endDate = new DateTime(2024, 1, 14, 10, 0, 0); // 2 weeks later
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Weekly,
                Interval = 1,
                StartDate = startDate,
                EndDate = endDate,
                WeeklyDays = new[] { DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday }
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "MWF Workout Class",
                Location = "Gym",
                Description = "Monday/Wednesday/Friday fitness",
                EventDateTime = startDate
            };

            // Act
            var result = await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);

            // Assert
            result.Events.Should().HaveCount(6); // 2 weeks × 3 days = 6 events
            
            var expectedDays = new[] { DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday };
            foreach (var eventDto in result.Events)
            {
                expectedDays.Should().Contain(eventDto.EventDateTime.DayOfWeek);
            }
        }

        [Test]
        public async Task GenerateEventsFromPattern_BiWeeklyRecurrence_SkipsAlternateWeeks()
        {
            // Arrange
            var clubId = 1;
            var startDate = new DateTime(2024, 1, 1, 15, 0, 0); // Monday
            var endDate = new DateTime(2024, 2, 12, 15, 0, 0); // 6 weeks later
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Weekly,
                Interval = 2, // Every other week
                StartDate = startDate,
                EndDate = endDate,
                WeeklyDays = new[] { DayOfWeek.Monday }
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "Bi-weekly Board Meeting",
                Location = "Boardroom",
                Description = "Every other week meeting",
                EventDateTime = startDate
            };

            // Act
            var result = await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);

            // Assert
            result.Events.Should().HaveCount(3); // Weeks 1, 3, 5
            result.Events[0].EventDateTime.Should().Be(new DateTime(2024, 1, 1, 15, 0, 0));
            result.Events[1].EventDateTime.Should().Be(new DateTime(2024, 1, 15, 15, 0, 0));
            result.Events[2].EventDateTime.Should().Be(new DateTime(2024, 1, 29, 15, 0, 0));
        }

        #endregion

        #region Monthly Recurrence Tests

        [Test]
        public async Task GenerateEventsFromPattern_MonthlyByDate_CreatesCorrectSeries()
        {
            // Arrange
            var clubId = 1;
            var startDate = new DateTime(2024, 1, 15, 18, 0, 0); // 15th of January
            var endDate = new DateTime(2024, 6, 15, 18, 0, 0); // 6 months later
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Monthly,
                Interval = 1,
                StartDate = startDate,
                EndDate = endDate,
                MonthlyType = MonthlyRecurrenceType.ByDate,
                MonthlyDayOfMonth = 15
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "Monthly Town Hall",
                Location = "Auditorium",
                Description = "Monthly all-hands meeting",
                EventDateTime = startDate
            };

            // Act
            var result = await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);

            // Assert
            result.Events.Should().HaveCount(6); // Jan, Feb, Mar, Apr, May, Jun
            
            for (int i = 0; i < result.Events.Count; i++)
            {
                var expectedDate = new DateTime(2024, 1 + i, 15, 18, 0, 0);
                result.Events[i].EventDateTime.Should().Be(expectedDate);
            }
        }

        [Test]
        public async Task GenerateEventsFromPattern_MonthlyByDayOfWeek_CreatesCorrectSeries()
        {
            // Arrange
            var clubId = 1;
            var startDate = new DateTime(2024, 1, 11, 20, 0, 0); // Second Thursday of January 2024
            var endDate = new DateTime(2024, 4, 11, 20, 0, 0); // 3 months later
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Monthly,
                Interval = 1,
                StartDate = startDate,
                EndDate = endDate,
                MonthlyType = MonthlyRecurrenceType.ByDayOfWeek,
                MonthlyWeekOfMonth = WeekOfMonth.Second,
                MonthlyDayOfWeek = DayOfWeek.Thursday
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "Monthly Leadership Meeting",
                Location = "Executive Conference Room",
                Description = "Second Thursday of each month",
                EventDateTime = startDate
            };

            // Act
            var result = await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);

            // Assert
            result.Events.Should().HaveCount(4); // Jan, Feb, Mar, Apr
            
            foreach (var eventDto in result.Events)
            {
                eventDto.EventDateTime.DayOfWeek.Should().Be(DayOfWeek.Thursday);
                // Additional validation for "second Thursday" would require helper method
            }
        }

        [Test]
        public async Task GenerateEventsFromPattern_MonthlyLastDayOfMonth_HandlesVariableMonthLengths()
        {
            // Arrange
            var clubId = 1;
            var startDate = new DateTime(2024, 1, 31, 12, 0, 0); // Last day of January
            var endDate = new DateTime(2024, 4, 30, 12, 0, 0);
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Monthly,
                Interval = 1,
                StartDate = startDate,
                EndDate = endDate,
                MonthlyType = MonthlyRecurrenceType.ByDate,
                MonthlyDayOfMonth = -1 // Last day of month
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "Month-End Review",
                Location = "Finance Department",
                Description = "Last day of month review",
                EventDateTime = startDate
            };

            // Act
            var result = await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);

            // Assert
            result.Events.Should().HaveCount(4);
            result.Events[0].EventDateTime.Should().Be(new DateTime(2024, 1, 31, 12, 0, 0)); // Jan 31
            result.Events[1].EventDateTime.Should().Be(new DateTime(2024, 2, 29, 12, 0, 0)); // Feb 29 (leap year)
            result.Events[2].EventDateTime.Should().Be(new DateTime(2024, 3, 31, 12, 0, 0)); // Mar 31
            result.Events[3].EventDateTime.Should().Be(new DateTime(2024, 4, 30, 12, 0, 0)); // Apr 30
        }

        #endregion

        #region Validation Tests

        [Test]
        public void ValidateRecurrencePattern_NullPattern_ThrowsArgumentNullException()
        {
            // Arrange
            RecurrencePatternRequest pattern = null;

            // Act & Assert
            var action = () => _recurringEventService.ValidateRecurrencePattern(pattern);
            action.Should().Throw<ArgumentNullException>()
                .WithMessage("*pattern*");
        }

        [Test]
        public void ValidateRecurrencePattern_InvalidInterval_ThrowsArgumentException()
        {
            // Arrange
            var pattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Daily,
                Interval = 0, // Invalid
                StartDate = DateTime.Now
            };

            // Act & Assert
            var action = () => _recurringEventService.ValidateRecurrencePattern(pattern);
            action.Should().Throw<ArgumentException>()
                .WithMessage("*Interval must be greater than 0*");
        }

        [Test]
        public void ValidateRecurrencePattern_EndDateBeforeStartDate_ThrowsArgumentException()
        {
            // Arrange
            var pattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Daily,
                Interval = 1,
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(-1) // End before start
            };

            // Act & Assert
            var action = () => _recurringEventService.ValidateRecurrencePattern(pattern);
            action.Should().Throw<ArgumentException>()
                .WithMessage("*End date must be after start date*");
        }

        [Test]
        public void ValidateRecurrencePattern_WeeklyWithNoDays_ThrowsArgumentException()
        {
            // Arrange
            var pattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Weekly,
                Interval = 1,
                StartDate = DateTime.Now,
                WeeklyDays = new DayOfWeek[0] // Empty array
            };

            // Act & Assert
            var action = () => _recurringEventService.ValidateRecurrencePattern(pattern);
            action.Should().Throw<ArgumentException>()
                .WithMessage("*Weekly recurrence must specify at least one day*");
        }

        [Test]
        public void ValidateRecurrencePattern_MonthlyWithInvalidDayOfMonth_ThrowsArgumentException()
        {
            // Arrange
            var pattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Monthly,
                Interval = 1,
                StartDate = DateTime.Now,
                MonthlyType = MonthlyRecurrenceType.ByDate,
                MonthlyDayOfMonth = 32 // Invalid
            };

            // Act & Assert
            var action = () => _recurringEventService.ValidateRecurrencePattern(pattern);
            action.Should().Throw<ArgumentException>()
                .WithMessage("*Day of month must be between 1 and 31*");
        }

        #endregion

        #region Edge Cases

        [Test]
        public async Task GenerateEventsFromPattern_LeapYearFebruary29_HandlesCorrectly()
        {
            // Arrange
            var clubId = 1;
            var startDate = new DateTime(2024, 2, 29, 10, 0, 0); // Leap year Feb 29
            var endDate = new DateTime(2025, 3, 1, 10, 0, 0);
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Monthly,
                Interval = 1,
                StartDate = startDate,
                EndDate = endDate,
                MonthlyType = MonthlyRecurrenceType.ByDate,
                MonthlyDayOfMonth = 29
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "Leap Year Special Event",
                Location = "Virtual",
                Description = "Testing leap year handling",
                EventDateTime = startDate
            };

            // Act
            var result = await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);

            // Assert
            result.Events.Should().HaveCount(11); // Feb 2024 through Feb 2025
            result.Events[0].EventDateTime.Should().Be(new DateTime(2024, 2, 29, 10, 0, 0));
            // 2025 is not a leap year, so Feb 29 should fall back to Feb 28
            var feb2025Event = result.Events.FirstOrDefault(e => e.EventDateTime.Year == 2025 && e.EventDateTime.Month == 2);
            feb2025Event.Should().NotBeNull();
            feb2025Event.EventDateTime.Day.Should().Be(28); // Fallback to Feb 28 in non-leap year
        }

        [Test]
        public async Task GenerateEventsFromPattern_MaxCountExceeded_ThrowsArgumentException()
        {
            // Arrange
            var clubId = 1;
            var startDate = DateTime.Now;
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Daily,
                Interval = 1,
                StartDate = startDate,
                Count = 1001 // Exceeds maximum
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "Too Many Events",
                Location = "Virtual",
                Description = "Testing max count limit",
                EventDateTime = startDate
            };

            // Act & Assert
            var action = async () => await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);
            
            await action.Should().ThrowAsync<ArgumentException>()
                .WithMessage("*Cannot generate more than 1000 events*");
        }

        [Test]
        public async Task GenerateEventsFromPattern_TimeZoneHandling_PreservesOriginalTime()
        {
            // Arrange
            var clubId = 1;
            var startDate = new DateTime(2024, 3, 10, 14, 30, 0); // During DST transition
            var endDate = new DateTime(2024, 3, 17, 14, 30, 0);
            
            var recurrencePattern = new RecurrencePatternRequest
            {
                Type = RecurrenceType.Daily,
                Interval = 1,
                StartDate = startDate,
                EndDate = endDate
            };

            var baseEvent = new CreateEventRequest
            {
                Name = "DST Test Event",
                Location = "Conference Room",
                Description = "Testing DST handling",
                EventDateTime = startDate
            };

            // Act
            var result = await _recurringEventService.GenerateEventsFromPattern(
                clubId, baseEvent, recurrencePattern);

            // Assert
            result.Events.Should().HaveCount(8);
            foreach (var eventDto in result.Events)
            {
                eventDto.EventDateTime.Hour.Should().Be(14);
                eventDto.EventDateTime.Minute.Should().Be(30);
            }
        }

        #endregion
    }

    #region Supporting DTOs and Enums (These would be defined in the actual application)

    public class RecurrencePatternRequest
    {
        public RecurrenceType Type { get; set; }
        public int Interval { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? Count { get; set; }
        public DayOfWeek[]? WeeklyDays { get; set; }
        public MonthlyRecurrenceType? MonthlyType { get; set; }
        public int? MonthlyDayOfMonth { get; set; }
        public WeekOfMonth? MonthlyWeekOfMonth { get; set; }
        public DayOfWeek? MonthlyDayOfWeek { get; set; }
    }

    public class RecurringEventGenerationResult
    {
        public List<EventResponse> Events { get; set; } = new();
        public int TotalGenerated { get; set; }
        public string SeriesId { get; set; } = string.Empty;
        public RecurrencePatternRequest Pattern { get; set; } = null!;
    }

    public enum RecurrenceType
    {
        Daily,
        Weekly,
        Monthly,
        Yearly
    }

    public enum MonthlyRecurrenceType
    {
        ByDate,
        ByDayOfWeek
    }

    public enum WeekOfMonth
    {
        First = 1,
        Second = 2,
        Third = 3,
        Fourth = 4,
        Last = -1
    }

    #endregion
}