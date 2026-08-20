using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs.Export;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for EmailDeliveryRepository (in-memory email delivery tracking).
/// Tests verify record storage, retrieval, statistics, and status updates.
/// </summary>
[TestFixture]
public class EmailDeliveryRepositoryTests
{
    private Mock<ILogger<EmailDeliveryRepository>> _mockLogger = null!;
    private EmailDeliveryRepository _repository = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<EmailDeliveryRepository>>();
        _repository = new EmailDeliveryRepository(_mockLogger.Object);
    }

    #region SaveDeliveryRecordAsync Tests

    [Test]
    public async Task SaveDeliveryRecordAsync_ValidRecord_ReturnsRecordWithId()
    {
        // Arrange
        var record = new EmailDeliveryRecord
        {
            RecipientEmail = "test@test.com",
            EmailType = "Welcome"
        };

        // Act
        var result = await _repository.SaveDeliveryRecordAsync(record);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeNullOrEmpty();
        result.RecipientEmail.Should().Be("test@test.com");
    }

    [Test]
    public async Task SaveDeliveryRecordAsync_WithExistingId_PreservesId()
    {
        // Arrange
        var existingId = "existing-id-123";
        var record = new EmailDeliveryRecord
        {
            Id = existingId,
            RecipientEmail = "test@test.com"
        };

        // Act
        var result = await _repository.SaveDeliveryRecordAsync(record);

        // Assert
        result.Id.Should().Be(existingId);
    }

    [Test]
    public async Task SaveDeliveryRecordAsync_WithDefaultSentAt_SetsSentAtToNow()
    {
        // Arrange
        var record = new EmailDeliveryRecord
        {
            RecipientEmail = "test@test.com"
        };
        var beforeSave = DateTime.UtcNow;

        // Act
        var result = await _repository.SaveDeliveryRecordAsync(record);

        // Assert
        result.SentAt.Should().BeOnOrAfter(beforeSave);
        result.SentAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Test]
    public async Task SaveDeliveryRecordAsync_WithExistingSentAt_PreservesSentAt()
    {
        // Arrange
        var sentAt = new DateTime(2025, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var record = new EmailDeliveryRecord
        {
            RecipientEmail = "test@test.com",
            SentAt = sentAt
        };

        // Act
        var result = await _repository.SaveDeliveryRecordAsync(record);

        // Assert
        result.SentAt.Should().Be(sentAt);
    }

    [Test]
    public async Task SaveDeliveryRecordAsync_LogsRecipientEmail()
    {
        // Arrange
        var record = new EmailDeliveryRecord
        {
            RecipientEmail = "logged@test.com"
        };

        // Act
        await _repository.SaveDeliveryRecordAsync(record);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Saving delivery record");
    }

    #endregion

    #region CreateDeliveryRecordAsync Tests

    [Test]
    public async Task CreateDeliveryRecordAsync_DelegatesToSaveDeliveryRecord()
    {
        // Arrange
        var record = new EmailDeliveryRecord
        {
            RecipientEmail = "create@test.com"
        };

        // Act
        var result = await _repository.CreateDeliveryRecordAsync(record);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeNullOrEmpty();
    }

    #endregion

    #region GetDeliveryHistoryAsync Tests

    [Test]
    public async Task GetDeliveryHistoryAsync_NoRecords_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetDeliveryHistoryAsync(10);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Test]
    public async Task GetDeliveryHistoryAsync_WithRecords_ReturnsOrderedByDate()
    {
        // Arrange
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "first@test.com",
            SentAt = DateTime.UtcNow.AddDays(-2)
        });
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "second@test.com",
            SentAt = DateTime.UtcNow.AddDays(-1)
        });
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "third@test.com",
            SentAt = DateTime.UtcNow
        });

        // Act
        var result = await _repository.GetDeliveryHistoryAsync(10);

        // Assert
        result.Should().HaveCount(3);
        result[0].RecipientEmail.Should().Be("third@test.com");
        result[1].RecipientEmail.Should().Be("second@test.com");
        result[2].RecipientEmail.Should().Be("first@test.com");
    }

    [Test]
    public async Task GetDeliveryHistoryAsync_RespectsLimit()
    {
        // Arrange
        for (int i = 0; i < 10; i++)
        {
            await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
            {
                RecipientEmail = $"test{i}@test.com"
            });
        }

        // Act
        var result = await _repository.GetDeliveryHistoryAsync(5);

        // Assert
        result.Should().HaveCount(5);
    }

    [Test]
    public async Task GetDeliveryHistoryAsync_WithClubId_FiltersbyClub()
    {
        // Arrange
        var clubId = 123;
        var clubGuid = new Guid($"00000000-0000-0000-0000-{clubId:000000000000}");

        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "club@test.com",
            ClubId = clubGuid
        });
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "other@test.com",
            ClubId = Guid.NewGuid()
        });

        // Act
        var result = await _repository.GetDeliveryHistoryAsync(clubId, 10);

        // Assert
        result.Should().HaveCount(1);
        result[0].RecipientEmail.Should().Be("club@test.com");
    }

    #endregion

    #region GetStatisticsAsync Tests

    [Test]
    public async Task GetStatisticsAsync_NoRecords_ReturnsZeroStats()
    {
        // Arrange
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        // Act
        var result = await _repository.GetStatisticsAsync(startDate, endDate);

        // Assert
        result.TotalSent.Should().Be(0);
        result.TotalDelivered.Should().Be(0);
        result.TotalFailed.Should().Be(0);
        result.TotalBounced.Should().Be(0);
        result.DeliveryRate.Should().Be(0);
    }

    [Test]
    public async Task GetDeliveryStatisticsAsync_WithRecords_CalculatesCorrectly()
    {
        // Arrange
        var now = DateTime.UtcNow;
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "delivered@test.com",
            Status = EmailDeliveryStatus.Delivered,
            SentAt = now.AddDays(-1)
        });
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "sent@test.com",
            Status = EmailDeliveryStatus.Sent,
            SentAt = now.AddDays(-1)
        });
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "failed@test.com",
            Status = EmailDeliveryStatus.Failed,
            SentAt = now.AddDays(-1)
        });
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "bounced@test.com",
            Status = EmailDeliveryStatus.Bounced,
            SentAt = now.AddDays(-1)
        });

        // Act
        var result = await _repository.GetDeliveryStatisticsAsync(now.AddDays(-7), now, 0);

        // Assert
        result.TotalSent.Should().Be(4);
        result.TotalDelivered.Should().Be(2); // Delivered + Sent
        result.TotalFailed.Should().Be(1);
        result.TotalBounced.Should().Be(1);
        result.DeliveryRate.Should().Be(0.5); // 2/4
        result.BounceRate.Should().Be(0.25); // 1/4
    }

    [Test]
    public async Task GetDeliveryStatisticsAsync_FiltersByDateRange()
    {
        // Arrange
        var now = DateTime.UtcNow;
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "inrange@test.com",
            Status = EmailDeliveryStatus.Delivered,
            SentAt = now.AddDays(-5)
        });
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "outofrange@test.com",
            Status = EmailDeliveryStatus.Delivered,
            SentAt = now.AddDays(-30)
        });

        // Act
        var result = await _repository.GetDeliveryStatisticsAsync(now.AddDays(-7), now, 0);

        // Assert
        result.TotalSent.Should().Be(1);
    }

    [Test]
    public async Task GetDeliveryStatisticsAsync_FiltersByClubId()
    {
        // Arrange
        var clubId = 456;
        var clubGuid = new Guid($"00000000-0000-0000-0000-{clubId:000000000000}");
        var now = DateTime.UtcNow;

        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "club@test.com",
            Status = EmailDeliveryStatus.Delivered,
            ClubId = clubGuid,
            SentAt = now
        });
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "other@test.com",
            Status = EmailDeliveryStatus.Delivered,
            ClubId = Guid.NewGuid(),
            SentAt = now
        });

        // Act
        var result = await _repository.GetDeliveryStatisticsAsync(now.AddDays(-7), now.AddDays(1), clubId);

        // Assert
        result.TotalSent.Should().Be(1);
    }

    #endregion

    #region GetDeliveryRecordAsync Tests

    [Test]
    public async Task GetDeliveryRecordAsync_WithGuidId_ReturnsRecord()
    {
        // Arrange
        var deliveryId = Guid.NewGuid();
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            DeliveryId = deliveryId,
            RecipientEmail = "test@test.com"
        });

        // Act
        var result = await _repository.GetDeliveryRecordAsync(deliveryId.ToString());

        // Assert
        result.Should().NotBeNull();
        result!.DeliveryId.Should().Be(deliveryId);
    }

    [Test]
    public async Task GetDeliveryRecordAsync_WithStringId_ReturnsRecord()
    {
        // Arrange
        var stringId = "string-id-123";
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            Id = stringId,
            RecipientEmail = "test@test.com"
        });

        // Act
        var result = await _repository.GetDeliveryRecordAsync(stringId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(stringId);
    }

    [Test]
    public async Task GetDeliveryRecordAsync_NotFound_ReturnsNull()
    {
        // Act
        var result = await _repository.GetDeliveryRecordAsync("nonexistent-id");

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region UpdateDeliveryStatusAsync Tests

    [Test]
    public async Task UpdateDeliveryStatusAsync_ValidRecord_UpdatesStatus()
    {
        // Arrange
        var deliveryId = Guid.NewGuid();
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            DeliveryId = deliveryId,
            RecipientEmail = "test@test.com",
            Status = EmailDeliveryStatus.Sent
        });
        var newTimestamp = DateTime.UtcNow;

        // Act
        await _repository.UpdateDeliveryStatusAsync(deliveryId.ToString(), "Delivered", newTimestamp);

        // Assert
        var updatedRecord = await _repository.GetDeliveryRecordAsync(deliveryId.ToString());
        updatedRecord!.Status.Should().Be(EmailDeliveryStatus.Delivered);
        updatedRecord.DeliveredAt.Should().Be(newTimestamp);
    }

    [Test]
    public async Task UpdateDeliveryStatusAsync_InvalidStatus_DoesNotUpdate()
    {
        // Arrange
        var deliveryId = Guid.NewGuid();
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            DeliveryId = deliveryId,
            RecipientEmail = "test@test.com",
            Status = EmailDeliveryStatus.Sent
        });

        // Act
        await _repository.UpdateDeliveryStatusAsync(deliveryId.ToString(), "InvalidStatus", DateTime.UtcNow);

        // Assert
        var record = await _repository.GetDeliveryRecordAsync(deliveryId.ToString());
        record!.Status.Should().Be(EmailDeliveryStatus.Sent); // Unchanged
    }

    [Test]
    public async Task UpdateDeliveryStatusAsync_RecordNotFound_DoesNotThrow()
    {
        // Act & Assert - Should not throw
        await _repository.UpdateDeliveryStatusAsync("nonexistent", "Delivered", DateTime.UtcNow);
    }

    #endregion

    #region GetDeliveryRecordByMessageIdAsync Tests

    [Test]
    public async Task GetDeliveryRecordByMessageIdAsync_ExistingRecord_ReturnsRecord()
    {
        // Arrange
        var messageId = "msg-123";
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            MessageId = messageId,
            RecipientEmail = "test@test.com"
        });

        // Act
        var result = await _repository.GetDeliveryRecordByMessageIdAsync(messageId);

        // Assert
        result.Should().NotBeNull();
        result!.MessageId.Should().Be(messageId);
    }

    [Test]
    public async Task GetDeliveryRecordByMessageIdAsync_NoRecord_CreatesMockRecord()
    {
        // Arrange
        var messageId = "new-message-id";

        // Act
        var result = await _repository.GetDeliveryRecordByMessageIdAsync(messageId);

        // Assert
        result.Should().NotBeNull();
        result!.MessageId.Should().Be(messageId);
        result.Status.Should().Be(EmailDeliveryStatus.Sent);
    }

    [Test]
    public async Task GetDeliveryRecordByMessageIdAsync_EmptyMessageId_ReturnsNull()
    {
        // Act
        var result = await _repository.GetDeliveryRecordByMessageIdAsync("");

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region RecordBounceAsync Tests

    [Test]
    public async Task RecordBounceAsync_ValidBounce_UpdatesStatusToBounced()
    {
        // Arrange
        var deliveryId = Guid.NewGuid();
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            DeliveryId = deliveryId,
            RecipientEmail = "bounce@test.com",
            Status = EmailDeliveryStatus.Sent
        });

        var bounceNotification = new EmailBounceNotification
        {
            BounceType = "hard",
            BounceReason = "Invalid mailbox",
            BouncedAt = DateTime.UtcNow
        };

        // Act
        await _repository.RecordBounceAsync(deliveryId.ToString(), bounceNotification);

        // Assert
        var record = await _repository.GetDeliveryRecordAsync(deliveryId.ToString());
        record!.Status.Should().Be(EmailDeliveryStatus.Bounced);
    }

    [Test]
    public async Task RecordBounceAsync_LogsBounce()
    {
        // Arrange
        var bounceNotification = new EmailBounceNotification
        {
            BounceType = "soft",
            BouncedAt = DateTime.UtcNow
        };

        // Act
        await _repository.RecordBounceAsync("test-id", bounceNotification);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Recording bounce");
    }

    #endregion

    #region GetDeliveryDigestDataAsync Tests

    [Test]
    public async Task GetDeliveryDigestDataAsync_WithRecords_ReturnsSubjects()
    {
        // Arrange
        var now = DateTime.UtcNow;
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            Subject = "Test Subject 1",
            RecipientEmail = "test@test.com",
            SentAt = now
        });
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            Subject = "Test Subject 2",
            RecipientEmail = "test@test.com",
            SentAt = now
        });

        // Act
        var result = await _repository.GetDeliveryDigestDataAsync(now.AddDays(-1), now.AddDays(1));

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain("Test Subject 1");
        result.Should().Contain("Test Subject 2");
    }

    [Test]
    public async Task GetDeliveryDigestDataAsync_NoRecords_ReturnsMockData()
    {
        // Arrange
        var now = DateTime.UtcNow;

        // Act
        var result = await _repository.GetDeliveryDigestDataAsync(now.AddDays(-1), now.AddDays(1));

        // Assert
        result.Should().NotBeEmpty();
        result.Should().Contain("Member Export Report");
    }

    [Test]
    public async Task GetDeliveryDigestDataAsync_LimitsToFiveRecords()
    {
        // Arrange
        var now = DateTime.UtcNow;
        for (int i = 0; i < 10; i++)
        {
            await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
            {
                Subject = $"Subject {i}",
                RecipientEmail = "test@test.com",
                SentAt = now
            });
        }

        // Act
        var result = await _repository.GetDeliveryDigestDataAsync(now.AddDays(-1), now.AddDays(1));

        // Assert
        result.Should().HaveCount(5);
    }

    #endregion

    #region GetDeliveryRecordByEmailAsync Tests

    [Test]
    public async Task GetDeliveryRecordByEmailAsync_ExistingEmail_ReturnsRecord()
    {
        // Arrange
        await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "find@test.com"
        });

        // Act
        var result = await _repository.GetDeliveryRecordByEmailAsync("find@test.com");

        // Assert
        result.Should().NotBeNull();
        result!.RecipientEmail.Should().Be("find@test.com");
    }

    [Test]
    public async Task GetDeliveryRecordByEmailAsync_NotFound_ReturnsNull()
    {
        // Act
        var result = await _repository.GetDeliveryRecordByEmailAsync("notfound@test.com");

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region UpdateDeliveryRecordAsync Tests

    [Test]
    public async Task UpdateDeliveryRecordAsync_ExistingRecord_UpdatesFields()
    {
        // Arrange
        var record = await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
        {
            RecipientEmail = "update@test.com",
            Status = EmailDeliveryStatus.Sent
        });

        record.Status = EmailDeliveryStatus.Delivered;
        record.DeliveredAt = DateTime.UtcNow;
        record.Subject = "Updated Subject";

        // Act
        await _repository.UpdateDeliveryRecordAsync(record);

        // Assert
        var updated = await _repository.GetDeliveryRecordAsync(record.Id!);
        updated!.Status.Should().Be(EmailDeliveryStatus.Delivered);
        updated.Subject.Should().Be("Updated Subject");
    }

    [Test]
    public async Task UpdateDeliveryRecordAsync_NonexistentRecord_DoesNotThrow()
    {
        // Arrange
        var record = new EmailDeliveryRecord
        {
            Id = "nonexistent",
            RecipientEmail = "test@test.com"
        };

        // Act & Assert - Should not throw
        await _repository.UpdateDeliveryRecordAsync(record);
    }

    #endregion

    #region Concurrent Operations Tests

    [Test]
    public async Task Repository_ConcurrentSaves_AllSucceed()
    {
        // Arrange
        var tasks = new List<Task<EmailDeliveryRecord>>();

        // Act
        for (int i = 0; i < 20; i++)
        {
            tasks.Add(_repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
            {
                RecipientEmail = $"concurrent{i}@test.com"
            }));
        }

        var results = await Task.WhenAll(tasks);

        // Assert
        results.Should().HaveCount(20);
        var history = await _repository.GetDeliveryHistoryAsync(100);
        history.Should().HaveCount(20);
    }

    [Test]
    public async Task Repository_ConcurrentReads_AllSucceed()
    {
        // Arrange
        for (int i = 0; i < 10; i++)
        {
            await _repository.SaveDeliveryRecordAsync(new EmailDeliveryRecord
            {
                RecipientEmail = $"read{i}@test.com"
            });
        }

        var tasks = new List<Task<List<EmailDeliveryRecord>>>();

        // Act
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(_repository.GetDeliveryHistoryAsync(10));
        }

        var results = await Task.WhenAll(tasks);

        // Assert
        results.Should().HaveCount(10);
        foreach (var result in results)
        {
            result.Should().HaveCount(10);
        }
    }

    #endregion

    #region Helper Methods

    private void VerifyLogWasCalled(LogLevel level, string containsMessage)
    {
        _mockLogger.Verify(
            x => x.Log(
                level,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains(containsMessage)),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            $"Expected log at level {level} containing '{containsMessage}'");
    }

    #endregion
}
