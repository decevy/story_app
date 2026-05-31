using System.Text.Json.Serialization;
using StoryApp.Core.Entities;
using StoryApp.Core.Extensions;

namespace StoryApp.Core.Dtos;

public class PulseSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPrivate { get; set; }
    public UserDto Creator { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("pacerCount")]
    public int PacerCount { get; set; }

    public BeatDto? LastBeat { get; set; }

    public static PulseSummaryDto FromEntity(Pulse pulse) => new PulseSummaryDto
    {
        Id = pulse.Id,
        Name = pulse.Name,
        Description = pulse.Description,
        IsPrivate = pulse.IsPrivate,
        Creator = UserDto.FromEntity(pulse.Creator),
        CreatedAt = pulse.CreatedAt,
        PacerCount = pulse.Pacers.Count,
        LastBeat = pulse.Beats
            .OrderByDescending(m => m.CreatedAt).FirstOrDefault()?
            .Transform(BeatDto.FromEntity)
    };
}
