using StoryApp.Core.Entities;
using StoryApp.Core.QueryBuilders;

namespace StoryApp.Core.Interfaces;

public interface IBeatRepository
{
    BeatQueryBuilder Query();
    Task<Beat?> GetByIdAsync(int id);
    Task<Beat> CreateAsync(Beat beat);
    Task UpdateAsync(Beat beat);
    Task DeleteAsync(int id);
    Task<Beat?> GetLastBeatInPulseAsync(int pulseId);
}
