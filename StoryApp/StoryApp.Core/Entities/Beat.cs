namespace StoryApp.Core.Entities;

public class Beat
{
    public int Id { get; set; }

    public int Order { get; set; }

    public BeatTransition? TransitionOverride { get; set; }

    public int UserId { get; set; }
    public int PulseId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EditedAt { get; set; }

    public User User { get; set; } = null!;
    public Pulse Pulse { get; set; } = null!;
    public IList<BeatSegment> Segments { get; set; } = [];
}
