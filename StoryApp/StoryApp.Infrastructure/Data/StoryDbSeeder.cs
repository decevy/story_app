using StoryApp.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace StoryApp.Infrastructure.Data;

public static class StoryDbSeeder
{
    public static async Task SeedAsync(StoryDbContext context)
    {
        if (await context.Users.AnyAsync())
            return;

        var users = new List<User>
        {
            new User
            {
                Username = "aya",
                Email = "aya@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123"),
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                LastSeen = DateTime.UtcNow
            },
            new User
            {
                Username = "bobby",
                Email = "bobby@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123"),
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                LastSeen = DateTime.UtcNow
            },
            new User
            {
                Username = "carlos",
                Email = "carlos@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123"),
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                LastSeen = DateTime.UtcNow
            }
        };

        await context.Users.AddRangeAsync(users);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var stories = new List<Story>
        {
            new Story
            {
                Name = "General",
                Description = "General collaborative story",
                IsPrivate = false,
                CreatedBy = users[0].Id,
                CreatedAt = DateTime.UtcNow
            },
            new Story
            {
                Name = "Bachata",
                Description = "A story about dance and fun",
                IsPrivate = false,
                CreatedBy = users[0].Id,
                CreatedAt = DateTime.UtcNow
            },
            new Story
            {
                Name = "Gym bros",
                Description = "Fitness adventure",
                IsPrivate = true,
                CreatedBy = users[0].Id,
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.Stories.AddRangeAsync(stories);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var storyMembers = new List<StoryMember>
        {
            new StoryMember { UserId = users[0].Id, StoryId = stories[0].Id, Role = StoryRole.Admin, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = users[0].Id, StoryId = stories[1].Id, Role = StoryRole.Admin, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = users[0].Id, StoryId = stories[2].Id, Role = StoryRole.Admin, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = users[1].Id, StoryId = stories[0].Id, Role = StoryRole.Member, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = users[1].Id, StoryId = stories[1].Id, Role = StoryRole.Member, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = users[2].Id, StoryId = stories[0].Id, Role = StoryRole.Member, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = users[2].Id, StoryId = stories[1].Id, Role = StoryRole.Moderator, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = users[2].Id, StoryId = stories[2].Id, Role = StoryRole.Member, JoinedAt = DateTime.UtcNow }
        };

        await context.StoryMembers.AddRangeAsync(storyMembers);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var turns = new List<Turn>
        {
            new Turn
            {
                Content = "Once upon a time in the General story… 👋",
                UserId = users[0].Id,
                StoryId = stories[0].Id,
                Type = TurnType.Text,
                CreatedAt = DateTime.UtcNow.AddMinutes(-30)
            },
            new Turn
            {
                Content = "The plot thickened.",
                UserId = users[1].Id,
                StoryId = stories[0].Id,
                Type = TurnType.Text,
                CreatedAt = DateTime.UtcNow.AddMinutes(-25)
            },
            new Turn
            {
                Content = "Holaaa",
                UserId = users[2].Id,
                StoryId = stories[0].Id,
                Type = TurnType.Text,
                CreatedAt = DateTime.UtcNow.AddMinutes(-20)
            },
            new Turn
            {
                Content = "The dance floor shimmered under the lights. 😎",
                UserId = users[1].Id,
                StoryId = stories[1].Id,
                Type = TurnType.Text,
                CreatedAt = DateTime.UtcNow.AddMinutes(-15)
            },
            new Turn
            {
                Content = "Lightweighttttt",
                UserId = users[0].Id,
                StoryId = stories[2].Id,
                Type = TurnType.Text,
                CreatedAt = DateTime.UtcNow.AddMinutes(-10)
            }
        };

        await context.Turns.AddRangeAsync(turns);
        await context.SaveChangesAsync();
    }
}
