namespace StoryApp.Core.Entities;

/// <summary>
/// One author's contribution in a story, made of ordered <see cref="PassageSegment"/> rows.
/// </summary>
public class Passage
{
    public int Id { get; set; }

    public int Order { get; set; }

    public Seam? SeamBefore { get; set; }

    public int UserId { get; set; }
    public int StoryId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EditedAt { get; set; }

    public User User { get; set; } = null!;
    public Story Story { get; set; } = null!;
    public IList<PassageSegment> Segments { get; set; } = [];
}
