using StoryApp.Core.Dtos;

namespace StoryApp.Core.Interfaces;

public interface IPresenceService
{
    Task SetUserOnlineAsync(int userId, string connectionId);
    Task SetUserOfflineAsync(string connectionId);
    Task<IEnumerable<UserPresenceDto>> GetStoryPresenceAsync(int storyId);
    Task SetUserTypingAsync(int userId, int storyId, bool isTyping);
    Task<UserPresenceDto?> GetUserPresenceAsync(int userId);
}
