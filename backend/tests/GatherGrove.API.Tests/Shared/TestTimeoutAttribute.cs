using NUnit.Framework;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Test timeout attribute to ensure tests complete within reasonable time limits
/// Helps prevent hanging tests that can cause test suite failures
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class TestTimeoutAttribute : TimeoutAttribute
{
    public TestTimeoutAttribute() : base(30000) // Default 30 seconds
    {
    }

    public TestTimeoutAttribute(int milliseconds) : base(milliseconds)
    {
    }
}