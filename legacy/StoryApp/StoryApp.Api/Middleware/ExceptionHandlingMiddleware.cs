using System.Net;
using System.Text.Json;
using StoryApp.Core.Dtos.Responses;
using StoryApp.Core.Exceptions;

namespace StoryApp.Api.Middleware;

/// <summary>
/// Global exception handling middleware that catches exceptions and maps them to appropriate HTTP responses.
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = exception switch
        {
            NotFoundException notFoundEx => 
                (HttpStatusCode.NotFound, notFoundEx.Message),
            
            ForbiddenException forbiddenEx => 
                (HttpStatusCode.Forbidden, forbiddenEx.Message),
            
            UnauthorizedException unauthorizedEx => 
                (HttpStatusCode.Unauthorized, unauthorizedEx.Message),
            
            BadRequestException badRequestEx => 
                (HttpStatusCode.BadRequest, badRequestEx.Message),
            
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred")
        };

        // Log the exception
        if (statusCode == HttpStatusCode.InternalServerError)
        {
            logger.LogError(exception, "An unhandled exception occurred: {Message}", exception.Message);
        }
        else
        {
            logger.LogWarning(exception, "Client error occurred: {StatusCode} - {Message}", statusCode, message);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new ErrorResponse(message);
        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        await context.Response.WriteAsync(jsonResponse);
    }
}

