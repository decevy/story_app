using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;
using StoryApp.Core.Exceptions;
using StoryApp.Core.Interfaces;

namespace StoryApp.Services;

public class UserService(IUserRepository userRepository) : IUserService
{
    public async Task<UserDto?> GetUserAsync(int id)
    {
        var user = await userRepository.FindByIdAsync(id);
        return user != null ? UserDto.FromEntity(user) : null;
    }

    public async Task<IEnumerable<UserDto>> GetUsersAsync()
    {
        var users = await userRepository.GetAllAsync();
        return users.Select(UserDto.FromEntity);
    }

    public async Task<IEnumerable<UserDto>> SearchUsersAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return Enumerable.Empty<UserDto>();

        var users = await userRepository.SearchUsersAsync(query);
        return users.Select(UserDto.FromEntity);
    }

    public async Task<UserDto> UpdateUserAsync(int userId, UpdateUserRequest request)
    {
        var user = await userRepository.FindByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        // Check if new username is taken by another user
        if (!string.IsNullOrWhiteSpace(request.Username) && request.Username != user.Username)
        {
            if (await userRepository.IsUsernameTakenAsync(request.Username))
                throw new BadRequestException("Username already taken");
            
            user.Username = request.Username;
        }

        // Check if new email is taken by another user
        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != user.Email)
        {
            if (await userRepository.IsEmailTakenAsync(request.Email))
                throw new BadRequestException("Email already taken");
            
            user.Email = request.Email;
        }

        await userRepository.UpdateAsync(user);
        
        return UserDto.FromEntity(user);
    }

    public async Task UpdateUserPresenceAsync(int userId, bool isOnline)
    {
        var user = await userRepository.FindByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        user.IsOnline = isOnline;
        user.LastSeen = DateTime.UtcNow;
        
        await userRepository.UpdateAsync(user);
    }
}