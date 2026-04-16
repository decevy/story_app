using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;

namespace StoryApp.Infrastructure.Data;

public class StoryDbContext(DbContextOptions<StoryDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Story> Stories { get; set; }
    public DbSet<Turn> Turns { get; set; }
    public DbSet<StoryMember> StoryMembers { get; set; }
    public DbSet<TurnReaction> TurnReactions { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSeeding((context, _) =>
            SeedDataAsync(context, CancellationToken.None).GetAwaiter().GetResult());

        optionsBuilder.UseAsyncSeeding(async (context, _, cancellationToken) =>
            await SeedDataAsync(context, cancellationToken));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Username).IsUnique();
            entity.Property(u => u.Username).HasMaxLength(50);
            entity.Property(u => u.Email).HasMaxLength(255);
            entity.Property(u => u.PasswordHash).HasMaxLength(255);
        });

        // Story configuration
        modelBuilder.Entity<Story>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Name).HasMaxLength(100);
            entity.Property(s => s.Description).HasMaxLength(500);

            entity.HasOne(s => s.Creator)
                  .WithMany()
                  .HasForeignKey(s => s.CreatedBy)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Turn configuration
        modelBuilder.Entity<Turn>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Content).HasMaxLength(2000);
            entity.Property(t => t.AttachmentFileName).HasMaxLength(255);
            entity.Property(t => t.AttachmentUrl).HasMaxLength(500);

            entity.HasOne(t => t.User)
                  .WithMany(u => u.Turns)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Story)
                  .WithMany(s => s.Turns)
                  .HasForeignKey(t => t.StoryId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(t => t.CreatedAt);
            entity.HasIndex(t => new { t.StoryId, t.CreatedAt });
        });

        // StoryMember configuration
        modelBuilder.Entity<StoryMember>(entity =>
        {
            entity.HasKey(sm => sm.Id);

            entity.HasOne(sm => sm.User)
                  .WithMany(u => u.StoryMemberships)
                  .HasForeignKey(sm => sm.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sm => sm.Story)
                  .WithMany(s => s.Members)
                  .HasForeignKey(sm => sm.StoryId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(sm => new { sm.UserId, sm.StoryId }).IsUnique();
        });

        // TurnReaction configuration
        modelBuilder.Entity<TurnReaction>(entity =>
        {
            entity.HasKey(tr => tr.Id);
            entity.Property(tr => tr.Emoji).HasMaxLength(10);

            entity.HasOne(tr => tr.Turn)
                  .WithMany(t => t.Reactions)
                  .HasForeignKey(tr => tr.TurnId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(tr => tr.User)
                  .WithMany()
                  .HasForeignKey(tr => tr.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(tr => new { tr.TurnId, tr.UserId, tr.Emoji }).IsUnique();
        });
    }

    private static async Task SeedDataAsync(DbContext dbContext, CancellationToken cancellationToken)
    {
        var context = dbContext as StoryDbContext
            ?? throw new InvalidOperationException("Invalid DbContext type for seeding");

        if (await context.Users.AnyAsync(cancellationToken)) return;

        // Users
        User[] users =
        [
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
        ];
        await context.Users.AddRangeAsync(users, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var userIds = users.Select(u => u.Id).ToArray();
        context.ChangeTracker.Clear();

        // Stories
        Story[] stories =
        [
            new Story
            {
                Name = "General",
                Description = "General collaborative story",
                IsPrivate = false,
                CreatedBy = userIds[0],
                CreatedAt = DateTime.UtcNow
            },
            new Story
            {
                Name = "Bachata",
                Description = "A story about dance and fun",
                IsPrivate = false,
                CreatedBy = userIds[0],
                CreatedAt = DateTime.UtcNow
            },
            new Story
            {
                Name = "Gym bros",
                Description = "Fitness adventure",
                IsPrivate = true,
                CreatedBy = userIds[0],
                CreatedAt = DateTime.UtcNow
            }
        ];
        await context.Stories.AddRangeAsync(stories, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var storyIds = stories.Select(s => s.Id).ToArray();
        context.ChangeTracker.Clear();

        // Story members
        StoryMember[] storyMembers = [
            new StoryMember { UserId = userIds[0], StoryId = storyIds[0], Role = StoryRole.Admin, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = userIds[0], StoryId = storyIds[1], Role = StoryRole.Admin, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = userIds[0], StoryId = storyIds[2], Role = StoryRole.Admin, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = userIds[1], StoryId = storyIds[0], Role = StoryRole.Member, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = userIds[1], StoryId = storyIds[1], Role = StoryRole.Member, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = userIds[2], StoryId = storyIds[0], Role = StoryRole.Member, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = userIds[2], StoryId = storyIds[1], Role = StoryRole.Moderator, JoinedAt = DateTime.UtcNow },
            new StoryMember { UserId = userIds[2], StoryId = storyIds[2], Role = StoryRole.Member, JoinedAt = DateTime.UtcNow }
        ];
        await context.StoryMembers.AddRangeAsync(storyMembers, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        context.ChangeTracker.Clear();

        // Turns
        Turn[] turns = [
            new Turn
            {
                Content = "Once upon a time in the General story… 👋",
                UserId = userIds[0],
                StoryId = storyIds[0],
                Type = TurnType.Text,
                CreatedAt = DateTime.UtcNow.AddMinutes(-30)
            },
            new Turn
            {
                Content = "The plot thickened.",
                UserId = userIds[1],
                StoryId = storyIds[0],
                Type = TurnType.Text,
                CreatedAt = DateTime.UtcNow.AddMinutes(-25)
            },
            new Turn
            {
                Content = "Holaaa",
                UserId = userIds[2],
                StoryId = storyIds[0],
                Type = TurnType.Text,
                CreatedAt = DateTime.UtcNow.AddMinutes(-20)
            },
            new Turn
            {
                Content = "The dance floor shimmered under the lights. 😎",
                UserId = userIds[1],
                StoryId = storyIds[1],
                Type = TurnType.Text,
                CreatedAt = DateTime.UtcNow.AddMinutes(-15)
            },
            new Turn
            {
                Content = "Lightweighttttt",
                UserId = userIds[0],
                StoryId = storyIds[2],
                Type = TurnType.Text,
                CreatedAt = DateTime.UtcNow.AddMinutes(-10)
            }
        ];
        await context.Turns.AddRangeAsync(turns, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }
}
