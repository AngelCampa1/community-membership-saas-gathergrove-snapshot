namespace GatherGrove.Domain.Exceptions;

/// <summary>
/// Exception thrown when a service is temporarily unavailable
/// </summary>
public class ServiceUnavailableException : Exception
{
    public ServiceUnavailableException() : base("Service is temporarily unavailable")
    {
    }

    public ServiceUnavailableException(string message) : base(message)
    {
    }

    public ServiceUnavailableException(string message, Exception innerException) : base(message, innerException)
    {
    }
}