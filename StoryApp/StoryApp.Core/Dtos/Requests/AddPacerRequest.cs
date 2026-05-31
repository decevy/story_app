using System.ComponentModel.DataAnnotations;

namespace StoryApp.Core.Dtos.Requests;

public class AddPacerRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid user ID")]
    public int UserId { get; set; }
}
