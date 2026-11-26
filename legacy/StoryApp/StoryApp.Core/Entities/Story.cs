using System.ComponentModel.DataAnnotations;

namespace StoryApp.Core.Entities;

/// <summary>
/// Collaborative story thread: metadata, creator, <see cref="Passage"/> history, and <see cref="Writer"/> memberships.
/// </summary>
public class Story
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public bool IsPrivate { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Creator { get; set; } = null!;
    public ICollection<Passage> Passages { get; set; } = [];
    public ICollection<Writer> Writers { get; set; } = [];
}
