using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;
using StoryApp.Core.Dtos.Responses;
using StoryApp.Core.Interfaces;
using System.Security.Claims;

namespace StoryApp.Api.Controllers;

/// <summary>
/// Collaborative pulses and pacer memberships
/// </summary>
[Authorize]
[ApiController]
[Route("api/pulses")]
public class PulsesController(IPulseService pulseService) : ControllerBase
{
    /// <summary>
    /// Pulses the current user collaborates on
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<PulseSummaryDto>), 200)]
    public async Task<IActionResult> GetUserPulses()
    {
        var userId = GetCurrentUserId();
        var pulses = await pulseService.GetUserPulsesAsync(userId);
        return Ok(pulses);
    }

    /// <summary>
    /// Pulse detail (pacers must be collaborators)
    /// </summary>
    [HttpGet("{pulseId:int}")]
    [ProducesResponseType(typeof(PulseDto), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetPulse(int pulseId)
    {
        var userId = GetCurrentUserId();

        var pulse = await pulseService.GetPulseAsync(pulseId, userId);
        if (pulse == null)
            return NotFound(new ErrorResponse("Pulse not found"));

        return Ok(pulse);
    }

    /// <summary>
    /// Create a pulse
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PulseDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreatePulse([FromBody] CreatePulseRequest request)
    {
        var userId = GetCurrentUserId();

        var pulse = await pulseService.CreatePulseAsync(request, userId);
        return CreatedAtAction(nameof(GetPulse), new { pulseId = pulse.Id }, pulse);
    }

    /// <summary>
    /// Update pulse title/description (pulse creator only)
    /// </summary>
    [HttpPut("{pulseId:int}")]
    [ProducesResponseType(typeof(PulseDto), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdatePulse(int pulseId, [FromBody] UpdatePulseRequest request)
    {
        var userId = GetCurrentUserId();

        var pulse = await pulseService.UpdatePulseAsync(pulseId, request, userId);
        return Ok(pulse);
    }

    /// <summary>
    /// Delete a pulse (pulse creator only)
    /// </summary>
    [HttpDelete("{pulseId:int}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeletePulse(int pulseId)
    {
        var userId = GetCurrentUserId();

        await pulseService.DeletePulseAsync(pulseId, userId);
        return NoContent();
    }

    /// <summary>
    /// Add a pacer (collaborator)
    /// </summary>
    [HttpPost("{pulseId:int}/pacers")]
    [ProducesResponseType(typeof(MessageResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AddPacer(int pulseId, [FromBody] AddPacerRequest request)
    {
        var userId = GetCurrentUserId();

        await pulseService.AddPacerAsync(pulseId, request, userId);
        return CreatedAtAction(
            nameof(GetPulse),
            new { pulseId },
            new MessageResponse("Pacer added successfully"));
    }

    /// <summary>
    /// Remove a pacer (collaborator)
    /// </summary>
    [HttpDelete("{pulseId:int}/pacers/{userId:int}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RemovePacer(int pulseId, int userId)
    {
        var currentUserId = GetCurrentUserId();

        await pulseService.RemovePacerAsync(pulseId, userId, currentUserId);
        return NoContent();
    }

    /// <summary>
    /// Paginated beat history for a pulse
    /// </summary>
    [HttpGet("{pulseId:int}/beats")]
    [ProducesResponseType(typeof(PaginatedResponse<BeatDto>), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetPulseBeats(
        int pulseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userId = GetCurrentUserId();

        var response = await pulseService.GetPulseBeatsAsync(pulseId, userId, page, pageSize);
        return Ok(response);
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var id) ? id : 0;
    }
}
