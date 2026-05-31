using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace StoryApp.Core.Dtos.Requests;

public class SendBeatRequest
{
    [Required]
    [JsonPropertyName("passage")]
    public string Passage { get; set; } = string.Empty;

    [Required]
    public int PulseId { get; set; }
}
