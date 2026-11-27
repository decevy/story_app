using System.ComponentModel.DataAnnotations;

namespace StoryApp.Core.Entities;

/// <summary>
/// A text fragment within a <see cref="Passage"/>; <see cref="SeamAfter"/> controls layout before the next segment. 
/// E.g. if the first segment has a seam of "Paragraph", the next segment will be rendered in a new paragraph.
/// </summary>
public class PassageSegment
{
    public int Id { get; set; }

    public int Order { get; set; }

    [Required]
    public string Text { get; set; } = string.Empty;

    public Seam? SeamAfter { get; set; }

    public int PassageId { get; set; }

    public Passage Passage { get; set; } = null!;
}
