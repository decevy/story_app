using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;

namespace StoryApp.Core.Interfaces;

public interface ITurnService
{
    Task<TurnDto?> GetTurnAsync(int id);
    Task<IEnumerable<TurnDto>> GetStoryTurnsAsync(int storyId, int page = 1, int pageSize = 50);
    Task<TurnDto> SendTurnAsync(SendTurnRequest request, int userId);
    Task<TurnDto> UpdateTurnAsync(int turnId, string content, int userId);
    Task DeleteTurnAsync(int turnId, int userId);
    Task<TurnDto> AddReactionAsync(int turnId, string emoji, int userId);
    Task RemoveReactionAsync(int turnId, string emoji, int userId);
}
