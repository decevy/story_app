namespace StoryApp.Core.Dtos;

public class TurnReactionDto
{
    public string Emoji { get; set; } = string.Empty;
    public List<UserDto> Users { get; set; } = new();
    public int Count { get; set; }
}
