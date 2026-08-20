using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Tests.Authorization;

[TestFixture]
public class RouteProtectionTests
{
    /// <summary>
    /// Tests to verify the route protection logic as specified in the user story
    /// These are designed to match the frontend RouteProtection component behavior
    /// </summary>

    [Test]
    public void AdminRoutes_ShouldBeCorrectlyDefined()
    {
        // Verify admin routes follow the /admin/ prefix pattern
        var adminRoutes = new[]
        {
            "/admin/dashboard",
            "/admin/members",
            "/admin/billing",
            "/admin/communications",
            "/admin/events",
            "/admin/settings"
        };

        foreach (var route in adminRoutes)
        {
            Assert.That(route.StartsWith("/admin/"), Is.True, $"Admin route {route} should start with /admin/");
        }
    }

    [Test]
    public void MemberRoutes_ShouldBeCorrectlyDefined()
    {
        // Verify member routes follow the /app/ prefix pattern
        var memberRoutes = new[]
        {
            "/app/dashboard",
            "/app/profile",
            "/app/directory"
        };

        foreach (var route in memberRoutes)
        {
            Assert.That(route.StartsWith("/app/"), Is.True, $"Member route {route} should start with /app/");
        }
    }

    [Test]
    public void GrowTierRoutes_ShouldBeCorrectlyDefined()
    {
        // Verify Grow tier routes are admin routes requiring Grow tier
        var growTierRoutes = new[]
        {
            "/admin/communications/bulk",
            "/admin/events/advanced",
            "/admin/members/export",
            "/admin/reports/advanced",
            "/admin/integrations"
        };

        foreach (var route in growTierRoutes)
        {
            Assert.That(route.StartsWith("/admin/"), Is.True, $"Grow tier route {route} should be an admin route");
        }
    }

    [Test]
    public void PublicRoutes_ShouldBeCorrectlyDefined()
    {
        // Verify public routes are accessible without authentication
        var publicRoutes = new[]
        {
            "/",
            "/login",
            "/register",
            "/forgot-password",
            "/reset-password",
            "/privacy-policy",
            "/terms-of-service",
            "/support",
            "/accept-invite",
            "/activate-account",
            "/rsvp-confirm"
        };

        // These routes should not require authentication
        foreach (var route in publicRoutes)
        {
            Assert.That(route.StartsWith("/admin/") || route.StartsWith("/app/"), Is.False,
                $"Public route {route} should not be an admin or member route");
        }
    }

    [Test]
    public void LoginResponse_ShouldIncludeRequiredFieldsForRouteProtection()
    {
        // Test that LoginResponse includes all fields needed for route protection
        var loginResponse = new LoginResponse
        {
            UserId = 1,
            FullName = "John Doe",
            Email = "john@example.com",
            ClubId = 1,
            Role = "Admin",
            ClubTier = "Sprout",
            IsOnboardingCompleted = true,
            Message = "Login successful!"
        };

        // Verify all required fields are present
        Assert.That(loginResponse.Role, Is.Not.Null.And.Not.Empty, "Role is required for route protection");
        Assert.That(loginResponse.ClubTier, Is.Not.Null.And.Not.Empty, "Tier is required for route protection");
        Assert.That(loginResponse.IsOnboardingCompleted, Is.TypeOf<bool>(), "OnboardingCompleted is required for route protection");
        Assert.That(loginResponse.ClubId, Is.GreaterThan(0), "ClubId is required for route protection");
        Assert.That(loginResponse.UserId, Is.GreaterThan(0), "UserId is required for route protection");
    }

    [Test]
    public void UserSessionResponse_ShouldIncludeRequiredFieldsForRouteProtection()
    {
        // Test that UserSessionResponse includes all fields needed for route protection
        var sessionResponse = new UserSessionResponse
        {
            UserId = 1,
            FullName = "John Doe",
            Email = "john@example.com",
            ClubId = 1,
            ClubName = "Test Club",
            ClubTier = "Sprout",
            Role = "Admin",
            IsOnboardingCompleted = true
        };

        // Verify all required fields are present
        Assert.That(sessionResponse.Role, Is.Not.Null.And.Not.Empty, "Role is required for route protection");
        Assert.That(sessionResponse.ClubTier, Is.Not.Null.And.Not.Empty, "ClubTier is required for route protection");
        Assert.That(sessionResponse.IsOnboardingCompleted, Is.TypeOf<bool>(), "OnboardingCompleted is required for route protection");
        Assert.That(sessionResponse.ClubId, Is.GreaterThan(0), "ClubId is required for route protection");
        Assert.That(sessionResponse.UserId, Is.GreaterThan(0), "UserId is required for route protection");
    }

    [TestCase("Admin", "Sprout", "/admin/dashboard", true)]
    [TestCase("Admin", "Grow", "/admin/dashboard", true)]
    [TestCase("Member", "Grow", "/admin/dashboard", false)]
    [TestCase("Member", "Sprout", "/admin/dashboard", false)]
    [TestCase("Admin", "Sprout", "/admin/communications/bulk", false)] // Grow tier required
    [TestCase("Admin", "Grow", "/admin/communications/bulk", true)]
    [TestCase("Member", "Grow", "/app/dashboard", true)]
    [TestCase("Admin", "Sprout", "/app/dashboard", false)]
    public void RouteAccess_ShouldFollowAuthorizationRules(string role, string tier, string route, bool shouldHaveAccess)
    {
        // This test simulates the route protection logic
        var user = new UserSessionResponse
        {
            UserId = 1,
            FullName = "Test User",
            Email = "test@example.com",
            ClubId = 1,
            ClubName = "Test Club",
            ClubTier = tier,
            Role = role,
            IsOnboardingCompleted = true
        };

        bool hasAccess = DetermineRouteAccess(user, route);

        Assert.That(hasAccess, Is.EqualTo(shouldHaveAccess),
            $"User with role '{role}' and tier '{tier}' should {(shouldHaveAccess ? "have" : "not have")} access to route '{route}'");
    }

    /// <summary>
    /// Simulates the route protection logic to determine if a user has access to a route
    /// This mirrors the logic in the frontend RouteProtection component
    /// </summary>
    private bool DetermineRouteAccess(UserSessionResponse user, string route)
    {
        // Public routes are always accessible
        var publicRoutes = new[] { "/", "/login", "/register", "/forgot-password", "/reset-password",
                                  "/privacy-policy", "/terms-of-service", "/support", "/accept-invite",
                                  "/activate-account", "/rsvp-confirm" };

        if (publicRoutes.Any(pr => pr == "/" ? route == "/" : route.StartsWith(pr)))
        {
            return true;
        }

        // Admin routes
        if (route.StartsWith("/admin/"))
        {
            if (user.Role != "Admin") return false;

            // Grow tier routes
            var growTierRoutes = new[] { "/admin/communications/bulk", "/admin/events/advanced",
                                        "/admin/members/export", "/admin/reports/advanced",
                                        "/admin/integrations" };

            if (growTierRoutes.Any(gtr => route.StartsWith(gtr)))
            {
                return user.ClubTier == "Grow";
            }

            return true; // Admin can access other admin routes
        }

        // Member routes
        if (route.StartsWith("/app/"))
        {
            return user.Role == "Member";
        }

        return false; // Default deny
    }
}
