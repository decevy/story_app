using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Interfaces;
using StoryApp.Core.QueryBuilders;
using StoryApp.Infrastructure.Data;

namespace StoryApp.Infrastructure.Repositories;

public class TurnRepository(StoryDbContext context) : ITurnRepository
{
    public TurnQueryBuilder Query()
    {
        return new TurnQueryBuilder(context.Turns.AsQueryable());
    }

    public async Task<Turn?> GetByIdAsync(int id)
    {
        return await Query().FindByIdAsync(id);
    }

    public async Task<Turn> CreateAsync(Turn turn)
    {
        context.Turns.Add(turn);
        await context.SaveChangesAsync();

        return await Query()
            .WithFullDetails()
            .FindByIdAsync(turn.Id) ?? turn;
    }

    public async Task UpdateAsync(Turn turn)
    {
        context.Entry(turn).State = EntityState.Modified;
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var turn = await context.Turns.FindAsync(id);
        if (turn != null)
        {
            context.Turns.Remove(turn);
            await context.SaveChangesAsync();
        }
    }

    public async Task<Turn?> GetLastTurnInStoryAsync(int storyId)
    {
        return await Query()
            .WithUser()
            .WhereStoryId(storyId)
            .OrderByNewest()
            .FirstOrDefaultAsync();
    }
}
