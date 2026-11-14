using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using StoryApp.Core.Dtos;
using StoryApp.Core.Entities;
using StoryApp.Core.Interfaces;

namespace StoryApp.Api.Hubs;

[Authorize]
public class StoryHub(
    IPassageRepository passageRepository,
    IStoryRepository storyRepository,
    IUserRepository userRepository,
    ILogger<StoryHub> logger) : Hub
{
    private static class EventNames
    {
        public const string
            UserJoinedStory = "UserJoinedStory",
            UserLeftStory = "UserLeftStory",
            ReceivePassage = "ReceivePassage",
            PassageEdited = "PassageEdited",
            PassageDeleted = "PassageDeleted",
            UserStartedTyping = "UserStartedTyping",
            UserStoppedTyping = "UserStoppedTyping",
            UserStatusChanged = "UserStatusChanged";
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId > 0)
        {
            await UpdateUserStatus(userId, true);
            logger.LogInformation("User {userId} connected: {connectionId}", userId, Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId > 0)
        {
            await UpdateUserStatus(userId, false);
            logger.LogInformation("User {userId} disconnected: {connectionId}", userId, Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinStory(int storyId)
    {
        var userId = GetUserId();

        var isMember = await storyRepository.IsUserMemberAsync(storyId, userId);
        if (!isMember)
            throw new HubException("You are not a collaborator on this story");

        var groupName = GetGroupName(storyId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        await Clients.OthersInGroup(groupName).SendAsync(
            EventNames.UserJoinedStory,
            new StoryEventDto { UserId = userId, StoryId = storyId, Timestamp = DateTime.UtcNow }
        );

        logger.LogInformation("User {userId} joined story {storyId}", userId, storyId);
    }

    public async Task LeaveStory(int storyId)
    {
        var userId = GetUserId();

        var groupName = GetGroupName(storyId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        await Clients.OthersInGroup(groupName).SendAsync(
            EventNames.UserLeftStory,
            new StoryEventDto { UserId = userId, StoryId = storyId, Timestamp = DateTime.UtcNow }
        );

        logger.LogInformation("User {userId} left story {storyId}", userId, storyId);
    }

    public async Task SendPassage(
        int storyId,
        IList<PassageSegmentDto> segments,
        Seam? seamBefore = null)
    {
        var userId = GetUserId();

        var isMember = await storyRepository.IsUserMemberAsync(storyId, userId);
        if (!isMember)
            throw new HubException("You are not a collaborator on this story");

        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new HubException("User not found");

        var order = await passageRepository.GetNextOrderAsync(storyId);
        var mappedSegments = MapSegmentDtos(segments);

        var passage = new Passage
        {
            Order = order,
            SeamBefore = seamBefore,
            UserId = userId,
            StoryId = storyId,
            CreatedAt = DateTime.UtcNow,
            User = user,
            Segments = mappedSegments
        };
        passage = await passageRepository.CreateAsync(passage);

        await Clients.Group(GetGroupName(storyId)).SendAsync(
            EventNames.ReceivePassage,
            PassageDto.FromEntity(passage)
        );

        logger.LogInformation("User {userId} added a passage to story {storyId}", userId, storyId);
    }

    public async Task EditPassage(int passageId, IList<PassageSegmentDto> segments)
    {
        var userId = GetUserId();
        var passage = await passageRepository.GetByIdAsync(passageId)
            ?? throw new HubException("Passage not found");

        if (passage.UserId != userId)
            throw new HubException("You can only edit your own passages");

        passage.Segments.Clear();
        foreach (var segment in MapSegmentDtos(segments))
            passage.Segments.Add(segment);

        passage.EditedAt = DateTime.UtcNow;

        await passageRepository.UpdateAsync(passage);

        await Clients.Group(GetGroupName(passage.StoryId)).SendAsync(
            EventNames.PassageEdited,
            new PassageEditedDto
            {
                Id = passageId,
                EditedAt = passage.EditedAt.Value,
                Segments = passage.Segments
                    .OrderBy(s => s.Order)
                    .Select(PassageSegmentDto.FromEntity)
                    .ToList()
            }
        );
    }

    public async Task DeletePassage(int passageId)
    {
        var userId = GetUserId();
        var passage = await passageRepository.GetByIdAsync(passageId)
            ?? throw new HubException("Passage not found");

        if (passage.UserId != userId)
            throw new HubException("You can only delete your own passages");

        var storyId = passage.StoryId;
        await passageRepository.DeleteAsync(passageId);

        await Clients.Group(GetGroupName(storyId)).SendAsync(
            EventNames.PassageDeleted,
            new PassageDeletedDto { Id = passageId, StoryId = storyId }
        );
    }

    public async Task StartTyping(int storyId)
    {
        var userId = GetUserId();
        var user = await userRepository.GetByIdAsync(userId);

        await Clients.OthersInGroup(GetGroupName(storyId)).SendAsync(
            EventNames.UserStartedTyping,
            new TypingIndicatorDto { UserId = userId, Username = user?.Username ?? "Unknown", StoryId = storyId }
        );
    }

    public async Task StopTyping(int storyId)
    {
        var userId = GetUserId();

        await Clients.OthersInGroup(GetGroupName(storyId)).SendAsync(
            EventNames.UserStoppedTyping,
            new TypingIndicatorDto { UserId = userId, StoryId = storyId }
        );
    }

    private static string GetGroupName(int storyId) => $"story_{storyId}";

    private static List<PassageSegment> MapSegmentDtos(IList<PassageSegmentDto> segments)
    {
        if (segments is not { Count: > 0 })
            throw new HubException("At least one segment is required");

        var mapped = segments
            .Select(dto => dto.ToEntity())
            .Where(s => !string.IsNullOrWhiteSpace(s.Text))
            .OrderBy(s => s.Order)
            .ToList();

        if (mapped.Count == 0)
            throw new HubException("At least one segment must contain text");

        return mapped;
    }

    private int GetUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    private async Task UpdateUserStatus(int userId, bool isOnline)
    {
        var user = await userRepository.GetByIdAsync(userId);
        if (user != null)
        {
            user.IsOnline = isOnline;
            user.LastSeen = DateTime.UtcNow;
            await userRepository.UpdateAsync(user);

            await Clients.All.SendAsync(
                EventNames.UserStatusChanged,
                new UserStatusChangedDto { UserId = userId, IsOnline = isOnline, LastSeen = user.LastSeen }
            );
        }
    }
}
