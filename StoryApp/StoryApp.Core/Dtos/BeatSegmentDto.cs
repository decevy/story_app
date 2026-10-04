using System.Text.Json.Serialization;
using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos;

public class BeatSegmentDto
{
    public int Id { get; set; }
    public int Order { get; set; }
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("transitionAfter")]
    public BeatTransition? TransitionAfter { get; set; }

    public static BeatSegmentDto FromEntity(BeatSegment segment) => new()
    {
        Id = segment.Id,
        Order = segment.Order,
        Text = segment.Text,
        TransitionAfter = segment.TransitionAfter
    };

    public BeatSegment ToEntity() => new()
    {
        Order = Order,
        Text = Text,
        TransitionAfter = TransitionAfter
    };
}
