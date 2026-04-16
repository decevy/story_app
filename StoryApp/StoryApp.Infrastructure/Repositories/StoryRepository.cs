using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Interfaces;
using StoryApp.Core.QueryBuilders;
using StoryApp.Infrastructure.Data;

namespace StoryApp.Infrastructure.Repositories;

public class StoryRepository(StoryDbContext context) : IStoryRepository
{
    #region Stories
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

        return await Query()
            .WithFullDetails()
            .GetByIdAsync(story.Id);
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

    public async Task<bool> ExistsAsync(int id)
    {
        return await context.Stories.AnyAsync(s => s.Id == id);
    }
    #endregion

    #region Story members
    public StoryMemberQueryBuilder QueryStoryMembers()
    {
        return new StoryMemberQueryBuilder(context.StoryMembers.AsQueryable());
    }

    public async Task<StoryMember?> FindStoryMemberAsync(int storyId, int userId)
    {
        return await QueryStoryMembers()
            .WhereStoryAndUser(storyId, userId)
            .WithUser()
            .FirstOrDefaultAsync();
    }

    public async Task AddStoryMemberAsync(StoryMember member)
    {
        context.StoryMembers.Add(member);
        await context.SaveChangesAsync();
    }

    public async Task RemoveStoryMemberAsync(int storyId, int userId)
    {
        var member = await FindStoryMemberAsync(storyId, userId);
        if (member != null)
        {
            context.StoryMembers.Remove(member);
            await context.SaveChangesAsync();
        }
    }

    public async Task<bool> IsUserMemberAsync(int storyId, int userId)
    {
        return await QueryStoryMembers()
            .WhereStoryAndUser(storyId, userId)
            .AnyAsync();
    }

    public async Task<bool> IsUserStoryAdminAsync(int storyId, int userId)
    {
        return await QueryStoryMembers()
            .WhereStoryAndUser(storyId, userId)
            .WhereAdmin()
            .AnyAsync();
    }
    #endregion
}
