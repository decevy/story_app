using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using StoryApp.Core.Interfaces;
using StoryApp.Core.Entities;
using System.Security.Claims;
using StoryApp.Core.Dtos;

namespace StoryApp.Api.Hubs;

[Authorize]
public class StoryHub(
    ITurnRepository turnRepository,
    IStoryRepository storyRepository,
    IUserRepository userRepository,
    ILogger<StoryHub> logger) : Hub
{
    private static class EventNames
    {
        public const string
            UserJoinedStory = "UserJoinedStory",
            UserLeftStory = "UserLeftStory",
            ReceiveTurn = "ReceiveTurn",
            TurnEdited = "TurnEdited",
            TurnDeleted = "TurnDeleted",
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

    public async Task SendTurn(int storyId, string content)
    {
        var userId = GetUserId();

        var isMember = await storyRepository.IsUserMemberAsync(storyId, userId);
        if (!isMember)
            throw new HubException("You are not a collaborator on this story");

        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new HubException("User not found");

        var turn = new Turn
        {
            Content = content,
            UserId = userId,
            StoryId = storyId,
            Type = TurnType.Text,
            CreatedAt = DateTime.UtcNow,
            User = user
        };
        await turnRepository.CreateAsync(turn);

        await Clients.Group(GetGroupName(storyId)).SendAsync(
            EventNames.ReceiveTurn,
            TurnDto.FromEntity(turn)
        );

        logger.LogInformation("User {userId} added a turn to story {storyId}", userId, storyId);
    }

    public async Task EditTurn(int turnId, string newContent)
    {
        var userId = GetUserId();
        var turn = await turnRepository.GetByIdAsync(turnId)
            ?? throw new HubException("Turn not found");

        if (turn.UserId != userId)
            throw new HubException("You can only edit your own turns");

        turn.Content = newContent;
        turn.EditedAt = DateTime.UtcNow;

        await turnRepository.UpdateAsync(turn);

        await Clients.Group(GetGroupName(turn.StoryId)).SendAsync(
            EventNames.TurnEdited,
            new TurnEditedDto
            {
                Id = turnId,
                Content = newContent,
                EditedAt = turn.EditedAt.Value
            }
        );
    }

    public async Task DeleteTurn(int turnId)
    {
        var userId = GetUserId();
        var turn = await turnRepository.GetByIdAsync(turnId)
            ?? throw new HubException("Turn not found");

        if (turn.UserId != userId)
            throw new HubException("You can only delete your own turns");

        var storyId = turn.StoryId;
        await turnRepository.DeleteAsync(turnId);

        await Clients.Group(GetGroupName(storyId)).SendAsync(
            EventNames.TurnDeleted,
            new TurnDeletedDto { Id = turnId, StoryId = storyId }
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
