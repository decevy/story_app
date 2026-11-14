using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Interfaces;
using StoryApp.Core.QueryBuilders;
using StoryApp.Infrastructure.Data;

namespace StoryApp.Infrastructure.Repositories;

public class PassageRepository(StoryDbContext context) : IPassageRepository
{
    public PassageQueryBuilder Query()
    {
        return new PassageQueryBuilder(context.Passages.AsQueryable());
    }

    public async Task<Passage?> GetByIdAsync(int id)
    {
        return await Query()
            .WithSegments()
            .FindByIdAsync(id);
    }

    public async Task<Passage> CreateAsync(Passage passage)
    {
        context.Passages.Add(passage);
        await context.SaveChangesAsync();

        return await Query()
            .WithFullDetails()
            .FindByIdAsync(passage.Id) ?? passage;
    }

    public async Task UpdateAsync(Passage passage)
    {
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var passage = await context.Passages.FindAsync(id);
        if (passage != null)
        {
            context.Passages.Remove(passage);
            await context.SaveChangesAsync();
        }
    }

    public async Task<Passage?> GetLastPassageInStoryAsync(int storyId)
    {
        return await Query()
            .WithUser()
            .WithSegments()
            .WhereStoryId(storyId)
            .OrderByPassageOrderDescending()
            .FirstOrDefaultAsync();
    }

    public async Task<int> GetNextOrderAsync(int storyId)
    {
        var maxOrder = await context.Passages
            .Where(b => b.StoryId == storyId)
            .Select(b => (int?)b.Order)
            .MaxAsync();

        return maxOrder is null ? 0 : maxOrder.Value + 1;
    }
}
