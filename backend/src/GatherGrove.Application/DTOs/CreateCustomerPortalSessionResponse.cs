namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing a Stripe Customer Portal URL.
/// </summary>
public class CreateCustomerPortalSessionResponse
{
    /// <summary>
    /// Portal session URL to redirect the user to.
    /// </summary>
    public string Url { get; set; } = string.Empty;
}
