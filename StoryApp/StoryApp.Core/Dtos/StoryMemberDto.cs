using StoryApp.Core.Entities;

namespace StoryApp.Core.Dtos;

public class StoryMemberDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }

    public static StoryMemberDto FromEntity(StoryMember member) => new StoryMemberDto
    {
        UserId = member.UserId,
        Username = member.User.Username,
        Email = member.User.Email,
        Role = member.Role.ToString(),
        JoinedAt = member.JoinedAt
    };
}
