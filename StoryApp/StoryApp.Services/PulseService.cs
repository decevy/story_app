using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;
using StoryApp.Core.Dtos.Responses;
using StoryApp.Core.Entities;
using StoryApp.Core.Exceptions;
using StoryApp.Core.Extensions;
using StoryApp.Core.Interfaces;

namespace StoryApp.Services;

public class PulseService(
    IPulseRepository pulseRepository,
    IBeatRepository beatRepository,
    IUserRepository userRepository) : IPulseService
{
    public async Task<List<PulseSummaryDto>> GetUserPulsesAsync(int userId)
    {
        var pulses = await pulseRepository.Query()
            .WithCreator()
            .WithPacers()
            .WhereUserIsMember(userId)
            .ToListAsync();

        var pulseDtos = new List<PulseSummaryDto>();
        foreach (var pulse in pulses)
        {
            var lastBeat = await beatRepository.GetLastBeatInPulseAsync(pulse.Id);
            if (lastBeat != null)
                pulse.Beats.Add(lastBeat);
            var pulseDto = PulseSummaryDto.FromEntity(pulse);
            pulseDtos.Add(pulseDto);
        }

        return pulseDtos;
    }

    public async Task<PulseDto?> GetPulseAsync(int pulseId, int userId)
    {
        if (!await pulseRepository.IsUserMemberAsync(pulseId, userId))
            throw new ForbiddenException("User is not a collaborator on this pulse");

        var pulse = await pulseRepository.Query()
            .WithCreator()
            .WithPacers(includeUsers: true)
            .FindByIdAsync(pulseId);

        return pulse?.Transform(PulseDto.FromEntity);
    }

    public async Task<PulseDto> CreatePulseAsync(CreatePulseRequest request, int userId)
    {
        var user = await userRepository.FindByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        var pulse = new Pulse
        {
            Name = request.Name,
            Description = request.Description,
            IsPrivate = request.IsPrivate,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            Creator = user
        };
        pulse = await pulseRepository.CreateAsync(pulse);

        var pacer = new Pacer
        {
            UserId = userId,
            PulseId = pulse.Id,
            JoinedAt = DateTime.UtcNow
        };
        await pulseRepository.AddPacerAsync(pacer);

        var loaded = await pulseRepository.Query()
            .WithCreator()
            .WithPacers(includeUsers: true)
            .GetByIdAsync(pulse.Id);

        return PulseDto.FromEntity(loaded);
    }

    public async Task<PulseDto> UpdatePulseAsync(int pulseId, UpdatePulseRequest request, int userId)
    {
        if (!await pulseRepository.IsUserPulseCreatorAsync(pulseId, userId))
            throw new ForbiddenException("Only the pulse creator can edit this pulse");

        var pulse = await pulseRepository.FindByIdAsync(pulseId)
            ?? throw new NotFoundException("Pulse", pulseId);

        pulse.Name = request.Name;
        pulse.Description = request.Description;
        await pulseRepository.UpdateAsync(pulse);

        var updatedPulse = await pulseRepository.Query()
            .WithCreator()
            .WithPacers()
            .GetByIdAsync(pulseId);

        return PulseDto.FromEntity(updatedPulse);
    }

    public async Task DeletePulseAsync(int pulseId, int userId)
    {
        if (!await pulseRepository.IsUserPulseCreatorAsync(pulseId, userId))
            throw new ForbiddenException("Only the pulse creator can delete this pulse");

        if (!await pulseRepository.ExistsAsync(pulseId))
            throw new NotFoundException("Pulse", pulseId);

        await pulseRepository.DeleteAsync(pulseId);
    }

    public async Task AddPacerAsync(int pulseId, AddPacerRequest request, int userId)
    {
        if (!await pulseRepository.IsUserPulseCreatorAsync(pulseId, userId))
            throw new ForbiddenException("Only the pulse creator can add collaborators");

        if (!await pulseRepository.ExistsAsync(pulseId))
            throw new NotFoundException("Pulse", pulseId);

        if (!await userRepository.ExistsAsync(request.UserId))
            throw new NotFoundException("User", request.UserId);

        if (await pulseRepository.IsUserMemberAsync(pulseId, request.UserId))
            throw new BadRequestException("User is already a collaborator");

        await pulseRepository.AddPacerAsync(new Pacer
        {
            UserId = request.UserId,
            PulseId = pulseId,
            JoinedAt = DateTime.UtcNow
        });
    }

    public async Task RemovePacerAsync(int pulseId, int userIdToRemove, int currentUserId)
    {
        var isRemovingOther = userIdToRemove != currentUserId;
        var isCreator = await pulseRepository.IsUserPulseCreatorAsync(pulseId, currentUserId);
        if (isRemovingOther && !isCreator)
            throw new ForbiddenException("Only the pulse creator can remove other collaborators");

        var pulse = await pulseRepository.FindByIdAsync(pulseId)
            ?? throw new NotFoundException("Pulse", pulseId);

        _ = await pulseRepository.FindPacerAsync(pulseId, userIdToRemove)
            ?? throw new NotFoundException($"User with ID {userIdToRemove} is not a collaborator on this pulse");

        if (userIdToRemove == pulse.CreatedBy)
            throw new BadRequestException("Cannot remove the pulse creator from collaborators");

        await pulseRepository.RemovePacerAsync(pulseId, userIdToRemove);
    }

    public async Task<PaginatedResponse<BeatDto>> GetPulseBeatsAsync(int pulseId, int userId, int page, int pageSize)
    {
        if (!await pulseRepository.IsUserMemberAsync(pulseId, userId))
            throw new ForbiddenException("User is not a collaborator on this pulse");

        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 50;

        var (beats, totalCount) = await beatRepository.Query()
            .WithUser()
            .WherePulseId(pulseId)
            .ToPagedListAsync(page, pageSize);

        return new PaginatedResponse<BeatDto>
        {
            Items = beats.Select(BeatDto.FromEntity).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public Task<IEnumerable<PulseSummaryDto>> GetPublicPulsesAsync()
    {
        throw new NotImplementedException();
    }

    public Task JoinPulseAsync(int pulseId, int userId)
    {
        throw new NotImplementedException();
    }

    public Task LeavePulseAsync(int pulseId, int userId)
    {
        throw new NotImplementedException();
    }
}
