using StoryApp.Core.Entities;
using StoryApp.Core.QueryBuilders;

namespace StoryApp.Core.Interfaces;

public interface ITurnRepository
{
    TurnQueryBuilder Query();
    Task<Turn?> GetByIdAsync(int id);
    Task<Turn> CreateAsync(Turn turn);
    Task UpdateAsync(Turn turn);
    Task DeleteAsync(int id);

    Task<Turn?> GetLastTurnInStoryAsync(int storyId);
}
