using GatherGrove.API.Tests.Shared;
using NUnit.Framework;
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;

namespace GatherGrove.API.Tests.Integration;

/// <summary>
/// Regression tests for CSRF protection middleware
/// Ensures CSRF bypass works correctly in Testing environment and prevents flaky test failures
/// </summary>
[TestFixture]
public class CSRFProtectionTests : IntegrationTestBase
{
    [Test]
    public async Task TestingEnvironment_BypassesCSRF_ForEventPaymentsEndpoint()
    {
        // Arrange - Create authenticated client without CSRF token
        var client = CreateAuthenticatedClient("1", "1", "Admin");

        // Act - POST to event-payments endpoint without CSRF token
        // This would fail with 403 Forbidden if CSRF bypass isn't working
        var response = await client.PostAsJsonAsync("/api/v1/event-payments", new
        {
            EventId = 999,
            PaymentMethodId = "pm_test",
            MemberId = 1
        });

        // Assert - Should NOT return CSRF error (may return NotFound or other app error, but not CSRF 403)
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotContain("CSRF token validation failed",
            "CSRF protection should be bypassed in Testing environment");

        // Verify we get application-level error, not CSRF middleware error
        if (response.StatusCode == HttpStatusCode.Forbidden)
        {
            Assert.Fail($"Received 403 Forbidden which suggests CSRF protection is NOT bypassed. Response: {content}");
        }
    }

    [Test]
    public async Task EventPaymentsEndpoint_IsInCSRFSkipList()
    {
        // Arrange
        var client = CreateAuthenticatedClient("1", "1", "Admin");

        // Act - POST without CSRF token to verify skip list includes event-payments
        var response = await client.PostAsJsonAsync("/api/v1/event-payments", new
        {
            EventId = 999,
            PaymentMethodId = "pm_test_skip_list",
            MemberId = 1
        });

        // Assert - Endpoint should be in skip list, no CSRF error
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotContain("CSRF token validation failed",
            "/api/v1/event-payments should be in CSRF skip list");
        content.Should().NotContain("Invalid or missing CSRF token",
            "/api/v1/event-payments should be in CSRF skip list");
    }

    [Test]
    public async Task CSRFProtection_DoesNotBlockAuthenticatedRequests_InTestEnvironment()
    {
        // Arrange - Test multiple endpoints that should bypass CSRF
        var client = CreateAuthenticatedClient("1", "1", "Admin");

        // Act & Assert - All these endpoints should work without CSRF tokens in test environment
        var authEndpoints = new (string endpoint, object payload)[]
        {
            ("/api/v1/auth/logout", new { }),
            ("/api/v1/users/profile", new { fullName = "Test User", email = "test@test.com" })
        };

        foreach (var (endpoint, payload) in authEndpoints)
        {
            var response = await client.PostAsJsonAsync(endpoint, payload);
            var content = await response.Content.ReadAsStringAsync();

            content.Should().NotContain("CSRF token validation failed",
                $"Endpoint {endpoint} should not require CSRF in Testing environment");
        }
    }

    [Test]
    public async Task CSRFMiddleware_PreservesCorrectErrorCodes_ForNonCSRFErrors()
    {
        // Arrange
        var client = CreateAuthenticatedClient("1", "1", "Admin");

        // Act - Request with invalid data (should return NotFound, not CSRF error)
        var response = await client.PostAsJsonAsync("/api/v1/event-payments", new
        {
            EventId = 99999, // Non-existent event
            PaymentMethodId = "pm_test",
            MemberId = 1
        });

        // Assert - Should return NotFound (404), not Forbidden (403) from CSRF
        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
            "CSRF middleware should not interfere with application error codes");

        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotContain("CSRF token validation failed");
    }
}
