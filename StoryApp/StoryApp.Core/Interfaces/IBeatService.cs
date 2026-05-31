using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;

namespace StoryApp.Core.Interfaces;

public interface IBeatService
{
    Task<BeatDto?> GetBeatAsync(int id);
    Task<IEnumerable<BeatDto>> GetStoryBeatsAsync(int storyId, int page = 1, int pageSize = 50);
    Task<BeatDto> SendBeatAsync(SendBeatRequest request, int userId);
    Task<BeatDto> UpdateBeatAsync(int beatId, string passage, int userId);
    Task DeleteBeatAsync(int beatId, int userId);
}
