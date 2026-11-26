using System.ComponentModel.DataAnnotations;

namespace StoryApp.Core.Dtos.Requests;

public class UpdateStoryRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }
}
