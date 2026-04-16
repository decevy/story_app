namespace StoryApp.Core.Dtos;

public class UserPresenceDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public bool IsOnline { get; set; }
    public bool IsTyping { get; set; }
}