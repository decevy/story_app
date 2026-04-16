using System;

namespace StoryApp.Core.Dtos.Responses;

public class MessageResponse(string message)
{
    public string Message { get; set; } = message;
}
