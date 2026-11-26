namespace StoryApp.Core.Dtos.Responses;

public class CurrentUserResponse
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}