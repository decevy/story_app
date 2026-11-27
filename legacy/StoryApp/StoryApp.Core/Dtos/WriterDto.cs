using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos;

public class WriterDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }

    public static WriterDto FromEntity(Writer writer) => new WriterDto
    {
        UserId = writer.UserId,
        Username = writer.User.Username,
        Email = writer.User.Email,
        JoinedAt = writer.JoinedAt
    };
}
