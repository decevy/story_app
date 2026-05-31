using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;

namespace StoryApp.Infrastructure.Data;

public class PulseDbContext(DbContextOptions<PulseDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Pulse> Pulses { get; set; }
    public DbSet<Beat> Beats { get; set; }
    public DbSet<Pacer> Pacers { get; set; }

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

        modelBuilder.Entity<Pulse>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Name).HasMaxLength(100);
            entity.Property(s => s.Description).HasMaxLength(500);

            entity.HasOne(s => s.Creator)
                  .WithMany()
                  .HasForeignKey(s => s.CreatedBy)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Beat>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Passage).HasMaxLength(2000);

            entity.HasOne(b => b.User)
                  .WithMany(u => u.Beats)
                  .HasForeignKey(b => b.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.Pulse)
                  .WithMany(p => p.Beats)
                  .HasForeignKey(b => b.PulseId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(b => b.CreatedAt);
            entity.HasIndex(b => new { b.PulseId, b.CreatedAt });
        });

        modelBuilder.Entity<Pacer>(entity =>
        {
            entity.ToTable("Pacers");

            entity.HasKey(pm => pm.Id);

            entity.HasOne(pm => pm.User)
                  .WithMany(u => u.Pacers)
                  .HasForeignKey(pm => pm.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pm => pm.Pulse)
                  .WithMany(p => p.Pacers)
                  .HasForeignKey(pm => pm.PulseId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(pm => pm.PulseId);
            entity.HasIndex(pm => new { pm.UserId, pm.PulseId }).IsUnique();
        });
    }

    private static async Task SeedDataAsync(DbContext dbContext, CancellationToken cancellationToken)
    {
        var context = dbContext as PulseDbContext
            ?? throw new InvalidOperationException("Invalid DbContext type for seeding");

        await PulseDbSeeder.SeedAsync(context, cancellationToken);
    }
}
