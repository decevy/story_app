using System.ComponentModel.DataAnnotations;

namespace StoryApp.Core.Entities;

public class Turn
{
    public int Id { get; set; }

    [Required]
    public string Content { get; set; } = string.Empty;

    public int UserId { get; set; }
    public int StoryId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EditedAt { get; set; }

    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public TurnType Type { get; set; } = TurnType.Text;

    // Navigation properties
    public User User { get; set; } = null!;
    public Story Story { get; set; } = null!;
    public ICollection<TurnReaction> Reactions { get; set; } = [];
}
