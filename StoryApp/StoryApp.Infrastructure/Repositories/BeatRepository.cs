using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Interfaces;
using StoryApp.Core.QueryBuilders;
using StoryApp.Infrastructure.Data;

namespace StoryApp.Infrastructure.Repositories;

public class BeatRepository(PulseDbContext context) : IBeatRepository
{
    public BeatQueryBuilder Query()
    {
        return new BeatQueryBuilder(context.Beats.AsQueryable());
    }

    public async Task<Beat?> GetByIdAsync(int id)
    {
        return await Query()
            .WithSegments()
            .FindByIdAsync(id);
    }

    public async Task<Beat> CreateAsync(Beat beat)
    {
        context.Beats.Add(beat);
        await context.SaveChangesAsync();

        return await Query()
            .WithFullDetails()
            .FindByIdAsync(beat.Id) ?? beat;
    }

    public async Task UpdateAsync(Beat beat)
    {
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var beat = await context.Beats.FindAsync(id);
        if (beat != null)
        {
            context.Beats.Remove(beat);
            await context.SaveChangesAsync();
        }
    }

    public async Task<Beat?> GetLastBeatInPulseAsync(int pulseId)
    {
        return await Query()
            .WithUser()
            .WithSegments()
            .WherePulseId(pulseId)
            .OrderByBeatOrderDescending()
            .FirstOrDefaultAsync();
    }

    public async Task<int> GetNextOrderAsync(int pulseId)
    {
        var maxOrder = await context.Beats
            .Where(b => b.PulseId == pulseId)
            .Select(b => (int?)b.Order)
            .MaxAsync();

        return maxOrder is null ? 0 : maxOrder.Value + 1;
    }
}
