using StoryApp.Core.Entities;
using StoryApp.Core.QueryBuilders;

namespace StoryApp.Core.Interfaces;

public interface IStoryRepository
{
    StoryQueryBuilder Query();
    Task<Story> GetByIdAsync(int id);
    Task<Story?> FindByIdAsync(int id);
    Task<Story> CreateAsync(Story story);
    Task UpdateAsync(Story story);
    Task DeleteAsync(int id);

    StoryMemberQueryBuilder QueryStoryMembers();
    Task<StoryMember?> FindStoryMemberAsync(int storyId, int userId);
    Task AddStoryMemberAsync(StoryMember member);
    Task RemoveStoryMemberAsync(int storyId, int userId);
    Task<bool> IsUserMemberAsync(int storyId, int userId);
    Task<bool> IsUserStoryAdminAsync(int storyId, int userId);
    Task<bool> ExistsAsync(int id);
}
