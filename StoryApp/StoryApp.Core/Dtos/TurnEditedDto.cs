namespace StoryApp.Core.Dtos;

public class TurnEditedDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime EditedAt { get; set; }
}
