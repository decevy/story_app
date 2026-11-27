using StoryApp.Core.Entities;
using StoryApp.Core.QueryBuilders;

namespace StoryApp.Core.Interfaces;

public interface IPassageRepository
{
    PassageQueryBuilder Query();
    Task<Passage?> GetByIdAsync(int id);
    Task<Passage> CreateAsync(Passage passage);
    Task UpdateAsync(Passage passage);
    Task DeleteAsync(int id);
    Task<Passage?> GetLastPassageInStoryAsync(int storyId);
    Task<int> GetNextOrderAsync(int storyId);
}
