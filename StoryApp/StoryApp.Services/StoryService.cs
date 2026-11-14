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
    IPassageRepository passageRepository,
    IUserRepository userRepository) : IStoryService
{
    public async Task<List<StorySummaryDto>> GetUserStoriesAsync(int userId)
    {
        var stories = await storyRepository.Query()
            .WithCreator()
            .WithWriters()
            .WhereUserIsMember(userId)
            .ToListAsync();

        var storyDtos = new List<StorySummaryDto>();
        foreach (var story in stories)
        {
            var lastPassage = await passageRepository.GetLastPassageInStoryAsync(story.Id);
            if (lastPassage != null)
                story.Passages.Add(lastPassage);
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
            .WithWriters(includeUsers: true)
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

        var writer = new Writer
        {
            UserId = userId,
            StoryId = story.Id,
            JoinedAt = DateTime.UtcNow
        };
        await storyRepository.AddWriterAsync(writer);

        var loaded = await storyRepository.Query()
            .WithCreator()
            .WithWriters(includeUsers: true)
            .GetByIdAsync(story.Id);

        return StoryDto.FromEntity(loaded);
    }

    public async Task<StoryDto> UpdateStoryAsync(int storyId, UpdateStoryRequest request, int userId)
    {
        if (!await storyRepository.IsUserStoryCreatorAsync(storyId, userId))
            throw new ForbiddenException("Only the story creator can edit this story");

        var story = await storyRepository.FindByIdAsync(storyId)
            ?? throw new NotFoundException("Story", storyId);

        story.Name = request.Name;
        story.Description = request.Description;
        await storyRepository.UpdateAsync(story);

        var updatedStory = await storyRepository.Query()
            .WithCreator()
            .WithWriters()
            .GetByIdAsync(storyId);

        return StoryDto.FromEntity(updatedStory);
    }

    public async Task DeleteStoryAsync(int storyId, int userId)
    {
        if (!await storyRepository.IsUserStoryCreatorAsync(storyId, userId))
            throw new ForbiddenException("Only the story creator can delete this story");

        if (!await storyRepository.ExistsAsync(storyId))
            throw new NotFoundException("Story", storyId);

        await storyRepository.DeleteAsync(storyId);
    }

    public async Task AddWriterAsync(int storyId, AddWriterRequest request, int userId)
    {
        if (!await storyRepository.IsUserStoryCreatorAsync(storyId, userId))
            throw new ForbiddenException("Only the story creator can add collaborators");

        if (!await storyRepository.ExistsAsync(storyId))
            throw new NotFoundException("Story", storyId);

        if (!await userRepository.ExistsAsync(request.UserId))
            throw new NotFoundException("User", request.UserId);

        if (await storyRepository.IsUserMemberAsync(storyId, request.UserId))
            throw new BadRequestException("User is already a collaborator");

        await storyRepository.AddWriterAsync(new Writer
        {
            UserId = request.UserId,
            StoryId = storyId,
            JoinedAt = DateTime.UtcNow
        });
    }

    public async Task RemoveWriterAsync(int storyId, int userIdToRemove, int currentUserId)
    {
        var isRemovingOther = userIdToRemove != currentUserId;
        var isCreator = await storyRepository.IsUserStoryCreatorAsync(storyId, currentUserId);
        if (isRemovingOther && !isCreator)
            throw new ForbiddenException("Only the story creator can remove other collaborators");

        var story = await storyRepository.FindByIdAsync(storyId)
            ?? throw new NotFoundException("Story", storyId);

        _ = await storyRepository.FindWriterAsync(storyId, userIdToRemove)
            ?? throw new NotFoundException($"User with ID {userIdToRemove} is not a collaborator on this story");

        if (userIdToRemove == story.CreatedBy)
            throw new BadRequestException("Cannot remove the story creator from collaborators");

        await storyRepository.RemoveWriterAsync(storyId, userIdToRemove);
    }

    public async Task<PaginatedResponse<PassageDto>> GetStoryPassagesAsync(int storyId, int userId, int page, int pageSize)
    {
        if (!await storyRepository.IsUserMemberAsync(storyId, userId))
            throw new ForbiddenException("User is not a collaborator on this story");

        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 50;

        var (passages, totalCount) = await passageRepository.Query()
            .WithUser()
            .WithSegments()
            .WhereStoryId(storyId)
            .OrderByPassageOrder()
            .ToPagedListAsync(page, pageSize);

        return new PaginatedResponse<PassageDto>
        {
            Items = passages.Select(PassageDto.FromEntity).ToList(),
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
