using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Extensions;

namespace StoryApp.Core.QueryBuilders;

public class PulseQueryBuilder(IQueryable<Pulse> query)
{
    private IQueryable<Pulse> _query = query;

    #region Include properties
    public PulseQueryBuilder WithCreator()
    {
        _query = _query.Include(s => s.Creator);
        return this;
    }

    public PulseQueryBuilder WithPacers(bool includeUsers = false)
    {
        _query = _query
            .Include(s => s.Pacers)
            .ThenIncludeIf(includeUsers, m => m.User);
        return this;
    }

    public PulseQueryBuilder WithBeats(int? limit = null, bool includeUsers = false)
    {
        _query = (limit.HasValue
                ? _query.Include(s => s.Beats.OrderByDescending(m => m.CreatedAt).Take(limit.Value))
                : _query.Include(s => s.Beats))
            .ThenIncludeIf(includeUsers, m => m.User);
        return this;
    }

    public PulseQueryBuilder WithFullDetails()
    {
        return WithCreator().WithPacers(includeUsers: true).WithBeats(includeUsers: true);
    }
    #endregion

    #region Where properties
    public PulseQueryBuilder WhereId(int id)
    {
        _query = _query.Where(s => s.Id == id);
        return this;
    }

    public PulseQueryBuilder WhereUserIsMember(int userId)
    {
        _query = _query.Where(s => s.Pacers.Any(m => m.UserId == userId));
        return this;
    }

    public PulseQueryBuilder WhereIsPublic()
    {
        _query = _query.Where(s => !s.IsPrivate);
        return this;
    }

    public PulseQueryBuilder WhereIsPrivate()
    {
        _query = _query.Where(s => s.IsPrivate);
        return this;
    }
    #endregion

    #region Terminal operations

    public async Task<Pulse> GetByIdAsync(int id)
    {
        return await _query.FirstAsync(s => s.Id == id);
    }
    public async Task<Pulse?> FindByIdAsync(int id)
    {
        return await _query.FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<Pulse> FirstAsync()
    {
        return await _query.FirstAsync();
    }

    public async Task<Pulse?> FirstOrDefaultAsync()
    {
        return await _query.FirstOrDefaultAsync();
    }

    public async Task<List<Pulse>> ToListAsync()
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

    public IQueryable<Pulse> AsQueryable()
    {
        return _query;
    }
    #endregion
}
