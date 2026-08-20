using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Base class for controller tests that uses shared application factory
/// This avoids the overhead of creating new application instances for each test class
/// </summary>
[TestFixture]
public abstract class BaseControllerTest
{
    protected WebApplicationFactory<Program> Factory => SharedTestFixture.Factory ??
        throw new InvalidOperationException("SharedTestFixture not initialized");

    protected HttpClient Client => SharedTestFixture.Client ??
        throw new InvalidOperationException("SharedTestFixture not initialized");

    /// <summary>
    /// Get a fresh database context for each test to ensure isolation
    /// </summary>
    protected GatherGroveDbContext GetDbContext()
    {
        using var scope = Factory.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();
    }

    /// <summary>
    /// Helper method to create HTTP content from object
    /// </summary>
    protected static StringContent CreateJsonContent(object obj)
    {
        var json = JsonSerializer.Serialize(obj, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    /// <summary>
    /// Helper method to deserialize HTTP response content
    /// </summary>
    protected static async Task<T?> DeserializeResponse<T>(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }

    [SetUp]
    public virtual void SetUp()
    {
        // Individual test setup - database is already isolated via in-memory with unique names
    }

    [TearDown]
    public virtual void TearDown()
    {
        // Individual test cleanup
    }
}