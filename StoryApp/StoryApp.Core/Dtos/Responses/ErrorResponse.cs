namespace StoryApp.Core.Dtos.Responses;

public class ErrorResponse(string error)
{
    public string Error { get; set; } = error;
}