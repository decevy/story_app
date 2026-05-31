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
        return await Query().FindByIdAsync(id);
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
        context.Entry(beat).State = EntityState.Modified;
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
            .WherePulseId(pulseId)
            .OrderByNewest()
            .FirstOrDefaultAsync();
    }
}
