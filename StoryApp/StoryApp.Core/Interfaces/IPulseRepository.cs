using StoryApp.Core.Entities;
using StoryApp.Core.QueryBuilders;

namespace StoryApp.Core.Interfaces;

public interface IPulseRepository
{
    PulseQueryBuilder Query();
    Task<Pulse> GetByIdAsync(int id);
    Task<Pulse?> FindByIdAsync(int id);
    Task<Pulse> CreateAsync(Pulse pulse);
    Task UpdateAsync(Pulse pulse);
    Task DeleteAsync(int id);

    PacerQueryBuilder QueryPacers();
    Task<Pacer?> FindPacerAsync(int pulseId, int userId);
    Task AddPacerAsync(Pacer pacer);
    Task RemovePacerAsync(int pulseId, int userId);
    Task<bool> IsUserMemberAsync(int pulseId, int userId);
    Task<bool> IsUserPulseCreatorAsync(int pulseId, int userId);
    Task<bool> ExistsAsync(int id);
}
