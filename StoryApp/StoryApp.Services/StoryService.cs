using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;
using StoryApp.Core.Dtos.Responses;
using StoryApp.Core.Entities;
using StoryApp.Core.Exceptions;
using StoryApp.Core.Extensions;
using StoryApp.Core.Interfaces;

namespace StoryApp.Services;

public class StoryService(
    IStoryRepository storyRepository,
    ITurnRepository turnRepository,
    IUserRepository userRepository) : IStoryService
{
    public async Task<List<StorySummaryDto>> GetUserStoriesAsync(int userId)
    {
        var stories = await storyRepository.Query()
            .WithCreator()
            .WithMembers()
            .WhereUserIsMember(userId)
            .ToListAsync();

        var storyDtos = new List<StorySummaryDto>();
        foreach (var story in stories)
        {
            var lastTurn = await turnRepository.GetLastTurnInStoryAsync(story.Id);
            if (lastTurn != null)
                story.Turns.Add(lastTurn);
            var storyDto = StorySummaryDto.FromEntity(story);
            storyDtos.Add(storyDto);
        }

        return storyDtos;
    }

    public async Task<StoryDto?> GetStoryAsync(int storyId, int userId)
    {
        if (!await storyRepository.IsUserMemberAsync(storyId, userId))
            throw new ForbiddenException("User is not a collaborator on this story");

        var story = await storyRepository.Query()
            .WithCreator()
            .WithMembers(includeUsers: true)
            .FindByIdAsync(storyId);

        return story?.Transform(StoryDto.FromEntity);
    }

    public async Task<StoryDto> CreateStoryAsync(CreateStoryRequest request, int userId)
    {
        var user = await userRepository.FindByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        var story = new Story
        {
            Name = request.Name,
            Description = request.Description,
            IsPrivate = request.IsPrivate,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            Creator = user
        };
        story = await storyRepository.CreateAsync(story);

        var storyMember = new StoryMember
        {
            UserId = userId,
            StoryId = story.Id,
            Role = StoryRole.Admin,
            JoinedAt = DateTime.UtcNow
        };
        await storyRepository.AddStoryMemberAsync(storyMember);

        return StoryDto.FromEntity(story);
    }

    public async Task<StoryDto> UpdateStoryAsync(int storyId, UpdateStoryRequest request, int userId)
    {
        if (!await storyRepository.IsUserStoryAdminAsync(storyId, userId))
            throw new ForbiddenException("User is not an admin of this story");

        var story = await storyRepository.FindByIdAsync(storyId)
            ?? throw new NotFoundException("Story", storyId);

        story.Name = request.Name;
        story.Description = request.Description;
        await storyRepository.UpdateAsync(story);

        var updatedStory = await storyRepository.Query()
            .WithCreator()
            .WithMembers()
            .GetByIdAsync(storyId);

        return StoryDto.FromEntity(updatedStory);
    }

    public async Task DeleteStoryAsync(int storyId, int userId)
    {
        if (!await storyRepository.IsUserStoryAdminAsync(storyId, userId))
            throw new ForbiddenException("User is not an admin of this story");

        if (!await storyRepository.ExistsAsync(storyId))
            throw new NotFoundException("Story", storyId);

        await storyRepository.DeleteAsync(storyId);
    }

    public async Task AddMemberAsync(int storyId, AddStoryMemberRequest request, int userId)
    {
        if (!await storyRepository.IsUserStoryAdminAsync(storyId, userId))
            throw new ForbiddenException("User is not an admin of this story");

        if (!await storyRepository.ExistsAsync(storyId))
            throw new NotFoundException("Story", storyId);

        if (!await userRepository.ExistsAsync(request.UserId))
            throw new NotFoundException("User", request.UserId);

        if (await storyRepository.IsUserMemberAsync(storyId, request.UserId))
            throw new BadRequestException("User is already a collaborator");

        await storyRepository.AddStoryMemberAsync(new StoryMember
        {
            UserId = request.UserId,
            StoryId = storyId,
            Role = request.IsAdmin ? StoryRole.Admin : StoryRole.Member,
            JoinedAt = DateTime.UtcNow
        });
    }

    public async Task RemoveMemberAsync(int storyId, int userIdToRemove, int currentUserId)
    {
        var isRemovingOther = userIdToRemove != currentUserId;
        var isAdmin = await storyRepository.IsUserStoryAdminAsync(storyId, currentUserId);
        if (isRemovingOther && !isAdmin)
            throw new ForbiddenException("Only admins can remove other collaborators");

        if (!await storyRepository.ExistsAsync(storyId))
            throw new NotFoundException("Story", storyId);

        var member = await storyRepository.FindStoryMemberAsync(storyId, userIdToRemove)
            ?? throw new NotFoundException($"User with ID {userIdToRemove} is not a collaborator on this story");

        if (member.Role == StoryRole.Admin)
        {
            var storyWithMembers = await storyRepository.Query()
                .WithMembers()
                .FindByIdAsync(storyId);
            var adminCount = storyWithMembers?.Members.Count(m => m.Role == StoryRole.Admin) ?? 0;
            if (adminCount == 1)
                throw new BadRequestException("Cannot remove the last admin");
        }

        await storyRepository.RemoveStoryMemberAsync(storyId, userIdToRemove);
    }

    public async Task<PaginatedResponse<TurnDto>> GetStoryTurnsAsync(int storyId, int userId, int page, int pageSize)
    {
        if (!await storyRepository.IsUserMemberAsync(storyId, userId))
            throw new ForbiddenException("User is not a collaborator on this story");

        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 50;

        var (turns, totalCount) = await turnRepository.Query()
            .WithUser()
            .WhereStoryId(storyId)
            .ToPagedListAsync(page, pageSize);

        return new PaginatedResponse<TurnDto>
        {
            Items = turns.Select(TurnDto.FromEntity).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public Task<IEnumerable<StorySummaryDto>> GetPublicStoriesAsync()
    {
        throw new NotImplementedException();
    }

    public Task JoinStoryAsync(int storyId, int userId)
    {
        throw new NotImplementedException();
    }

    public Task LeaveStoryAsync(int storyId, int userId)
    {
        throw new NotImplementedException();
    }
}
