using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos;

public class PacerDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }

    public static PacerDto FromEntity(Pacer pacer) => new PacerDto
    {
        UserId = pacer.UserId,
        Username = pacer.User.Username,
        Email = pacer.User.Email,
        JoinedAt = pacer.JoinedAt
    };
}
