namespace StoryApp.Core.Dtos;

public class UserStatusChangedDto
{
    public int UserId { get; set; }
    public bool IsOnline { get; set; }
    public DateTime LastSeen { get; set; }
}