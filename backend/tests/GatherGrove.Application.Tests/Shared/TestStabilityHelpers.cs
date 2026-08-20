using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Shared;

/// <summary>
/// Helper methods to improve test stability and prevent host process crashes
/// </summary>
public static class TestStabilityHelpers
{
    /// <summary>
    /// Creates a stable in-memory database context with optimized settings
    /// </summary>
    public static GatherGroveDbContext CreateStableTestContext()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid():N}")
            .EnableSensitiveDataLogging(false)
            .EnableDetailedErrors(false)
            .ConfigureWarnings(warnings => warnings.Ignore())
            .Options;

        var context = new GatherGroveDbContext(options);

        // Ensure clean initialization
        context.Database.EnsureCreated();

        return context;
    }

    /// <summary>
    /// Safely disposes context with proper cleanup
    /// </summary>
    public static void SafeDisposeContext(GatherGroveDbContext context)
    {
        if (context == null) return;

        try
        {
            context.ChangeTracker.Clear();
            context.Database.EnsureDeleted();
            context.Dispose();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Context disposal warning: {ex.Message}");
            // Continue with disposal process
        }
        finally
        {
            // Force memory cleanup
            GC.Collect();
        }
    }

    /// <summary>
    /// Executes a test action with memory monitoring and cleanup
    /// </summary>
    public static async Task<T> ExecuteWithStabilityMonitoring<T>(Func<Task<T>> testAction)
    {
        var initialMemory = GC.GetTotalMemory(false);

        try
        {
            var result = await testAction();
            return result;
        }
        finally
        {
            // Force cleanup after test
            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            var finalMemory = GC.GetTotalMemory(true);
            var memoryIncrease = finalMemory - initialMemory;

            // Log memory usage if significant increase
            if (memoryIncrease > 50 * 1024 * 1024) // 50MB threshold
            {
                Debug.WriteLine($"High memory usage detected: {memoryIncrease / 1024 / 1024}MB increase");
            }
        }
    }

    /// <summary>
    /// Validates host process health during test execution
    /// </summary>
    public static void ValidateHostProcessHealth()
    {
        try
        {
            var process = Process.GetCurrentProcess();
            var workingSet = process.WorkingSet64;
            var privateMemory = process.PrivateMemorySize64;

            // Check for memory thresholds that could indicate issues
            const long maxWorkingSet = 2L * 1024 * 1024 * 1024; // 2GB
            const long maxPrivateMemory = 1L * 1024 * 1024 * 1024; // 1GB

            if (workingSet > maxWorkingSet)
            {
                Debug.WriteLine($"Warning: High working set memory: {workingSet / 1024 / 1024}MB");
                // Force aggressive cleanup
                GC.Collect(2, GCCollectionMode.Forced, true);
            }

            if (privateMemory > maxPrivateMemory)
            {
                Debug.WriteLine($"Warning: High private memory: {privateMemory / 1024 / 1024}MB");
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Host process health check failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Limits concurrent operations to prevent resource exhaustion
    /// </summary>
    public static async Task<T[]> ExecuteConcurrentlyWithLimit<T>(
        IEnumerable<Func<Task<T>>> operations,
        int maxConcurrency = 3)
    {
        var semaphore = new SemaphoreSlim(maxConcurrency, maxConcurrency);
        var tasks = operations.Select(async operation =>
        {
            await semaphore.WaitAsync();
            try
            {
                return await operation();
            }
            finally
            {
                semaphore.Release();
            }
        });

        return await Task.WhenAll(tasks);
    }
}