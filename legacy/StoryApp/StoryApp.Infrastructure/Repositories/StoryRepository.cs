using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Interfaces;
using StoryApp.Core.QueryBuilders;
using StoryApp.Infrastructure.Data;

namespace StoryApp.Infrastructure.Repositories;

public class StoryRepository(StoryDbContext context) : IStoryRepository
{
    public StoryQueryBuilder Query()
    {
        return new StoryQueryBuilder(context.Stories.AsQueryable());
    }

    public async Task<Story> GetByIdAsync(int id)
    {
        return await Query().GetByIdAsync(id);
    }

    public async Task<Story?> FindByIdAsync(int id)
    {
        return await Query().FindByIdAsync(id);
    }

    public async Task<Story> CreateAsync(Story story)
    {
        context.Stories.Add(story);
        await context.SaveChangesAsync();

        return await Query().GetByIdAsync(story.Id);
    }

    public async Task UpdateAsync(Story story)
    {
        context.Entry(story).State = EntityState.Modified;
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var story = await context.Stories.FindAsync(id);
        if (story != null)
        {
            context.Stories.Remove(story);
            await context.SaveChangesAsync();
        }
    }

    #region Writers
    public WriterQueryBuilder QueryWriters()
    {
        return new WriterQueryBuilder(context.Writers.AsQueryable());
    }

    public async Task<Writer?> FindWriterAsync(int storyId, int userId)
    {
        return await QueryWriters()
            .WhereStoryAndUser(storyId, userId)
            .FirstOrDefaultAsync();
    }

    public async Task AddWriterAsync(Writer writer)
    {
        context.Writers.Add(writer);
        await context.SaveChangesAsync();
    }

    public async Task RemoveWriterAsync(int storyId, int userId)
    {
        var writer = await FindWriterAsync(storyId, userId);
        if (writer != null)
        {
            context.Writers.Remove(writer);
            await context.SaveChangesAsync();
        }
    }

    public async Task<bool> IsUserMemberAsync(int storyId, int userId)
    {
        return await QueryWriters()
            .WhereStoryAndUser(storyId, userId)
            .AnyAsync();
    }

    public async Task<bool> IsUserStoryCreatorAsync(int storyId, int userId)
    {
        return await context.Stories.AnyAsync(p => p.Id == storyId && p.CreatedBy == userId);
    }
    #endregion

    public async Task<bool> ExistsAsync(int id)
    {
        return await context.Stories.AnyAsync(s => s.Id == id);
    }
}
