using System.Text.Json.Serialization;

namespace StoryApp.Core.Dtos;

public class BeatEditedDto
{
    public int Id { get; set; }

    [JsonPropertyName("passage")]
    public string Passage { get; set; } = string.Empty;
    public DateTime EditedAt { get; set; }
}
