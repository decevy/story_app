namespace StoryApp.Core.Dtos.Responses;

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public required UserDto User { get; set; }
}