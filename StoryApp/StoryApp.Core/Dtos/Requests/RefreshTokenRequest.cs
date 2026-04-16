using System.ComponentModel.DataAnnotations;

namespace StoryApp.Core.Dtos.Requests;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}