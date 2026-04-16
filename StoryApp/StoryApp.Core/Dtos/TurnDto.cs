using StoryApp.Core.Entities;
using StoryApp.Core.Extensions;

namespace StoryApp.Core.Dtos;

public class TurnDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
    public int StoryId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public TurnType Type { get; set; }
    public List<TurnReactionDto> Reactions { get; set; } = [];

    public static TurnDto FromEntity(Turn turn) => new TurnDto
    {
        Id = turn.Id,
        Content = turn.Content,
        User = UserDto.FromEntity(turn.User),
        StoryId = turn.StoryId,
        CreatedAt = turn.CreatedAt,
        EditedAt = turn.EditedAt,
        AttachmentUrl = turn.AttachmentUrl,
        AttachmentFileName = turn.AttachmentFileName,
        Type = turn.Type
    };
}
