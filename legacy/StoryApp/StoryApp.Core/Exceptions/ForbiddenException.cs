namespace StoryApp.Core.Exceptions;

/// <summary>
/// Exception thrown when a user is authenticated but doesn't have permission to perform an action.
/// Maps to HTTP 403 Forbidden.
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message)
    {
    }
}

