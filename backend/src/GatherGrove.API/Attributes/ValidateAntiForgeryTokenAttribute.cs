using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace GatherGrove.API.Attributes;

/// <summary>
/// Custom anti-forgery token validation attribute for state-changing operations
/// </summary>
public class ValidateAntiForgeryTokenAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var request = context.HttpContext.Request;

        // Skip validation for mobile clients (they use different authentication)
        if (request.Headers.ContainsKey("X-Mobile-Client"))
        {
            return;
        }

        // For web clients, validate CSRF token
        var token = request.Headers["X-CSRF-Token"].FirstOrDefault() ??
                   request.Form["__RequestVerificationToken"].FirstOrDefault();

        if (string.IsNullOrEmpty(token))
        {
            context.Result = new BadRequestObjectResult(new { message = "CSRF token is required" });
            return;
        }

        // In a full implementation, you would validate the token against a stored value
        // For now, we just check that it exists and is not empty
        if (token.Length < 10)
        {
            context.Result = new BadRequestObjectResult(new { message = "Invalid CSRF token" });
            return;
        }

        base.OnActionExecuting(context);
    }
}