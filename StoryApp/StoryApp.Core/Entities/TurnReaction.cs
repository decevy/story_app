namespace StoryApp.Core.Entities;

public class TurnReaction
{
    public int Id { get; set; }
    public int TurnId { get; set; }
    public int UserId { get; set; }
    public string Emoji { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Turn Turn { get; set; } = null!;
    public User User { get; set; } = null!;
}
