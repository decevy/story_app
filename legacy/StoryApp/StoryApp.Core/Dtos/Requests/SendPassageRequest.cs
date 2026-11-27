using System.ComponentModel.DataAnnotations;
using StoryApp.Core.Dtos;
using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos.Requests;

public class SendPassageRequest
{
    [Required]
    [MinLength(1)]
    public IList<PassageSegmentDto> Segments { get; set; } = [];

    [Required]
    public int StoryId { get; set; }

    public Seam? SeamBefore { get; set; }
}
