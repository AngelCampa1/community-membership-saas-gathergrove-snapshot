namespace GatherGrove.Domain.Enums;

/// <summary>
/// Rate limiting types for different operations
/// </summary>
public enum RateLimitType
{
    ExportRequests,
    LoginAttempts,
    APIRequests,
    EmailSending,
    FileUploads,
    DataQueries,
    Hourly,
    Daily,
    Weekly
}

/// <summary>
/// Levels of suspicion for detecting unusual activity
/// </summary>
public enum SuspicionLevel
{
    None,
    Low,
    Medium,
    High,
    Critical
}

/// <summary>
/// Token validation result types
/// </summary>
public enum TokenValidationType
{
    Valid,
    Expired,
    Invalid,
    Revoked,
    NotFound
}

/// <summary>
/// Security event types for audit and monitoring
/// </summary>
public enum SecurityEventType
{
    Login,
    Logout,
    DataAccess,
    DataExport,
    UnauthorizedAccess,
    SuspiciousActivity,
    PasswordChange,
    AccountLocked,
    ExportAttempt,
    DataDownload,
    FailedLogin,
    SuspiciousExport,
    DataBreach,
    RateLimitExceeded,
    InvalidToken,
    AccountLockout,
    PrivilegeEscalation,
    UnusualActivity,
    ComplianceViolation,
    UnauthorizedExportAttempt
}

/// <summary>
/// Security event severity levels
/// </summary>
public enum SecurityEventSeverity
{
    Info,
    Warning,
    Error,
    Critical,
    Low,
    Medium,
    High
}

/// <summary>
/// Security actions that can be taken
/// </summary>
public enum SecurityAction
{
    Allow,
    Deny,
    Challenge,
    Monitor,
    Block,
    Alert,
    TemporaryBlock
}

/// <summary>
/// Secure token validation result
/// </summary>
public class SecureTokenValidationResult
{
    public bool IsValid { get; set; }
    public TokenValidationType ValidationType { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, string> TokenMetadata { get; set; } = new();
    public DateTime? ExpiresAt { get; set; }
    public int? UserId { get; set; }
    public int? ClubId { get; set; }
    public int? ExportId { get; set; }
    public int? RemainingDownloads { get; set; }
    public string? ValidationFailureReason { get; set; }
}