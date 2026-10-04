using System.Text.Json.Serialization;
using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos;

public class BeatDto
{
    public int Id { get; set; }
    public int Order { get; set; }

    [JsonPropertyName("transitionOverride")]
    public BeatTransition? TransitionOverride { get; set; }

    public UserDto User { get; set; } = null!;
    public int PulseId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }
    public IList<BeatSegmentDto> Segments { get; set; } = [];

    public static BeatDto FromEntity(Beat beat) => new BeatDto
    {
        Id = beat.Id,
        Order = beat.Order,
        TransitionOverride = beat.TransitionOverride,
        User = UserDto.FromEntity(beat.User),
        PulseId = beat.PulseId,
        CreatedAt = beat.CreatedAt,
        EditedAt = beat.EditedAt,
        Segments = beat.Segments
            .OrderBy(s => s.Order)
            .Select(BeatSegmentDto.FromEntity)
            .ToList()
    };
}
