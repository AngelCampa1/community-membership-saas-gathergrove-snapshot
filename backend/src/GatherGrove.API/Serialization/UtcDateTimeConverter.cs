using System.Text.Json;
using System.Text.Json.Serialization;
using GatherGrove.Application.Common;

namespace GatherGrove.API.Serialization;

/// <summary>
/// Normalizes every <see cref="DateTime"/> crossing the JSON boundary to
/// <see cref="DateTimeKind.Utc"/>.
///
/// System.Text.Json produces Kind=Unspecified for a date-only or offset-less
/// string ("2026-01-15"), which Npgsql rejects for 'timestamp with time zone'.
/// Handling it here fixes the whole class of bug at the boundary instead of at
/// each assignment site.
///
/// This covers request bodies only. Query string, route, header, and form values
/// bypass System.Text.Json entirely and are handled by
/// <see cref="ModelBinding.UtcDateTimeModelBinder"/>.
///
/// The normalization rule itself lives in <see cref="UtcDateTime"/> so the JSON
/// boundary, the model-binding boundary, and the CSV import path cannot drift.
/// </summary>
public sealed class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => UtcDateTime.Normalize(reader.GetDateTime());

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        => writer.WriteStringValue(UtcDateTime.Normalize(value));

    /// <summary>
    /// Retained so existing callers and tests keep compiling. Prefer
    /// <see cref="UtcDateTime.Normalize(DateTime)"/> directly.
    /// </summary>
    public static DateTime Normalize(DateTime value) => UtcDateTime.Normalize(value);
}

/// <summary>
/// Nullable counterpart to <see cref="UtcDateTimeConverter"/>.
///
/// Registered explicitly for clarity. System.Text.Json would otherwise resolve
/// DateTime? through its NullableConverterFactory, which unwraps to the
/// underlying type and picks up <see cref="UtcDateTimeConverter"/> on its own,
/// so this class is a belt-and-braces registration rather than a requirement.
/// </summary>
public sealed class NullableUtcDateTimeConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType == JsonTokenType.Null
            ? null
            : UtcDateTime.Normalize(reader.GetDateTime());

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
        {
            writer.WriteStringValue(UtcDateTime.Normalize(value.Value));
        }
        else
        {
            writer.WriteNullValue();
        }
    }
}
