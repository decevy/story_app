namespace StoryApp.Core.Exceptions;

/// <summary>
/// Exception thrown when authentication is required but missing or invalid.
/// Maps to HTTP 401 Unauthorized (should really be called Unauthenticated).
/// </summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message)
    {
    }
}

