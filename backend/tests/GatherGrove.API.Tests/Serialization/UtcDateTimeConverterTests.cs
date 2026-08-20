using System.Text.Json;
using GatherGrove.API.Serialization;
using NUnit.Framework;

namespace GatherGrove.API.Tests.Serialization;

/// <summary>
/// Regression tests for the PostgreSQL 'timestamp with time zone' incompatibility.
/// Npgsql throws ArgumentException when handed a DateTime with Kind=Unspecified,
/// which is what System.Text.Json produces for an offset-less JSON string.
/// </summary>
[TestFixture]
public class UtcDateTimeConverterTests
{
    private JsonSerializerOptions _options = null!;

    private sealed class Payload
    {
        public DateTime When { get; set; }
        public DateTime? MaybeWhen { get; set; }
    }

    [SetUp]
    public void SetUp()
    {
        _options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
        _options.Converters.Add(new UtcDateTimeConverter());
        _options.Converters.Add(new NullableUtcDateTimeConverter());
    }

    [Test]
    public void Read_DateOnlyString_ProducesUtcKind()
    {
        var result = JsonSerializer.Deserialize<Payload>("{\"when\":\"2026-01-15\"}", _options);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.When.Kind, Is.EqualTo(DateTimeKind.Utc),
            "A date-only string must not reach Npgsql with Kind=Unspecified");
        Assert.That(result.When.Year, Is.EqualTo(2026));
        Assert.That(result.When.Month, Is.EqualTo(1));
        Assert.That(result.When.Day, Is.EqualTo(15));
    }

    [Test]
    public void Read_NullableDateOnlyString_ProducesUtcKind()
    {
        var result = JsonSerializer.Deserialize<Payload>("{\"maybeWhen\":\"2026-01-15\"}", _options);

        Assert.That(result?.MaybeWhen, Is.Not.Null);
        Assert.That(result!.MaybeWhen!.Value.Kind, Is.EqualTo(DateTimeKind.Utc));
    }

    [Test]
    public void Read_NullNullable_StaysNull()
    {
        var result = JsonSerializer.Deserialize<Payload>("{\"maybeWhen\":null}", _options);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.MaybeWhen, Is.Null);
    }

    [Test]
    public void Read_ExplicitUtcOffset_PreservesInstant()
    {
        var result = JsonSerializer.Deserialize<Payload>("{\"when\":\"2026-01-15T12:00:00Z\"}", _options);

        Assert.That(result!.When.Kind, Is.EqualTo(DateTimeKind.Utc));
        Assert.That(result.When.Hour, Is.EqualTo(12));
    }

    [Test]
    public void Read_NonUtcOffset_ConvertsToUtcInstant()
    {
        // 12:00 at +02:00 is 10:00 UTC - the instant must be preserved, not relabelled.
        var result = JsonSerializer.Deserialize<Payload>("{\"when\":\"2026-01-15T12:00:00+02:00\"}", _options);

        Assert.That(result!.When.Kind, Is.EqualTo(DateTimeKind.Utc));
        Assert.That(result.When.Hour, Is.EqualTo(10));
    }

    [Test]
    public void Normalize_UnspecifiedKind_IsRelabelledNotShifted()
    {
        var input = new DateTime(2026, 1, 15, 8, 30, 0, DateTimeKind.Unspecified);

        var result = UtcDateTimeConverter.Normalize(input);

        Assert.That(result.Kind, Is.EqualTo(DateTimeKind.Utc));
        Assert.That(result.Hour, Is.EqualTo(8), "Unspecified values are relabelled, not time-shifted");
        Assert.That(result.Minute, Is.EqualTo(30));
    }

    [Test]
    public void RoundTrip_WritesUtcAndReadsBackIdentically()
    {
        var original = new Payload { When = new DateTime(2026, 3, 25, 14, 5, 0, DateTimeKind.Utc) };

        var json = JsonSerializer.Serialize(original, _options);
        var result = JsonSerializer.Deserialize<Payload>(json, _options);

        Assert.That(result!.When.Kind, Is.EqualTo(DateTimeKind.Utc));
        Assert.That(result.When, Is.EqualTo(original.When));
    }

    // ---- Write path ----
    // Responses are mostly unaffected because values loaded from timestamptz come
    // back Kind=Utc already. The exposure is DTO fields computed in-process from
    // DateTime.Now or .Date, so both non-Utc kinds are pinned here.

    [Test]
    public void Write_UnspecifiedKind_EmitsZSuffix()
    {
        var payload = new Payload { When = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Unspecified) };

        var json = JsonSerializer.Serialize(payload, _options);

        // Without the Z, JavaScript's Date parses the string as local time, which
        // moves the displayed day for any user behind UTC.
        Assert.That(json, Does.Contain("2026-01-15T00:00:00Z"));
    }

    [Test]
    public void Write_LocalKind_EmitsConvertedUtcInstant()
    {
        var local = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Local);
        var payload = new Payload { When = local };

        var json = JsonSerializer.Serialize(payload, _options);
        var written = JsonSerializer.Deserialize<Payload>(json, _options)!.When;

        Assert.That(written.Kind, Is.EqualTo(DateTimeKind.Utc));
        Assert.That(written, Is.EqualTo(local.ToUniversalTime()),
            "the instant must survive the conversion, not the wall-clock reading");
    }

    [Test]
    public void Write_NullNullable_EmitsJsonNull()
    {
        var json = JsonSerializer.Serialize(new Payload { MaybeWhen = null }, _options);

        Assert.That(json, Does.Contain("\"maybeWhen\":null"));
    }

    // ---- Edge cases ----

    [Test]
    public void Normalize_MinAndMaxValueWithLocalKind_ClampsWithoutOverflowing()
    {
        // ToUniversalTime clamps at the boundaries rather than throwing. Pinned so a
        // future change cannot turn a boundary value into an unhandled exception.
        Assert.DoesNotThrow(() =>
        {
            var min = UtcDateTimeConverter.Normalize(DateTime.SpecifyKind(DateTime.MinValue, DateTimeKind.Local));
            var max = UtcDateTimeConverter.Normalize(DateTime.SpecifyKind(DateTime.MaxValue, DateTimeKind.Local));
            Assert.That(min.Kind, Is.EqualTo(DateTimeKind.Utc));
            Assert.That(max.Kind, Is.EqualTo(DateTimeKind.Utc));
        });
    }

    [Test]
    public void Normalize_DefaultDateTime_BecomesUtcWithoutShifting()
    {
        var result = UtcDateTimeConverter.Normalize(default);

        Assert.That(result.Kind, Is.EqualTo(DateTimeKind.Utc));
        Assert.That(result, Is.EqualTo(DateTime.SpecifyKind(default, DateTimeKind.Utc)));
    }

    [Test]
    public void Read_MalformedValue_ThrowsJsonExceptionSoRequestIs400NotA500()
    {
        // reader.GetDateTime() throws FormatException internally; System.Text.Json
        // rewraps it as JsonException, which MVC surfaces as 400. If that ever stops
        // being true, an invalid date becomes a 500 and this test catches it.
        Assert.Throws<JsonException>(() =>
            JsonSerializer.Deserialize<Payload>("{\"when\":\"not-a-date\"}", _options));
    }

    [Test]
    public void Read_NumericToken_ThrowsJsonException()
    {
        Assert.Throws<JsonException>(() =>
            JsonSerializer.Deserialize<Payload>("{\"when\":1737000000}", _options));
    }

    [Test]
    public void Read_NestedAndArrayDateTimes_AreAllNormalized()
    {
        var json = "{\"items\":[{\"when\":\"2026-01-15\"},{\"when\":\"2026-02-20\"}]}";

        var result = JsonSerializer.Deserialize<Envelope>(json, _options);

        Assert.That(result!.Items, Has.Count.EqualTo(2));
        Assert.That(result.Items.All(i => i.When.Kind == DateTimeKind.Utc), Is.True,
            "the converter must apply at every depth, not just top-level properties");
    }

    private sealed class Envelope
    {
        public List<Payload> Items { get; set; } = new();
    }
}
