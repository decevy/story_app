using System.Text.Json.Serialization;
using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos;

public class PassageDto
{
    public int Id { get; set; }
    public int Order { get; set; }

    [JsonPropertyName("seamBefore")]
    public Seam? SeamBefore { get; set; }

    public UserDto User { get; set; } = null!;
    public int StoryId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }
    public IList<PassageSegmentDto> Segments { get; set; } = [];

    public static PassageDto FromEntity(Passage passage) => new PassageDto
    {
        Id = passage.Id,
        Order = passage.Order,
        SeamBefore = passage.SeamBefore,
        User = UserDto.FromEntity(passage.User),
        StoryId = passage.StoryId,
        CreatedAt = passage.CreatedAt,
        EditedAt = passage.EditedAt,
        Segments = passage.Segments
            .OrderBy(s => s.Order)
            .Select(PassageSegmentDto.FromEntity)
            .ToList()
    };
}
