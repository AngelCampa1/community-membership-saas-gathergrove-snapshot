using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.API.Tests.TestData;

/// <summary>
/// Comprehensive test data builder for Event Engagement Analysis feature testing
/// Provides realistic scenarios for RSVP -> Attendance -> Feedback -> Analytics workflows
/// </summary>
public class EventEngagementTestDataBuilder
{
    private readonly GatherGroveDbContext _context;
    private readonly List<Club> _clubs = new();
    private readonly List<Event> _events = new();
    private readonly List<Member> _members = new();
    private readonly Random _random = new();

    public EventEngagementTestDataBuilder(GatherGroveDbContext context)
    {
        _context = context;
    }

    #region Core Setup Methods

    /// <summary>
    /// Creates a basic club with admin user for testing
    /// </summary>
    public async Task<EventEngagementTestDataBuilder> WithClub(
        string name = "Event Test Club",
        string tier = "Grow")
    {
        var user = new User
        {
            FullName = "Event Admin",
            Email = $"eventadmin_{Guid.NewGuid():N}@test.com",
            PasswordHash = "test-hash",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var club = new Club
        {
            Name = name,
            Tier = tier,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();
        _clubs.Add(club);

        return this;
    }

    /// <summary>
    /// Creates multiple events with varied engagement patterns
    /// </summary>
    public async Task<EventEngagementTestDataBuilder> WithEvents(
        int clubId,
        int eventCount = 10,
        int daysBack = 30)
    {
        for (int i = 0; i < eventCount; i++)
        {
            var eventDate = DateTime.UtcNow.AddDays(-_random.Next(0, daysBack));
            var eventType = GetRandomEventType();

            var clubEvent = new Event
            {
                ClubId = clubId,
                Name = $"{eventType} Event #{i + 1}",
                Description = GetEventDescription(eventType),
                EventDateTime = eventDate,
                Location = GetRandomLocation(),
                // MaxCapacity and IsFeatured properties don't exist in Event entity
                CreatedAt = eventDate.AddDays(-7), // Created a week before
                UpdatedAt = eventDate.AddDays(-1)
            };

            _context.Events.Add(clubEvent);
            await _context.SaveChangesAsync();
            _events.Add(clubEvent);
        }

        return this;
    }

    /// <summary>
    /// Creates members with realistic engagement profiles
    /// </summary>
    public async Task<EventEngagementTestDataBuilder> WithMembersAndEngagement(
        int clubId,
        int memberCount = 50)
    {
        // Ensure membership type exists
        var membershipType = await EnsureMembershipType(clubId);

        for (int i = 0; i < memberCount; i++)
        {
            var engagementProfile = GetRandomEngagementProfile();
            var joinDate = DateTime.UtcNow.AddDays(-_random.Next(30, 365));

            var member = new Member
            {
                ClubId = clubId,
                MembershipTypeId = membershipType.Id,
                FullName = $"Test Member {i + 1}",
                Email = $"member{i + 1}_{clubId}@test.com",
                Status = "Active",
                JoinDate = joinDate,
                CreatedAt = joinDate,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Members.Add(member);
            await _context.SaveChangesAsync();
            _members.Add(member);

            // Create engagement data for this member
            await CreateMemberEngagementData(member.Id, clubId, engagementProfile);
        }

        return this;
    }

    #endregion

    #region Specific Scenario Builders

    /// <summary>
    /// Creates a complete event with full lifecycle: RSVP -> Attendance -> Feedback
    /// </summary>
    public async Task<EventEngagementTestDataBuilder> WithCompleteEventLifecycle(
        int clubId,
        int memberCount = 25,
        string eventName = "Complete Lifecycle Event")
    {
        // Create the event
        var eventDate = DateTime.UtcNow.AddDays(-5);
        var clubEvent = new Event
        {
            ClubId = clubId,
            Name = eventName,
            Description = "A fully tracked event with complete engagement lifecycle",
            EventDateTime = eventDate,
            Location = "Main Conference Room",
            // MaxCapacity and IsFeatured properties don't exist in Event entity
            CreatedAt = eventDate.AddDays(-14),
            UpdatedAt = eventDate.AddDays(-1)
        };

        _context.Events.Add(clubEvent);
        await _context.SaveChangesAsync();

        // Get random members or create if needed
        var availableMembers = await _context.Members
            .Where(m => m.ClubId == clubId)
            .Take(memberCount)
            .ToListAsync();

        // Create RSVPs (90% of members)
        var rsvpCount = (int)(memberCount * 0.9);
        for (int i = 0; i < rsvpCount; i++)
        {
            var rsvpStatus = GetRsvpStatus(i, rsvpCount);

            var rsvp = new EventRsvp
            {
                EventId = clubEvent.Id,
                MemberId = availableMembers[i].Id,
                RsvpStatus = rsvpStatus,
                CreatedAt = eventDate.AddDays(-_random.Next(1, 10)),
                UpdatedAt = eventDate.AddDays(-1)
            };

            _context.EventRsvps.Add(rsvp);
        }

        await _context.SaveChangesAsync();

        // Create Attendances (70% of RSVPs actually attend)
        var attendanceCount = (int)(rsvpCount * 0.7);
        var attendingRsvps = await _context.EventRsvps
            .Where(r => r.EventId == clubEvent.Id && r.RsvpStatus == "Attending")
            .Take(attendanceCount)
            .ToListAsync();

        foreach (var rsvp in attendingRsvps.Take(attendanceCount))
        {
            var attendance = new EventAttendance
            {
                EventId = clubEvent.Id,
                MemberId = rsvp.MemberId,
                AttendedAt = eventDate.AddMinutes(_random.Next(-30, 120)), // Some arrive early/late
                CreatedAt = eventDate.AddHours(2)
            };

            _context.EventAttendances.Add(attendance);
        }

        await _context.SaveChangesAsync();

        // Create Feedback (50% of attendees provide feedback)
        var feedbackCount = attendanceCount / 2;
        var attendances = await _context.EventAttendances
            .Where(a => a.EventId == clubEvent.Id)
            .Take(feedbackCount)
            .ToListAsync();

        foreach (var attendance in attendances)
        {
            var feedback = new EventFeedback
            {
                EventId = clubEvent.Id,
                MemberId = attendance.MemberId,
                Rating = _random.Next(3, 6), // Ratings between 3-5
                Comments = GetRandomFeedbackComment(),
                CreatedAt = eventDate.AddDays(_random.Next(1, 3)),
                UpdatedAt = eventDate.AddDays(_random.Next(1, 3))
            };

            _context.EventFeedbacks.Add(feedback);
        }

        await _context.SaveChangesAsync();

        return this;
    }

    /// <summary>
    /// Creates events with high engagement for testing positive trends
    /// </summary>
    public async Task<EventEngagementTestDataBuilder> WithHighEngagementEvents(
        int clubId,
        int eventCount = 5)
    {
        var members = await _context.Members
            .Where(m => m.ClubId == clubId)
            .ToListAsync();

        for (int i = 0; i < eventCount; i++)
        {
            var eventDate = DateTime.UtcNow.AddDays(-(i + 1) * 7); // Weekly events
            var clubEvent = new Event
            {
                ClubId = clubId,
                Name = $"High Engagement Event #{i + 1}",
                Description = "Popular event with high member participation",
                EventDateTime = eventDate,
                Location = "Popular Venue",
                // MaxCapacity and IsFeatured properties don't exist in Event entity
                CreatedAt = eventDate.AddDays(-10),
                UpdatedAt = eventDate.AddDays(-1)
            };

            _context.Events.Add(clubEvent);
            await _context.SaveChangesAsync();

            // High RSVP rate (85%)
            var rsvpMembers = members.OrderBy(x => Guid.NewGuid()).Take((int)(members.Count * 0.85));
            foreach (var member in rsvpMembers)
            {
                var rsvp = new EventRsvp
                {
                    EventId = clubEvent.Id,
                    MemberId = member.Id,
                    RsvpStatus = "Attending",
                    CreatedAt = eventDate.AddDays(-_random.Next(1, 8)),
                    UpdatedAt = eventDate.AddDays(-1)
                };
                _context.EventRsvps.Add(rsvp);
            }

            await _context.SaveChangesAsync();

            // High attendance rate (90% of RSVPs)
            var rsvps = await _context.EventRsvps
                .Where(r => r.EventId == clubEvent.Id)
                .ToListAsync();

            var attendingCount = (int)(rsvps.Count * 0.9);
            foreach (var rsvp in rsvps.Take(attendingCount))
            {
                var attendance = new EventAttendance
                {
                    EventId = clubEvent.Id,
                    MemberId = rsvp.MemberId,
                    AttendedAt = eventDate.AddMinutes(_random.Next(-10, 30)),
                    CreatedAt = eventDate.AddHours(1)
                };
                _context.EventAttendances.Add(attendance);
            }

            await _context.SaveChangesAsync();

            // High feedback rate with positive ratings (70% provide feedback)
            var attendances = await _context.EventAttendances
                .Where(a => a.EventId == clubEvent.Id)
                .ToListAsync();

            var feedbackCount = (int)(attendances.Count * 0.7);
            foreach (var attendance in attendances.Take(feedbackCount))
            {
                var feedback = new EventFeedback
                {
                    EventId = clubEvent.Id,
                    MemberId = attendance.MemberId,
                    Rating = _random.Next(4, 6), // High ratings (4-5)
                    Comments = GetPositiveFeedbackComment(),
                    CreatedAt = eventDate.AddDays(_random.Next(1, 2)),
                    UpdatedAt = eventDate.AddDays(_random.Next(1, 2))
                };
                _context.EventFeedbacks.Add(feedback);
            }

            await _context.SaveChangesAsync();
        }

        return this;
    }

    /// <summary>
    /// Creates events with low engagement for testing negative trends
    /// </summary>
    public async Task<EventEngagementTestDataBuilder> WithLowEngagementEvents(
        int clubId,
        int eventCount = 5)
    {
        var members = await _context.Members
            .Where(m => m.ClubId == clubId)
            .ToListAsync();

        for (int i = 0; i < eventCount; i++)
        {
            var eventDate = DateTime.UtcNow.AddDays(-(i + 1) * 10); // Events every 10 days
            var clubEvent = new Event
            {
                ClubId = clubId,
                Name = $"Low Engagement Event #{i + 1}",
                Description = "Event with lower member participation",
                EventDateTime = eventDate,
                Location = "Secondary Venue",
                // MaxCapacity and IsFeatured properties don't exist in Event entity
                CreatedAt = eventDate.AddDays(-3), // Created closer to event date
                UpdatedAt = eventDate.AddDays(-1)
            };

            _context.Events.Add(clubEvent);
            await _context.SaveChangesAsync();

            // Low RSVP rate (40%)
            var rsvpMembers = members.OrderBy(x => Guid.NewGuid()).Take((int)(members.Count * 0.4));
            foreach (var member in rsvpMembers)
            {
                var rsvpStatus = _random.NextDouble() < 0.7 ? "Attending" : "NotAttending";
                var rsvp = new EventRsvp
                {
                    EventId = clubEvent.Id,
                    MemberId = member.Id,
                    RsvpStatus = rsvpStatus,
                    CreatedAt = eventDate.AddDays(-_random.Next(1, 3)),
                    UpdatedAt = eventDate.AddDays(-1)
                };
                _context.EventRsvps.Add(rsvp);
            }

            await _context.SaveChangesAsync();

            // Low attendance rate (60% of attending RSVPs)
            var attendingRsvps = await _context.EventRsvps
                .Where(r => r.EventId == clubEvent.Id && r.RsvpStatus == "Attending")
                .ToListAsync();

            var attendingCount = (int)(attendingRsvps.Count * 0.6);
            foreach (var rsvp in attendingRsvps.Take(attendingCount))
            {
                var attendance = new EventAttendance
                {
                    EventId = clubEvent.Id,
                    MemberId = rsvp.MemberId,
                    AttendedAt = eventDate.AddMinutes(_random.Next(0, 60)), // Some arrive late
                    CreatedAt = eventDate.AddHours(2)
                };
                _context.EventAttendances.Add(attendance);
            }

            await _context.SaveChangesAsync();

            // Low feedback rate with mixed ratings (30% provide feedback)
            var attendances = await _context.EventAttendances
                .Where(a => a.EventId == clubEvent.Id)
                .ToListAsync();

            var feedbackCount = (int)(attendances.Count * 0.3);
            foreach (var attendance in attendances.Take(feedbackCount))
            {
                var feedback = new EventFeedback
                {
                    EventId = clubEvent.Id,
                    MemberId = attendance.MemberId,
                    Rating = _random.Next(2, 5), // Mixed ratings (2-4)
                    Comments = GetMixedFeedbackComment(),
                    CreatedAt = eventDate.AddDays(_random.Next(1, 4)),
                    UpdatedAt = eventDate.AddDays(_random.Next(1, 4))
                };
                _context.EventFeedbacks.Add(feedback);
            }

            await _context.SaveChangesAsync();
        }

        return this;
    }

    /// <summary>
    /// Creates trending engagement data over time periods
    /// </summary>
    public async Task<EventEngagementTestDataBuilder> WithTrendingEngagementData(
        int clubId,
        EngagementTrend trend = EngagementTrend.Improving,
        int weekCount = 8)
    {
        var members = await _context.Members
            .Where(m => m.ClubId == clubId)
            .ToListAsync();

        for (int week = 0; week < weekCount; week++)
        {
            var eventDate = DateTime.UtcNow.AddDays(-(weekCount - week) * 7);
            var engagementRate = CalculateEngagementRate(week, weekCount, trend);

            var clubEvent = new Event
            {
                ClubId = clubId,
                Name = $"Weekly Trend Event W{week + 1}",
                Description = $"Event to demonstrate {trend.ToString().ToLower()} engagement trend",
                EventDateTime = eventDate,
                Location = "Trend Venue",
                // MaxCapacity and IsFeatured properties don't exist in Event entity
                CreatedAt = eventDate.AddDays(-5),
                UpdatedAt = eventDate.AddDays(-1)
            };

            _context.Events.Add(clubEvent);
            await _context.SaveChangesAsync();

            // Create engagement based on calculated rate
            var participatingMembers = members
                .OrderBy(x => Guid.NewGuid())
                .Take((int)(members.Count * engagementRate));

            foreach (var member in participatingMembers)
            {
                // RSVP
                var rsvp = new EventRsvp
                {
                    EventId = clubEvent.Id,
                    MemberId = member.Id,
                    RsvpStatus = "Attending",
                    CreatedAt = eventDate.AddDays(-_random.Next(1, 4)),
                    UpdatedAt = eventDate.AddDays(-1)
                };
                _context.EventRsvps.Add(rsvp);

                // Attendance (90% of RSVPs attend)
                if (_random.NextDouble() < 0.9)
                {
                    var attendance = new EventAttendance
                    {
                        EventId = clubEvent.Id,
                        MemberId = member.Id,
                        AttendedAt = eventDate.AddMinutes(_random.Next(-15, 45)),
                        CreatedAt = eventDate.AddHours(1)
                    };
                    _context.EventAttendances.Add(attendance);

                    // Feedback (60% of attendees provide feedback)
                    if (_random.NextDouble() < 0.6)
                    {
                        var rating = trend == EngagementTrend.Improving
                            ? Math.Min(5, 2 + week / 2 + _random.Next(0, 2)) // Improving ratings
                            : Math.Max(1, 5 - week / 2 - _random.Next(0, 2)); // Declining ratings

                        var feedback = new EventFeedback
                        {
                            EventId = clubEvent.Id,
                            MemberId = member.Id,
                            Rating = rating,
                            Comments = GetTrendBasedFeedbackComment(trend, week),
                            CreatedAt = eventDate.AddDays(_random.Next(1, 2)),
                            UpdatedAt = eventDate.AddDays(_random.Next(1, 2))
                        };
                        _context.EventFeedbacks.Add(feedback);
                    }
                }
            }

            await _context.SaveChangesAsync();
        }

        return this;
    }

    #endregion

    #region Real-time Testing Support

    /// <summary>
    /// Creates events with real-time update scenarios
    /// </summary>
    public async Task<EventEngagementTestDataBuilder> WithRealTimeUpdateScenarios(
        int clubId,
        int concurrentUsers = 10)
    {
        // Create an upcoming event
        var upcomingEvent = new Event
        {
            ClubId = clubId,
            Name = "Real-time Test Event",
            Description = "Event for testing real-time updates",
            EventDateTime = DateTime.UtcNow.AddHours(2),
            Location = "Real-time Venue",
            // MaxCapacity and IsFeatured properties don't exist in Event entity
            CreatedAt = DateTime.UtcNow.AddDays(-7),
            UpdatedAt = DateTime.UtcNow.AddHours(-1)
        };

        _context.Events.Add(upcomingEvent);
        await _context.SaveChangesAsync();

        // Create ongoing event (currently happening)
        var ongoingEvent = new Event
        {
            ClubId = clubId,
            Name = "Ongoing Real-time Event",
            Description = "Currently happening event for real-time testing",
            EventDateTime = DateTime.UtcNow.AddMinutes(-30),
            Location = "Live Venue",
            // MaxCapacity and IsFeatured properties don't exist in Event entity
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-15)
        };

        _context.Events.Add(ongoingEvent);
        await _context.SaveChangesAsync();

        // Create members for concurrent testing
        var membershipType = await EnsureMembershipType(clubId);
        for (int i = 0; i < concurrentUsers; i++)
        {
            var member = new Member
            {
                ClubId = clubId,
                MembershipTypeId = membershipType.Id,
                FullName = $"Concurrent User {i + 1}",
                Email = $"concurrent{i + 1}@test.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddDays(-30),
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow
            };
            _context.Members.Add(member);
        }

        await _context.SaveChangesAsync();

        return this;
    }

    #endregion

    #region Performance Testing Data

    /// <summary>
    /// Creates large dataset for performance testing
    /// </summary>
    public async Task<EventEngagementTestDataBuilder> WithPerformanceTestData(
        int clubId,
        int eventCount = 100,
        int memberCount = 500)
    {
        var membershipType = await EnsureMembershipType(clubId);

        // Create members in batches
        var batchSize = 50;
        var memberBatches = (memberCount + batchSize - 1) / batchSize;

        for (int batch = 0; batch < memberBatches; batch++)
        {
            var batchMembers = Math.Min(batchSize, memberCount - (batch * batchSize));

            for (int i = 0; i < batchMembers; i++)
            {
                var memberIndex = batch * batchSize + i;
                var member = new Member
                {
                    ClubId = clubId,
                    MembershipTypeId = membershipType.Id,
                    FullName = $"Perf Member {memberIndex + 1}",
                    Email = $"perf{memberIndex + 1}@test.com",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow.AddDays(-_random.Next(30, 365)),
                    CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(30, 365)),
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Members.Add(member);
            }

            await _context.SaveChangesAsync();
        }

        // Create events with engagement data
        var allMembers = await _context.Members
            .Where(m => m.ClubId == clubId)
            .ToListAsync();

        var eventBatches = (eventCount + 10 - 1) / 10; // Process 10 events at a time

        for (int batch = 0; batch < eventBatches; batch++)
        {
            var batchEvents = Math.Min(10, eventCount - (batch * 10));

            for (int i = 0; i < batchEvents; i++)
            {
                var eventIndex = batch * 10 + i;
                var eventDate = DateTime.UtcNow.AddDays(-_random.Next(0, 365));

                var clubEvent = new Event
                {
                    ClubId = clubId,
                    Name = $"Perf Event {eventIndex + 1}",
                    Description = $"Performance test event {eventIndex + 1}",
                    EventDateTime = eventDate,
                    Location = $"Perf Venue {eventIndex % 10 + 1}",
                    // MaxCapacity and IsFeatured properties don't exist in Event entity
                    CreatedAt = eventDate.AddDays(-7),
                    UpdatedAt = eventDate.AddDays(-1)
                };

                _context.Events.Add(clubEvent);
                await _context.SaveChangesAsync();

                // Create engagement data for random subset of members
                var participatingMembers = allMembers
                    .OrderBy(x => Guid.NewGuid())
                    .Take(_random.Next(10, Math.Min(100, allMembers.Count)));

                await CreateBulkEngagementData(clubEvent.Id, participatingMembers.ToList());
            }
        }

        return this;
    }

    #endregion

    #region Builder Completion

    public EventEngagementTestDataResult Build()
    {
        return new EventEngagementTestDataResult
        {
            Clubs = _clubs,
            Events = _events,
            Members = _members,
            TotalClubs = _clubs.Count,
            TotalEvents = _events.Count,
            TotalMembers = _members.Count
        };
    }

    #endregion

    #region Private Helper Methods

    private async Task<MembershipType> EnsureMembershipType(int clubId)
    {
        var existingType = await _context.MembershipTypes
            .FirstOrDefaultAsync(mt => mt.ClubId == clubId);

        if (existingType != null)
            return existingType;

        var membershipType = new MembershipType
        {
            ClubId = clubId,
            Name = "Individual",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        return membershipType;
    }

    private async Task CreateMemberEngagementData(int memberId, int clubId, EngagementProfile profile)
    {
        var events = _events.Where(e => e.ClubId == clubId).ToList();
        var participationRate = GetParticipationRate(profile);
        var participatingEvents = events.OrderBy(x => Guid.NewGuid())
            .Take((int)(events.Count * participationRate));

        foreach (var clubEvent in participatingEvents)
        {
            // RSVP
            var rsvpStatus = GetRsvpStatusByProfile(profile);
            var rsvp = new EventRsvp
            {
                EventId = clubEvent.Id,
                MemberId = memberId,
                RsvpStatus = rsvpStatus,
                CreatedAt = clubEvent.EventDateTime.AddDays(-_random.Next(1, 7)),
                UpdatedAt = clubEvent.EventDateTime.AddDays(-1)
            };
            _context.EventRsvps.Add(rsvp);

            // Attendance (based on profile)
            if (rsvpStatus == "Attending" && ShouldAttend(profile))
            {
                var attendance = new EventAttendance
                {
                    EventId = clubEvent.Id,
                    MemberId = memberId,
                    AttendedAt = clubEvent.EventDateTime.AddMinutes(_random.Next(-15, 30)),
                    CreatedAt = clubEvent.EventDateTime.AddHours(1)
                };
                _context.EventAttendances.Add(attendance);

                // Feedback (based on profile)
                if (ShouldProvideFeedback(profile))
                {
                    var rating = GetRatingByProfile(profile);
                    var feedback = new EventFeedback
                    {
                        EventId = clubEvent.Id,
                        MemberId = memberId,
                        Rating = rating,
                        Comments = GetFeedbackCommentByProfile(profile),
                        CreatedAt = clubEvent.EventDateTime.AddDays(_random.Next(1, 3)),
                        UpdatedAt = clubEvent.EventDateTime.AddDays(_random.Next(1, 3))
                    };
                    _context.EventFeedbacks.Add(feedback);
                }
            }
        }

        await _context.SaveChangesAsync();
    }

    private async Task CreateBulkEngagementData(int eventId, List<Member> members)
    {
        // Create RSVPs for subset of members
        var rsvpMembers = members.Take(_random.Next(5, members.Count / 2));
        var rsvps = new List<EventRsvp>();

        foreach (var member in rsvpMembers)
        {
            rsvps.Add(new EventRsvp
            {
                EventId = eventId,
                MemberId = member.Id,
                RsvpStatus = _random.NextDouble() < 0.8 ? "Attending" : "NotAttending",
                CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 7)),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            });
        }

        _context.EventRsvps.AddRange(rsvps);
        await _context.SaveChangesAsync();

        // Create attendances for attending RSVPs
        var attendingRsvps = rsvps.Where(r => r.RsvpStatus == "Attending").ToList();
        var attendances = new List<EventAttendance>();

        foreach (var rsvp in attendingRsvps)
        {
            if (_random.NextDouble() < 0.75) // 75% of attending RSVPs actually attend
            {
                attendances.Add(new EventAttendance
                {
                    EventId = eventId,
                    MemberId = rsvp.MemberId,
                    AttendedAt = DateTime.UtcNow.AddMinutes(_random.Next(-30, 60)),
                    CreatedAt = DateTime.UtcNow.AddHours(1)
                });
            }
        }

        _context.EventAttendances.AddRange(attendances);
        await _context.SaveChangesAsync();

        // Create feedback for subset of attendances
        var feedbacks = new List<EventFeedback>();
        foreach (var attendance in attendances.Take(attendances.Count / 2))
        {
            feedbacks.Add(new EventFeedback
            {
                EventId = eventId,
                MemberId = attendance.MemberId,
                Rating = _random.Next(2, 6),
                Comments = GetRandomFeedbackComment(),
                CreatedAt = DateTime.UtcNow.AddDays(_random.Next(1, 3)),
                UpdatedAt = DateTime.UtcNow.AddDays(_random.Next(1, 3))
            });
        }

        _context.EventFeedbacks.AddRange(feedbacks);
        await _context.SaveChangesAsync();
    }

    #region Data Generation Helpers

    private string GetRandomEventType() => _random.Next(1, 8) switch
    {
        1 => "Workshop",
        2 => "Networking",
        3 => "Social",
        4 => "Educational",
        5 => "Business",
        6 => "Volunteer",
        _ => "General"
    };

    private string GetEventDescription(string eventType) => eventType switch
    {
        "Workshop" => "Hands-on learning experience for members",
        "Networking" => "Professional networking opportunity",
        "Social" => "Casual social gathering for members",
        "Educational" => "Educational session or presentation",
        "Business" => "Business-focused meeting or discussion",
        "Volunteer" => "Community service volunteer opportunity",
        _ => "General club meeting or gathering"
    };

    private string GetRandomLocation() => _random.Next(1, 8) switch
    {
        1 => "Main Conference Room",
        2 => "Community Center",
        3 => "Downtown Hotel",
        4 => "Member's Office",
        5 => "Virtual/Online",
        6 => "Local Restaurant",
        _ => "Club Headquarters"
    };

    private EngagementProfile GetRandomEngagementProfile() => _random.Next(1, 6) switch
    {
        1 => EngagementProfile.HighlyEngaged,
        2 => EngagementProfile.RegularAttendee,
        3 => EngagementProfile.OccasionalParticipant,
        4 => EngagementProfile.RarelyActive,
        _ => EngagementProfile.NewMember
    };

    private double GetParticipationRate(EngagementProfile profile) => profile switch
    {
        EngagementProfile.HighlyEngaged => 0.9,
        EngagementProfile.RegularAttendee => 0.6,
        EngagementProfile.OccasionalParticipant => 0.3,
        EngagementProfile.RarelyActive => 0.1,
        EngagementProfile.NewMember => 0.2,
        _ => 0.4
    };

    private string GetRsvpStatusByProfile(EngagementProfile profile) =>
        profile == EngagementProfile.RarelyActive && _random.NextDouble() < 0.4
            ? "NotAttending"
            : "Attending";

    private bool ShouldAttend(EngagementProfile profile) => profile switch
    {
        EngagementProfile.HighlyEngaged => _random.NextDouble() < 0.95,
        EngagementProfile.RegularAttendee => _random.NextDouble() < 0.85,
        EngagementProfile.OccasionalParticipant => _random.NextDouble() < 0.70,
        EngagementProfile.RarelyActive => _random.NextDouble() < 0.50,
        EngagementProfile.NewMember => _random.NextDouble() < 0.75,
        _ => _random.NextDouble() < 0.70
    };

    private bool ShouldProvideFeedback(EngagementProfile profile) => profile switch
    {
        EngagementProfile.HighlyEngaged => _random.NextDouble() < 0.80,
        EngagementProfile.RegularAttendee => _random.NextDouble() < 0.60,
        EngagementProfile.OccasionalParticipant => _random.NextDouble() < 0.40,
        EngagementProfile.RarelyActive => _random.NextDouble() < 0.20,
        EngagementProfile.NewMember => _random.NextDouble() < 0.50,
        _ => _random.NextDouble() < 0.50
    };

    private int GetRatingByProfile(EngagementProfile profile) => profile switch
    {
        EngagementProfile.HighlyEngaged => _random.Next(4, 6),
        EngagementProfile.RegularAttendee => _random.Next(3, 6),
        EngagementProfile.OccasionalParticipant => _random.Next(2, 5),
        EngagementProfile.RarelyActive => _random.Next(2, 4),
        EngagementProfile.NewMember => _random.Next(3, 5),
        _ => _random.Next(2, 6)
    };

    private string GetRsvpStatus(int index, int total)
    {
        var ratio = (double)index / total;
        return ratio switch
        {
            < 0.7 => "Attending",
            < 0.85 => "Maybe",
            _ => "NotAttending"
        };
    }

    private double CalculateEngagementRate(int week, int totalWeeks, EngagementTrend trend)
    {
        var progress = (double)week / totalWeeks;

        return trend switch
        {
            EngagementTrend.Improving => Math.Min(0.9, 0.3 + (progress * 0.6)),
            EngagementTrend.Declining => Math.Max(0.1, 0.8 - (progress * 0.7)),
            EngagementTrend.Stable => 0.6 + (_random.NextDouble() - 0.5) * 0.1,
            EngagementTrend.Volatile => 0.3 + (_random.NextDouble() * 0.6),
            _ => 0.5
        };
    }

    private string GetRandomFeedbackComment() => _random.Next(1, 10) switch
    {
        1 => "Great event, really enjoyed the content and networking opportunities.",
        2 => "Well organized event with good speakers.",
        3 => "Good event overall, would attend similar events in the future.",
        4 => "Interesting topic, but could use better timing.",
        5 => "Excellent venue and great turnout.",
        6 => "Event was okay, nothing too exciting but informative.",
        7 => "Really appreciated the effort put into organizing this.",
        8 => "Good networking opportunity with fellow members.",
        _ => "Solid event, met expectations."
    };

    private string GetPositiveFeedbackComment() => _random.Next(1, 6) switch
    {
        1 => "Outstanding event! Exceeded my expectations completely.",
        2 => "Fantastic organization and great content. Will definitely attend more!",
        3 => "Excellent event with valuable networking and learning opportunities.",
        4 => "Really impressive event planning and execution. Thank you!",
        _ => "Amazing event! Great speakers and wonderful venue."
    };

    private string GetMixedFeedbackComment() => _random.Next(1, 6) switch
    {
        1 => "Event was decent but could be improved with better timing.",
        2 => "Good content but venue was a bit small for the number of attendees.",
        3 => "Interesting topic but presentation could have been more engaging.",
        4 => "Average event, some parts were better than others.",
        _ => "Not bad, but have attended better events from this club."
    };

    private string GetTrendBasedFeedbackComment(EngagementTrend trend, int week) => trend switch
    {
        EngagementTrend.Improving when week < 3 => "Event was okay, hoping for improvements in future.",
        EngagementTrend.Improving when week >= 3 => "Great improvement! Really enjoying these events now.",
        EngagementTrend.Declining when week < 3 => "Excellent event as always!",
        EngagementTrend.Declining when week >= 3 => "Not as good as previous events. Missing the old quality.",
        _ => GetRandomFeedbackComment()
    };

    private string GetFeedbackCommentByProfile(EngagementProfile profile) => profile switch
    {
        EngagementProfile.HighlyEngaged => GetPositiveFeedbackComment(),
        EngagementProfile.RegularAttendee => GetRandomFeedbackComment(),
        EngagementProfile.OccasionalParticipant => GetMixedFeedbackComment(),
        EngagementProfile.RarelyActive => "Event was fine. Don't attend many club events.",
        EngagementProfile.NewMember => "Good introduction to club events. Looking forward to more.",
        _ => GetRandomFeedbackComment()
    };

    #endregion

    #endregion
}

#region Supporting Classes and Enums

public class EventEngagementTestDataResult
{
    public List<Club> Clubs { get; set; } = new();
    public List<Event> Events { get; set; } = new();
    public List<Member> Members { get; set; } = new();
    public int TotalClubs { get; set; }
    public int TotalEvents { get; set; }
    public int TotalMembers { get; set; }

    public Club? GetClub(int index = 0) => Clubs.Count > index ? Clubs[index] : null;
    public Event? GetEvent(int index = 0) => Events.Count > index ? Events[index] : null;
    public Member? GetMember(int index = 0) => Members.Count > index ? Members[index] : null;
    public Event? GetEventByName(string name) => Events.FirstOrDefault(e => e.Name == name);
    public Member? GetMemberByEmail(string email) => Members.FirstOrDefault(m => m.Email == email);
}

public enum EngagementProfile
{
    HighlyEngaged,      // Attends most events, provides feedback, very active
    RegularAttendee,    // Attends regularly but not every event
    OccasionalParticipant, // Sometimes attends, moderate engagement
    RarelyActive,       // Rarely attends events, low engagement
    NewMember          // Recently joined, exploring club activities
}

public enum EngagementTrend
{
    Improving,  // Engagement increases over time
    Declining,  // Engagement decreases over time
    Stable,     // Consistent engagement level
    Volatile    // Random ups and downs in engagement
}

#endregion