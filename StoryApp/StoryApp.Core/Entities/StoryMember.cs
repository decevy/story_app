namespace StoryApp.Core.Entities;

public class StoryMember
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int StoryId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public StoryRole Role { get; set; } = StoryRole.Member;

    // Navigation properties
    public User User { get; set; } = null!;
    public Story Story { get; set; } = null!;
}
