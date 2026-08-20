using System.Text.Json;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GatherGrove.API.Middleware;

public class BillingAccessMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<BillingAccessMiddleware> _logger;

    private static readonly string[] AllowedPrefixes =
    {
        "/api/v1/auth",
        "/api/v1/billing",
        "/api/v1/health",
        "/api/auth",
        "/health"
    };

    public BillingAccessMiddleware(RequestDelegate next, ILogger<BillingAccessMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, GatherGroveDbContext dbContext)
    {
        var path = context.Request.Path.ToString();
        if (!context.Request.Path.StartsWithSegments("/api") ||
            IsAllowedPath(path) ||
            context.User?.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        var clubId = ExtractClubId(context);
        if (!clubId.HasValue)
        {
            await _next(context);
            return;
        }

        var club = await dbContext.Clubs.AsNoTracking().FirstOrDefaultAsync(c => c.Id == clubId.Value);
        if (club == null)
        {
            await _next(context);
            return;
        }

        var access = BillingAccessPolicy.Evaluate(club, DateTime.UtcNow);
        if (access.CanAccessApp)
        {
            await _next(context);
            return;
        }

        _logger.LogInformation("Blocked API access for club {ClubId} due to billing status {Status}",
            clubId.Value, club.SubscriptionStatus);

        context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
        context.Response.ContentType = "application/json";

        var response = new
        {
            code = "billing_required",
            error = "Your trial has ended. Add billing details to keep using GatherGrove.",
            statusCode = StatusCodes.Status402PaymentRequired,
            trialStatus = access.TrialStatus,
            requiresPaymentSetup = access.RequiresPaymentSetup,
            path
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }

    private static bool IsAllowedPath(string path)
    {
        return AllowedPrefixes.Any(prefix =>
            path.Equals(prefix, StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith(prefix + "/", StringComparison.OrdinalIgnoreCase));
    }

    private static int? ExtractClubId(HttpContext context)
    {
        var clubIdClaim = context.User.FindFirst("ClubId")?.Value;
        if (!string.IsNullOrWhiteSpace(clubIdClaim) && int.TryParse(clubIdClaim, out var claimClubId))
        {
            return claimClubId;
        }

        if (context.Request.RouteValues.TryGetValue("clubId", out var routeClubId) &&
            int.TryParse(routeClubId?.ToString(), out var routeClubIdValue))
        {
            return routeClubIdValue;
        }

        var pathSegments = context.Request.Path.Value?
            .Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (pathSegments is { Length: >= 4 } &&
            string.Equals(pathSegments[0], "api", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(pathSegments[2], "clubs", StringComparison.OrdinalIgnoreCase) &&
            int.TryParse(pathSegments[3], out var pathClubId))
        {
            return pathClubId;
        }

        if (context.Request.Query.TryGetValue("clubId", out var queryClubId) &&
            int.TryParse(queryClubId.FirstOrDefault(), out var queryClubIdValue))
        {
            return queryClubIdValue;
        }

        return null;
    }
}
