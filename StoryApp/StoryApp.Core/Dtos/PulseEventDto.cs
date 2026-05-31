namespace StoryApp.Core.Dtos;

public class PulseEventDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int PulseId { get; set; }
    public DateTime Timestamp { get; set; }
}
