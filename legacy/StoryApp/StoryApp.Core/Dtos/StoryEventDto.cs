namespace StoryApp.Core.Dtos;

public class StoryEventDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int StoryId { get; set; }
    public DateTime Timestamp { get; set; }
}
