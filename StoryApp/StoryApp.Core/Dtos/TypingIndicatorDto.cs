namespace StoryApp.Core.Dtos;

public class TypingIndicatorDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int StoryId { get; set; }
    public bool IsTyping { get; set; }
}