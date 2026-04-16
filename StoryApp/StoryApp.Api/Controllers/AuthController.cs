using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StoryApp.Core.Dtos.Requests;
using StoryApp.Core.Interfaces;
using StoryApp.Core.Dtos.Responses;

namespace StoryApp.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var response = await authService.RegisterAsync(request);
        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await authService.LoginAsync(request);
        return Ok(response);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var response = await authService.RefreshTokenAsync(request.RefreshToken);
        return Ok(response);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized(new ErrorResponse("Invalid token"));

        var userId = int.Parse(userIdClaim.Value);
        await authService.RevokeTokenAsync(userId);

        return Ok(new MessageResponse("Logged out successfully"));
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        var usernameClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
        var emailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Email);

        if (userIdClaim == null || usernameClaim == null || emailClaim == null)
            return Unauthorized(new ErrorResponse("Invalid token"));

        return Ok(new CurrentUserResponse
        {
            UserId = int.Parse(userIdClaim.Value),
            Username = usernameClaim.Value,
            Email = emailClaim.Value
        });
    }
}