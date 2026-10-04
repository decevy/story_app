namespace StoryApp.Core.Entities;

/// <summary>
/// Membership row linking a <see cref="User"/> to a <see cref="Pulse"/> they can view and write in.
/// </summary>
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
