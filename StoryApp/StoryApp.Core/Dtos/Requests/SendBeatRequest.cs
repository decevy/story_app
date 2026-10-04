using System.ComponentModel.DataAnnotations;
using StoryApp.Core.Dtos;
using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos.Requests;

public class SendBeatRequest
{
    [Required]
    [MinLength(1)]
    public IList<BeatSegmentDto> Segments { get; set; } = [];

    [Required]
    public int PulseId { get; set; }

    public BeatTransition? TransitionOverride { get; set; }
}
