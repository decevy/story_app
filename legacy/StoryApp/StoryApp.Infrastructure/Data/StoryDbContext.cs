using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;

namespace StoryApp.Infrastructure.Data;

public class StoryDbContext(DbContextOptions<StoryDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Story> Stories { get; set; }
    public DbSet<Passage> Passages { get; set; }
    public DbSet<PassageSegment> PassageSegments { get; set; }
    public DbSet<Writer> Writers { get; set; }

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

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Username).IsUnique();
            entity.Property(u => u.Username).HasMaxLength(50);
            entity.Property(u => u.Email).HasMaxLength(255);
            entity.Property(u => u.PasswordHash).HasMaxLength(255);
        });

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

        modelBuilder.Entity<Passage>(entity =>
        {
            entity.HasKey(b => b.Id);

            entity.HasOne(b => b.User)
                  .WithMany(u => u.Passages)
                  .HasForeignKey(b => b.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.Story)
                  .WithMany(p => p.Passages)
                  .HasForeignKey(b => b.StoryId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(b => b.Segments)
                  .WithOne(s => s.Passage)
                  .HasForeignKey(s => s.PassageId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(b => b.CreatedAt);
            entity.HasIndex(b => new { b.StoryId, b.CreatedAt });
            entity.HasIndex(b => new { b.StoryId, b.Order });
        });

        modelBuilder.Entity<PassageSegment>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Text).HasMaxLength(2000);

            entity.HasIndex(s => new { s.PassageId, s.Order }).IsUnique();
        });

        modelBuilder.Entity<Writer>(entity =>
        {
            entity.ToTable("Writers");

            entity.HasKey(pm => pm.Id);

            entity.HasOne(pm => pm.User)
                  .WithMany(u => u.Writers)
                  .HasForeignKey(pm => pm.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pm => pm.Story)
                  .WithMany(p => p.Writers)
                  .HasForeignKey(pm => pm.StoryId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(pm => pm.StoryId);
            entity.HasIndex(pm => new { pm.UserId, pm.StoryId }).IsUnique();
        });
    }

    private static async Task SeedDataAsync(DbContext dbContext, CancellationToken cancellationToken)
    {
        var context = dbContext as StoryDbContext
            ?? throw new InvalidOperationException("Invalid DbContext type for seeding");

        await StoryDbSeeder.SeedAsync(context, cancellationToken);
    }
}
