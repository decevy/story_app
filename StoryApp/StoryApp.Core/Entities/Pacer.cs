namespace StoryApp.Core.Entities;

public class Pacer
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int PulseId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public Pulse Pulse { get; set; } = null!;
}
