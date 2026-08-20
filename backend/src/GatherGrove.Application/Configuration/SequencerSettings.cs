namespace GatherGrove.Application.Configuration;

/// <summary>
/// Configuration for the Ventora Sequencer product API.
/// </summary>
public class SequencerSettings
{
    public string BaseUrl { get; set; } = "https://sequencer.ventoralabs.com";

    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string MarketingNurtureSequenceSlug { get; set; } = "gathergrove-nurture-value-1";
}
