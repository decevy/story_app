using System.ComponentModel.DataAnnotations;
using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos.Requests;

public class SendTurnRequest
{
    [Required]
    public string Content { get; set; } = string.Empty;

    [Required]
    public int StoryId { get; set; }

    public TurnType Type { get; set; } = TurnType.Text;
}
