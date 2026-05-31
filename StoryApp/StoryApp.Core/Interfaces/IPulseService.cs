using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;
using StoryApp.Core.Dtos.Responses;

namespace StoryApp.Core.Interfaces;

public interface IPulseService
{
    Task<List<PulseSummaryDto>> GetUserPulsesAsync(int userId);
    Task<PulseDto?> GetPulseAsync(int pulseId, int userId);
    Task<PulseDto> CreatePulseAsync(CreatePulseRequest request, int userId);
    Task<PulseDto> UpdatePulseAsync(int pulseId, UpdatePulseRequest request, int userId);
    Task DeletePulseAsync(int pulseId, int userId);

    Task AddPacerAsync(int pulseId, AddPacerRequest request, int userId);
    Task RemovePacerAsync(int pulseId, int userIdToRemove, int currentUserId);

    Task<PaginatedResponse<BeatDto>> GetPulseBeatsAsync(int pulseId, int userId, int page, int pageSize);

    Task<IEnumerable<PulseSummaryDto>> GetPublicPulsesAsync();
    Task JoinPulseAsync(int pulseId, int userId);
    Task LeavePulseAsync(int pulseId, int userId);
}
