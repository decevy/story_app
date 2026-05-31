using System.Text.Json.Serialization;
using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos;

public class BeatDto
{
    public int Id { get; set; }

    [JsonPropertyName("passage")]
    public string Passage { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
    public int PulseId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }

    public static BeatDto FromEntity(Beat beat) => new BeatDto
    {
        Id = beat.Id,
        Passage = beat.Passage,
        User = UserDto.FromEntity(beat.User),
        PulseId = beat.PulseId,
        CreatedAt = beat.CreatedAt,
        EditedAt = beat.EditedAt
    };
}
