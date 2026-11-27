using StoryApp.Core.Dtos.Requests;
using StoryApp.Core.Dtos.Responses;

namespace StoryApp.Core.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> RegisterAsync(RegisterRequest request);
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RefreshTokenAsync(string refreshToken);
    Task RevokeTokenAsync(int userId);
    string GenerateJwtToken(int userId, string email, string username);
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}