namespace StoryApp.Core.Exceptions;

/// <summary>
/// Exception thrown when a request is invalid or malformed.
/// Maps to HTTP 400 Bad Request.
/// </summary>
public class BadRequestException : Exception
{
    public BadRequestException(string message) : base(message)
    {
    }
}

