using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;
using StoryApp.Core.Dtos.Responses;
using StoryApp.Core.Interfaces;
using System.Security.Claims;

namespace StoryApp.Api.Controllers;

/// <summary>
/// Collaborative stories and memberships
/// </summary>
[Authorize]
[ApiController]
[Route("api/stories")]
public class StoriesController(IStoryService storyService) : ControllerBase
{
    /// <summary>
    /// Stories the current user collaborates on
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<StorySummaryDto>), 200)]
    public async Task<IActionResult> GetUserStories()
    {
        var userId = GetCurrentUserId();
        var stories = await storyService.GetUserStoriesAsync(userId);
        return Ok(stories);
    }

    /// <summary>
    /// Story detail (members must be collaborators)
    /// </summary>
    [HttpGet("{storyId:int}")]
    [ProducesResponseType(typeof(StoryDto), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetStory(int storyId)
    {
        var userId = GetCurrentUserId();

        var story = await storyService.GetStoryAsync(storyId, userId);
        if (story == null)
            return NotFound(new ErrorResponse("Story not found"));

        return Ok(story);
    }

    /// <summary>
    /// Create a story
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(StoryDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateStory([FromBody] CreateStoryRequest request)
    {
        var userId = GetCurrentUserId();

        var story = await storyService.CreateStoryAsync(request, userId);
        return CreatedAtAction(nameof(GetStory), new { storyId = story.Id }, story);
    }

    /// <summary>
    /// Update story title/description (admin)
    /// </summary>
    [HttpPut("{storyId:int}")]
    [ProducesResponseType(typeof(StoryDto), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateStory(int storyId, [FromBody] UpdateStoryRequest request)
    {
        var userId = GetCurrentUserId();

        var story = await storyService.UpdateStoryAsync(storyId, request, userId);
        return Ok(story);
    }

    /// <summary>
    /// Delete a story (admin)
    /// </summary>
    [HttpDelete("{storyId:int}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteStory(int storyId)
    {
        var userId = GetCurrentUserId();

        await storyService.DeleteStoryAsync(storyId, userId);
        return NoContent();
    }

    /// <summary>
    /// Add a collaborator
    /// </summary>
    [HttpPost("{storyId:int}/members")]
    [ProducesResponseType(typeof(MessageResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AddMember(int storyId, [FromBody] AddStoryMemberRequest request)
    {
        var userId = GetCurrentUserId();

        await storyService.AddMemberAsync(storyId, request, userId);
        return CreatedAtAction(
            nameof(GetStory),
            new { storyId },
            new MessageResponse("Member added successfully"));
    }

    /// <summary>
    /// Remove a collaborator
    /// </summary>
    [HttpDelete("{storyId:int}/members/{userId:int}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RemoveMember(int storyId, int userId)
    {
        var currentUserId = GetCurrentUserId();

        await storyService.RemoveMemberAsync(storyId, userId, currentUserId);
        return NoContent();
    }

    /// <summary>
    /// Paginated turn history for a story
    /// </summary>
    [HttpGet("{storyId:int}/turns")]
    [ProducesResponseType(typeof(PaginatedResponse<TurnDto>), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetStoryTurns(
        int storyId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userId = GetCurrentUserId();

        var response = await storyService.GetStoryTurnsAsync(storyId, userId, page, pageSize);
        return Ok(response);
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var id) ? id : 0;
    }
}
