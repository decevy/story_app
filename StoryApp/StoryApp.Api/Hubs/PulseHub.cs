using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using StoryApp.Core.Dtos;
using StoryApp.Core.Entities;
using StoryApp.Core.Interfaces;

namespace StoryApp.Api.Hubs;

[Authorize]
public class PulseHub(
    IBeatRepository beatRepository,
    IPulseRepository pulseRepository,
    IUserRepository userRepository,
    ILogger<PulseHub> logger) : Hub
{
    private static class EventNames
    {
        public const string
            UserJoinedPulse = "UserJoinedPulse",
            UserLeftPulse = "UserLeftPulse",
            ReceiveBeat = "ReceiveBeat",
            BeatEdited = "BeatEdited",
            BeatDeleted = "BeatDeleted",
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

    public async Task JoinPulse(int pulseId)
    {
        var userId = GetUserId();

        var isMember = await pulseRepository.IsUserMemberAsync(pulseId, userId);
        if (!isMember)
            throw new HubException("You are not a collaborator on this pulse");

        var groupName = GetGroupName(pulseId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        await Clients.OthersInGroup(groupName).SendAsync(
            EventNames.UserJoinedPulse,
            new PulseEventDto { UserId = userId, PulseId = pulseId, Timestamp = DateTime.UtcNow }
        );

        logger.LogInformation("User {userId} joined pulse {pulseId}", userId, pulseId);
    }

    public async Task LeavePulse(int pulseId)
    {
        var userId = GetUserId();

        var groupName = GetGroupName(pulseId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        await Clients.OthersInGroup(groupName).SendAsync(
            EventNames.UserLeftPulse,
            new PulseEventDto { UserId = userId, PulseId = pulseId, Timestamp = DateTime.UtcNow }
        );

        logger.LogInformation("User {userId} left pulse {pulseId}", userId, pulseId);
    }

    public async Task SendBeat(int pulseId, IList<BeatSegmentDto> segments)
    {
        var userId = GetUserId();

        var isMember = await pulseRepository.IsUserMemberAsync(pulseId, userId);
        if (!isMember)
            throw new HubException("You are not a collaborator on this pulse");

        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new HubException("User not found");

        var order = await beatRepository.GetNextOrderAsync(pulseId);
        var mappedSegments = MapSegmentDtos(segments);

        var beat = new Beat
        {
            Order = order,
            UserId = userId,
            PulseId = pulseId,
            CreatedAt = DateTime.UtcNow,
            User = user,
            Segments = mappedSegments
        };
        beat = await beatRepository.CreateAsync(beat);

        await Clients.Group(GetGroupName(pulseId)).SendAsync(
            EventNames.ReceiveBeat,
            BeatDto.FromEntity(beat)
        );

        logger.LogInformation("User {userId} added a beat to pulse {pulseId}", userId, pulseId);
    }

    public async Task EditBeat(int beatId, IList<BeatSegmentDto> segments)
    {
        var userId = GetUserId();
        var beat = await beatRepository.GetByIdAsync(beatId)
            ?? throw new HubException("Beat not found");

        if (beat.UserId != userId)
            throw new HubException("You can only edit your own beats");

        beat.Segments.Clear();
        foreach (var segment in MapSegmentDtos(segments))
            beat.Segments.Add(segment);

        beat.EditedAt = DateTime.UtcNow;

        await beatRepository.UpdateAsync(beat);

        await Clients.Group(GetGroupName(beat.PulseId)).SendAsync(
            EventNames.BeatEdited,
            new BeatEditedDto
            {
                Id = beatId,
                EditedAt = beat.EditedAt.Value,
                Segments = beat.Segments
                    .OrderBy(s => s.Order)
                    .Select(BeatSegmentDto.FromEntity)
                    .ToList()
            }
        );
    }

    public async Task DeleteBeat(int beatId)
    {
        var userId = GetUserId();
        var beat = await beatRepository.GetByIdAsync(beatId)
            ?? throw new HubException("Beat not found");

        if (beat.UserId != userId)
            throw new HubException("You can only delete your own beats");

        var pulseId = beat.PulseId;
        await beatRepository.DeleteAsync(beatId);

        await Clients.Group(GetGroupName(pulseId)).SendAsync(
            EventNames.BeatDeleted,
            new BeatDeletedDto { Id = beatId, PulseId = pulseId }
        );
    }

    public async Task StartTyping(int pulseId)
    {
        var userId = GetUserId();
        var user = await userRepository.GetByIdAsync(userId);

        await Clients.OthersInGroup(GetGroupName(pulseId)).SendAsync(
            EventNames.UserStartedTyping,
            new TypingIndicatorDto { UserId = userId, Username = user?.Username ?? "Unknown", PulseId = pulseId }
        );
    }

    public async Task StopTyping(int pulseId)
    {
        var userId = GetUserId();

        await Clients.OthersInGroup(GetGroupName(pulseId)).SendAsync(
            EventNames.UserStoppedTyping,
            new TypingIndicatorDto { UserId = userId, PulseId = pulseId }
        );
    }

    private static string GetGroupName(int pulseId) => $"pulse_{pulseId}";

    private static List<BeatSegment> MapSegmentDtos(IList<BeatSegmentDto> segments)
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
