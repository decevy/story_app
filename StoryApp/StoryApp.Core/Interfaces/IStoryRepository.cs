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

    WriterQueryBuilder QueryWriters();
    Task<Writer?> FindWriterAsync(int storyId, int userId);
    Task AddWriterAsync(Writer writer);
    Task RemoveWriterAsync(int storyId, int userId);
    Task<bool> IsUserMemberAsync(int storyId, int userId);
    Task<bool> IsUserStoryCreatorAsync(int storyId, int userId);
    Task<bool> ExistsAsync(int id);
}
