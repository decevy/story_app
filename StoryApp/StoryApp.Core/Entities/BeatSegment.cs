using System.ComponentModel.DataAnnotations;

namespace StoryApp.Core.Entities;

/// <summary>
/// A text fragment within a <see cref="Beat"/>; <see cref="TransitionAfter"/> controls layout before the next segment.
/// </summary>
public class BeatSegment
{
    public int Id { get; set; }

    public int Order { get; set; }

    [Required]
    public string Text { get; set; } = string.Empty;

    public BeatTransition? TransitionAfter { get; set; }

    public int BeatId { get; set; }

    public Beat Beat { get; set; } = null!;
}
