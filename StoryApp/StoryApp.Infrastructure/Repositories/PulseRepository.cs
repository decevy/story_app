using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Interfaces;
using StoryApp.Core.QueryBuilders;
using StoryApp.Infrastructure.Data;

namespace StoryApp.Infrastructure.Repositories;

public class PulseRepository(PulseDbContext context) : IPulseRepository
{
    public PulseQueryBuilder Query()
    {
        return new PulseQueryBuilder(context.Pulses.AsQueryable());
    }

    public async Task<Pulse> GetByIdAsync(int id)
    {
        return await Query().GetByIdAsync(id);
    }

    public async Task<Pulse?> FindByIdAsync(int id)
    {
        return await Query().FindByIdAsync(id);
    }

    public async Task<Pulse> CreateAsync(Pulse pulse)
    {
        context.Pulses.Add(pulse);
        await context.SaveChangesAsync();

        return await Query().GetByIdAsync(pulse.Id);
    }

    public async Task UpdateAsync(Pulse pulse)
    {
        context.Entry(pulse).State = EntityState.Modified;
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var pulse = await context.Pulses.FindAsync(id);
        if (pulse != null)
        {
            context.Pulses.Remove(pulse);
            await context.SaveChangesAsync();
        }
    }

    #region Pacers
    public PacerQueryBuilder QueryPacers()
    {
        return new PacerQueryBuilder(context.Pacers.AsQueryable());
    }

    public async Task<Pacer?> FindPacerAsync(int pulseId, int userId)
    {
        return await QueryPacers()
            .WherePulseAndUser(pulseId, userId)
            .FirstOrDefaultAsync();
    }

    public async Task AddPacerAsync(Pacer pacer)
    {
        context.Pacers.Add(pacer);
        await context.SaveChangesAsync();
    }

    public async Task RemovePacerAsync(int pulseId, int userId)
    {
        var pacer = await FindPacerAsync(pulseId, userId);
        if (pacer != null)
        {
            context.Pacers.Remove(pacer);
            await context.SaveChangesAsync();
        }
    }

    public async Task<bool> IsUserMemberAsync(int pulseId, int userId)
    {
        return await QueryPacers()
            .WherePulseAndUser(pulseId, userId)
            .AnyAsync();
    }

    public async Task<bool> IsUserPulseCreatorAsync(int pulseId, int userId)
    {
        return await context.Pulses.AnyAsync(p => p.Id == pulseId && p.CreatedBy == userId);
    }
    #endregion

    public async Task<bool> ExistsAsync(int id)
    {
        return await context.Pulses.AnyAsync(s => s.Id == id);
    }
}
