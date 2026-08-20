using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to track an analytics event
/// </summary>
public class TrackAnalyticsRequest
{
    /// <summary>
    /// Event name/type
    /// </summary>
    [StringLength(100)]
    public string? EventName { get; set; }

    /// <summary>
    /// Web Vitals metric name (LCP, FID, CLS, etc.)
    /// </summary>
    [StringLength(50)]
    public string? Metric { get; set; }

    /// <summary>
    /// Metric value
    /// </summary>
    public double Value { get; set; }

    /// <summary>
    /// Metric delta value
    /// </summary>
    public double Delta { get; set; }

    /// <summary>
    /// Performance rating (good, needs-improvement, poor)
    /// </summary>
    [StringLength(20)]
    public string? Rating { get; set; }

    /// <summary>
    /// Event category
    /// </summary>
    [StringLength(100)]
    public string? Category { get; set; }

    /// <summary>
    /// Event label
    /// </summary>
    [StringLength(200)]
    public string? Label { get; set; }

    /// <summary>
    /// Current page URL
    /// </summary>
    [StringLength(1000)]
    public string? Url { get; set; }

    /// <summary>
    /// User agent string
    /// </summary>
    [StringLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Timestamp when event occurred (ISO 8601)
    /// </summary>
    public string? Timestamp { get; set; }

    /// <summary>
    /// Session ID for tracking
    /// </summary>
    [StringLength(128)]
    public string? SessionId { get; set; }

    /// <summary>
    /// Connection type
    /// </summary>
    [StringLength(50)]
    public string? ConnectionType { get; set; }

    /// <summary>
    /// Device memory (if available)
    /// </summary>
    public int? DeviceMemory { get; set; }

    /// <summary>
    /// Hardware concurrency (if available)
    /// </summary>
    public int? HardwareConcurrency { get; set; }

    /// <summary>
    /// Additional event data as JSON
    /// </summary>
    public string? Data { get; set; }
}