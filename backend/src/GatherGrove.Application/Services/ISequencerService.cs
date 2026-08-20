using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services;

public interface ISequencerService
{
    Task EnrollMarketingLeadAsync(
        MarketingLead lead,
        CaptureLeadRequest request,
        CancellationToken cancellationToken = default);
}
