using System.ComponentModel.DataAnnotations;

namespace StoryApp.Core.Entities;

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
    public ICollection<Turn> Turns { get; set; } = [];
    public ICollection<StoryMember> Members { get; set; } = [];
}
