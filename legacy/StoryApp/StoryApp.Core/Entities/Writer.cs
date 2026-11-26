namespace StoryApp.Core.Entities;

/// <summary>
/// Membership row linking a <see cref="User"/> to a <see cref="Story"/> they can view and write in.
/// </summary>
public class Writer
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int StoryId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public Story Story { get; set; } = null!;
}
