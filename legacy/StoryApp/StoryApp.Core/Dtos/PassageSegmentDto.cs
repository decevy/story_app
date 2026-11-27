using System.Text.Json.Serialization;
using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos;

public class PassageSegmentDto
{
    public int Id { get; set; }
    public int Order { get; set; }
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("seamAfter")]
    public Seam? SeamAfter { get; set; }

    public static PassageSegmentDto FromEntity(PassageSegment segment) => new()
    {
        Id = segment.Id,
        Order = segment.Order,
        Text = segment.Text,
        SeamAfter = segment.SeamAfter
    };

    public PassageSegment ToEntity() => new()
    {
        Order = Order,
        Text = Text,
        SeamAfter = SeamAfter
    };
}
