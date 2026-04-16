using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;
using StoryApp.Core.Dtos.Responses;
using StoryApp.Core.Interfaces;
using System.Security.Claims;

namespace StoryApp.Api.Controllers;

/// <summary>
/// Manages user-related operations
/// </summary>
[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController(
    IUserService userService,
    ILogger<UsersController> logger) : ControllerBase
{
    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserDto), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        var user = await userService.GetUserAsync(userId);
        
        if (user == null)
            return Unauthorized(new ErrorResponse("User not found"));

        return Ok(user);
    }

    /// <summary>
    /// Search users by username or email
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(List<UserDto>), 200)]
    public async Task<IActionResult> SearchUsers([FromQuery] string query)
    {
        var users = await userService.SearchUsersAsync(query);
        return Ok(users);
    }

    /// <summary>
    /// Update current user profile
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(UserDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> UpdateCurrentUser([FromBody] UpdateUserRequest request)
    {
        var userId = GetCurrentUserId();
        var user = await userService.UpdateUserAsync(userId, request);
        
        return Ok(user);
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{userId}")]
    [ProducesResponseType(typeof(UserDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetUser(int userId)
    {
        var user = await userService.GetUserAsync(userId);
        
        if (user == null)
            return NotFound(new ErrorResponse("User not found"));

        return Ok(user);
    }

    /// <summary>
    /// Get all users (for admin purposes or user lists)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<UserDto>), 200)]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await userService.GetUsersAsync();
        return Ok(users);
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }
}