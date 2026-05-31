using System.Text.Json.Serialization;
using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos;

public class PulseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPrivate { get; set; }
    public UserDto Creator { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("pacers")]
    public List<PacerDto> Pacers { get; set; } = [];

    public static PulseDto FromEntity(Pulse pulse) => new PulseDto
    {
        Id = pulse.Id,
        Name = pulse.Name,
        Description = pulse.Description,
        IsPrivate = pulse.IsPrivate,
        Creator = UserDto.FromEntity(pulse.Creator),
        CreatedAt = pulse.CreatedAt,
        Pacers = [.. pulse.Pacers.Select(PacerDto.FromEntity)]
    };
}
