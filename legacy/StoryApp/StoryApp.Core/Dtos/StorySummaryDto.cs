using System.Text.Json.Serialization;
using StoryApp.Core.Entities;
using StoryApp.Core.Extensions;

namespace StoryApp.Core.Dtos;

public class StorySummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPrivate { get; set; }
    public UserDto Creator { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("writerCount")]
    public int WriterCount { get; set; }

    public PassageDto? LastPassage { get; set; }

    public static StorySummaryDto FromEntity(Story story) => new StorySummaryDto
    {
        Id = story.Id,
        Name = story.Name,
        Description = story.Description,
        IsPrivate = story.IsPrivate,
        Creator = UserDto.FromEntity(story.Creator),
        CreatedAt = story.CreatedAt,
        WriterCount = story.Writers.Count,
        LastPassage = story.Passages
            .OrderByDescending(m => m.CreatedAt).FirstOrDefault()?
            .Transform(PassageDto.FromEntity)
    };
}
