using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos;

public class StoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPrivate { get; set; }
    public UserDto Creator { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public List<StoryMemberDto> Members { get; set; } = [];

    public static StoryDto FromEntity(Story story) => new StoryDto
    {
        Id = story.Id,
        Name = story.Name,
        Description = story.Description,
        IsPrivate = story.IsPrivate,
        Creator = UserDto.FromEntity(story.Creator),
        CreatedAt = story.CreatedAt,
        Members = [.. story.Members.Select(StoryMemberDto.FromEntity)]
    };
}
