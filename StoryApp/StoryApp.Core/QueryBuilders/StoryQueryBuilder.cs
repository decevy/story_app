using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Extensions;

namespace StoryApp.Core.QueryBuilders;

public class StoryQueryBuilder(IQueryable<Story> query)
{
    private IQueryable<Story> _query = query;

    #region Include properties
    public StoryQueryBuilder WithCreator()
    {
        _query = _query.Include(s => s.Creator);
        return this;
    }

    public StoryQueryBuilder WithMembers(bool includeUsers = false)
    {
        _query = _query
            .Include(s => s.Members)
            .ThenIncludeIf(includeUsers, m => m.User);
        return this;
    }

    public StoryQueryBuilder WithTurns(int? limit = null, bool includeUsers = false)
    {
        _query = (limit.HasValue
                ? _query.Include(s => s.Turns.OrderByDescending(m => m.CreatedAt).Take(limit.Value))
                : _query.Include(s => s.Turns))
            .ThenIncludeIf(includeUsers, m => m.User);
        return this;
    }

    public StoryQueryBuilder WithFullDetails()
    {
        return WithCreator().WithMembers(includeUsers: true).WithTurns(includeUsers: true);
    }
    #endregion

    #region Where properties
    public StoryQueryBuilder WhereId(int id)
    {
        _query = _query.Where(s => s.Id == id);
        return this;
    }

    public StoryQueryBuilder WhereUserIsMember(int userId)
    {
        _query = _query.Where(s => s.Members.Any(m => m.UserId == userId));
        return this;
    }

    public StoryQueryBuilder WhereIsPublic()
    {
        _query = _query.Where(s => !s.IsPrivate);
        return this;
    }

    public StoryQueryBuilder WhereIsPrivate()
    {
        _query = _query.Where(s => s.IsPrivate);
        return this;
    }
    #endregion

    #region Terminal operations

    public async Task<Story> GetByIdAsync(int id)
    {
        return await _query.FirstAsync(s => s.Id == id);
    }
    public async Task<Story?> FindByIdAsync(int id)
    {
        return await _query.FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<Story> FirstAsync()
    {
        return await _query.FirstAsync();
    }

    public async Task<Story?> FirstOrDefaultAsync()
    {
        return await _query.FirstOrDefaultAsync();
    }

    public async Task<List<Story>> ToListAsync()
    {
        return await _query.ToListAsync();
    }

    public async Task<int> CountAsync()
    {
        return await _query.CountAsync();
    }

    public async Task<bool> AnyAsync()
    {
        return await _query.AnyAsync();
    }

    public IQueryable<Story> AsQueryable()
    {
        return _query;
    }
    #endregion
}
