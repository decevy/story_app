namespace StoryApp.Core.Dtos;

public class PassageEditedDto
{
    public int Id { get; set; }
    public DateTime EditedAt { get; set; }
    public IList<PassageSegmentDto> Segments { get; set; } = [];
}
