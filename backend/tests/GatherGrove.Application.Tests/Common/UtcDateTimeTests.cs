using GatherGrove.Application.Common;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Common;

/// <summary>
/// Pins the distinction between the two normalization rules.
///
/// PostgreSQL 'timestamp with time zone' rejects Kind=Unspecified, so every value
/// must end up Kind=Utc. How it gets there depends on what the column means:
/// an instant must keep its point in time, a calendar date must keep its date.
/// Using the wrong one silently moves data by a day.
/// </summary>
[TestFixture]
public class UtcDateTimeTests
{
    // ---- Normalize: for instants ----

    [Test]
    public void Normalize_Unspecified_IsRelabelledNotShifted()
    {
        var input = new DateTime(2026, 1, 15, 8, 30, 0, DateTimeKind.Unspecified);

        var result = UtcDateTime.Normalize(input);

        Assert.That(result.Kind, Is.EqualTo(DateTimeKind.Utc));
        Assert.That(result.TimeOfDay, Is.EqualTo(new TimeSpan(8, 30, 0)),
            "no offset was supplied, so guessing the server's zone would make the " +
            "stored value depend on where the host happens to run");
    }

    [Test]
    public void Normalize_Local_PreservesTheInstant()
    {
        var local = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Local);

        var result = UtcDateTime.Normalize(local);

        Assert.That(result.Kind, Is.EqualTo(DateTimeKind.Utc));
        Assert.That(result, Is.EqualTo(local.ToUniversalTime()));
    }

    [Test]
    public void Normalize_Utc_IsUnchanged()
    {
        var utc = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);

        Assert.That(UtcDateTime.Normalize(utc), Is.EqualTo(utc));
    }

    [Test]
    public void Normalize_Null_StaysNull()
    {
        Assert.That(UtcDateTime.Normalize((DateTime?)null), Is.Null);
    }

    // ---- NormalizeDate: for calendar dates ----

    [Test]
    public void NormalizeDate_LocalMidnight_KeepsTheCalendarDate()
    {
        // The regression this guards: Normalize would convert local midnight to an
        // instant, which lands on the previous day for any zone ahead of UTC.
        var localMidnight = DateTime.SpecifyKind(new DateTime(2026, 1, 15), DateTimeKind.Local);

        var result = UtcDateTime.NormalizeDate(localMidnight);

        Assert.That(result.Kind, Is.EqualTo(DateTimeKind.Utc));
        Assert.That(result.Date, Is.EqualTo(new DateTime(2026, 1, 15)));
        Assert.That(result.TimeOfDay, Is.EqualTo(TimeSpan.Zero));
    }

    [Test]
    public void NormalizeDate_Today_RoundTripsToTheSameDate()
    {
        var result = UtcDateTime.NormalizeDate(DateTime.Today);

        Assert.That(result.Kind, Is.EqualTo(DateTimeKind.Utc));
        Assert.That(result.Date, Is.EqualTo(DateTime.Today),
            "a member joining today must not be recorded as joining yesterday");
    }

    [Test]
    public void NormalizeDate_DiscardsTimeComponent()
    {
        var withTime = new DateTime(2026, 1, 15, 23, 59, 59, DateTimeKind.Unspecified);

        var result = UtcDateTime.NormalizeDate(withTime);

        Assert.That(result, Is.EqualTo(new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc)));
    }

    [Test]
    public void NormalizeDate_Null_StaysNull()
    {
        Assert.That(UtcDateTime.NormalizeDate((DateTime?)null), Is.Null);
    }

    [Test]
    public void NormalizeDate_AndNormalize_DisagreeForLocalMidnight_WhichIsThePoint()
    {
        var localMidnight = DateTime.SpecifyKind(new DateTime(2026, 1, 15), DateTimeKind.Local);

        var asDate = UtcDateTime.NormalizeDate(localMidnight);
        var asInstant = UtcDateTime.Normalize(localMidnight);

        Assert.That(asDate.Date, Is.EqualTo(new DateTime(2026, 1, 15)));
        Assert.That(asInstant, Is.EqualTo(localMidnight.ToUniversalTime()));

        // On a host at UTC these coincide; anywhere else they must not, which is
        // exactly why the two methods exist.
        if (TimeZoneInfo.Local.GetUtcOffset(localMidnight) != TimeSpan.Zero)
        {
            Assert.That(asDate, Is.Not.EqualTo(asInstant));
        }
    }
}
