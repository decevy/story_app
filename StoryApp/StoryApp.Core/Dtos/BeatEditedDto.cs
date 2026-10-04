namespace StoryApp.Core.Dtos;

public class BeatEditedDto
{
    public int Id { get; set; }
    public DateTime EditedAt { get; set; }
    public IList<BeatSegmentDto> Segments { get; set; } = [];
}
