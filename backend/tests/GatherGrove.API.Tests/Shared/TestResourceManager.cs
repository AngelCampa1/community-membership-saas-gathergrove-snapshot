using System.Collections.Concurrent;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Manages shared test resources to prevent conflicts and resource exhaustion
/// during concurrent test execution
/// </summary>
public static class TestResourceManager
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _resourceSemaphores = new();
    private static readonly ConcurrentDictionary<string, DateTime> _lastUsed = new();

    /// <summary>
    /// Acquires a resource lock to prevent concurrent access to shared resources
    /// </summary>
    /// <param name="resourceName">Name of the resource (e.g., "database", "external-api")</param>
    /// <param name="maxConcurrency">Maximum number of concurrent accessors</param>
    /// <param name="timeout">Timeout in milliseconds</param>
    /// <returns>Disposable lock that should be used with 'using' statement</returns>
    public static async Task<IDisposable> AcquireResourceLockAsync(string resourceName, int maxConcurrency = 1, int timeout = 10000)
    {
        var semaphore = _resourceSemaphores.GetOrAdd(resourceName, _ => new SemaphoreSlim(maxConcurrency, maxConcurrency));

        var acquired = await semaphore.WaitAsync(timeout);
        if (!acquired)
        {
            throw new TimeoutException($"Failed to acquire resource lock for '{resourceName}' within {timeout}ms");
        }

        _lastUsed[resourceName] = DateTime.UtcNow;

        return new ResourceLock(semaphore, resourceName);
    }

    /// <summary>
    /// Cleans up unused resources to prevent memory leaks during long test runs
    /// </summary>
    public static void CleanupUnusedResources(TimeSpan maxAge)
    {
        var cutoff = DateTime.UtcNow - maxAge;
        var keysToRemove = _lastUsed
            .Where(kvp => kvp.Value < cutoff)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var key in keysToRemove)
        {
            if (_resourceSemaphores.TryRemove(key, out var semaphore))
            {
                semaphore?.Dispose();
            }
            _lastUsed.TryRemove(key, out _);
        }
    }

    private class ResourceLock : IDisposable
    {
        private readonly SemaphoreSlim _semaphore;
        private readonly string _resourceName;
        private bool _disposed;

        public ResourceLock(SemaphoreSlim semaphore, string resourceName)
        {
            _semaphore = semaphore;
            _resourceName = resourceName;
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _semaphore.Release();
                _disposed = true;
            }
        }
    }
}