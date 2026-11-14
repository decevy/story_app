using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;

namespace StoryApp.Core.Interfaces;

public interface IPassageService
{
    Task<PassageDto?> GetPassageAsync(int id);
    Task<IEnumerable<PassageDto>> GetStoryPassagesAsync(int storyId, int page = 1, int pageSize = 50);
    Task<PassageDto> SendPassageAsync(SendPassageRequest request, int userId);
    Task<PassageDto> UpdatePassageAsync(int passageId, IList<PassageSegmentDto> segments, int userId);
    Task DeletePassageAsync(int passageId, int userId);
}
