using System.ComponentModel.DataAnnotations;

namespace StoryApp.Core.Entities;

public class Beat
{
    public int Id { get; set; }

    [Required]
    public string Passage { get; set; } = string.Empty;

    public int UserId { get; set; }
    public int PulseId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EditedAt { get; set; }

    public User User { get; set; } = null!;
    public Pulse Pulse { get; set; } = null!;
}
