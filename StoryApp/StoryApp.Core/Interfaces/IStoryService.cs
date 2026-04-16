using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;
using StoryApp.Core.Dtos.Responses;

namespace StoryApp.Core.Interfaces;

public interface IStoryService
{
    Task<List<StorySummaryDto>> GetUserStoriesAsync(int userId);
    Task<StoryDto?> GetStoryAsync(int storyId, int userId);
    Task<StoryDto> CreateStoryAsync(CreateStoryRequest request, int userId);
    Task<StoryDto> UpdateStoryAsync(int storyId, UpdateStoryRequest request, int userId);
    Task DeleteStoryAsync(int storyId, int userId);

    Task AddMemberAsync(int storyId, AddStoryMemberRequest request, int userId);
    Task RemoveMemberAsync(int storyId, int userIdToRemove, int currentUserId);

    Task<PaginatedResponse<TurnDto>> GetStoryTurnsAsync(int storyId, int userId, int page, int pageSize);

    Task<IEnumerable<StorySummaryDto>> GetPublicStoriesAsync();
    Task JoinStoryAsync(int storyId, int userId);
    Task LeaveStoryAsync(int storyId, int userId);
}
