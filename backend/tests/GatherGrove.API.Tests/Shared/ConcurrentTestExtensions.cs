using Microsoft.AspNetCore.Mvc.Testing;
using System.Collections.Concurrent;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Extensions to help with concurrent test execution and resource management
/// </summary>
public static class ConcurrentTestExtensions
{
    private static readonly ConcurrentDictionary<string, object> _testLocks = new();

    /// <summary>
    /// Executes a test action with a named lock to prevent concurrent execution
    /// Useful for tests that modify shared state or external resources
    /// </summary>
    public static async Task WithTestLockAsync(this string lockName, Func<Task> testAction, int timeoutMs = 30000)
    {
        var lockObj = _testLocks.GetOrAdd(lockName, _ => new object());

        using var cts = new CancellationTokenSource(timeoutMs);
        var acquired = false;

        try
        {
            acquired = Monitor.TryEnter(lockObj, timeoutMs);
            if (!acquired)
            {
                throw new TimeoutException($"Failed to acquire test lock '{lockName}' within {timeoutMs}ms");
            }

            await testAction();
        }
        finally
        {
            if (acquired)
            {
                Monitor.Exit(lockObj);
            }
        }
    }

    /// <summary>
    /// Creates a client with isolation features to prevent test interference
    /// </summary>
    public static HttpClient CreateIsolatedClient<T>(this WebApplicationFactory<T> factory, string testName)
        where T : class
    {
        var client = factory.CreateClient();

        // Add test-specific headers for isolation
        client.DefaultRequestHeaders.Add("X-Test-Name", testName);
        client.DefaultRequestHeaders.Add("X-Test-Isolation", Guid.NewGuid().ToString());

        // Set reasonable timeouts
        client.Timeout = TimeSpan.FromSeconds(30);

        return client;
    }

    /// <summary>
    /// Retries a test action if it fails due to concurrent access issues
    /// </summary>
    public static async Task<T> WithRetryAsync<T>(Func<Task<T>> action, int maxRetries = 3, int delayMs = 1000)
    {
        Exception? lastException = null;

        for (int i = 0; i <= maxRetries; i++)
        {
            try
            {
                return await action();
            }
            catch (Exception ex) when (IsConcurrencyException(ex) && i < maxRetries)
            {
                lastException = ex;
                await Task.Delay(delayMs * (i + 1)); // Exponential backoff
            }
        }

        throw lastException ?? new InvalidOperationException("Retry failed without exception");
    }

    private static bool IsConcurrencyException(Exception ex)
    {
        return ex is TimeoutException ||
               ex.Message.Contains("timeout", StringComparison.OrdinalIgnoreCase) ||
               ex.Message.Contains("concurrent", StringComparison.OrdinalIgnoreCase) ||
               ex.Message.Contains("lock", StringComparison.OrdinalIgnoreCase);
    }
}