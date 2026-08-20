namespace GatherGrove.Application.Common;

/// <summary>
/// Normalizes <see cref="DateTime"/> values to <see cref="DateTimeKind.Utc"/>.
///
/// Why this exists: PostgreSQL's 'timestamp with time zone' columns reject a
/// DateTime whose Kind is Unspecified. Npgsql throws for any such value bound as
/// a parameter, which covers INSERT values and WHERE-clause predicates alike.
///
/// SQL Server accepted those values silently, which is why the problem only
/// surfaced after the PostgreSQL migration. Every boundary that can produce an
/// Unspecified or Local DateTime routes through here so the rule is stated once.
/// </summary>
public static class UtcDateTime
{
    /// <summary>
    /// Returns <paramref name="value"/> with Kind=Utc.
    ///
    /// Local values are converted with <see cref="DateTime.ToUniversalTime"/>,
    /// which preserves the instant. Unspecified values are relabelled without
    /// shifting: the caller sent no offset, so interpreting them in the server's
    /// local zone would make the stored value depend on the host's timezone. A
    /// date-only "2026-01-15" therefore stays on the 15th.
    /// </summary>
    public static DateTime Normalize(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };

    /// <summary>Nullable overload. Null passes through unchanged.</summary>
    public static DateTime? Normalize(DateTime? value)
        => value.HasValue ? Normalize(value.Value) : null;

    /// <summary>
    /// Normalizes a value that represents a calendar date rather than an instant,
    /// such as a member's join date. Takes the date component and pins it to
    /// midnight UTC.
    ///
    /// Do not use <see cref="Normalize(DateTime)"/> for these. Converting a Local
    /// midnight to UTC preserves the instant but moves the calendar date: midnight
    /// in UTC+13 is 11:00 on the previous day in UTC, so a member who joined on the
    /// 15th would be recorded as joining on the 14th.
    /// </summary>
    public static DateTime NormalizeDate(DateTime value)
        => DateTime.SpecifyKind(value.Date, DateTimeKind.Utc);

    /// <summary>Nullable overload. Null passes through unchanged.</summary>
    public static DateTime? NormalizeDate(DateTime? value)
        => value.HasValue ? NormalizeDate(value.Value) : null;
}
