using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Extensions;

namespace StoryApp.Core.QueryBuilders;

public class PacerQueryBuilder(IQueryable<Pacer> query)
{
    private IQueryable<Pacer> _query = query;

    public PacerQueryBuilder WithUser()
    {
        _query = _query.Include(pm => pm.User);
        return this;
    }

    public PacerQueryBuilder WithPulse()
    {
        _query = _query.Include(pm => pm.Pulse);
        return this;
    }

    public PacerQueryBuilder WithFullDetails()
    {
        _query = _query.Include(pm => pm.User).Include(pm => pm.Pulse);
        return this;
    }

    public PacerQueryBuilder WhereId(int id)
    {
        _query = _query.Where(pm => pm.Id == id);
        return this;
    }

    public PacerQueryBuilder WherePulseId(int pulseId)
    {
        _query = _query.Where(pm => pm.PulseId == pulseId);
        return this;
    }

    public PacerQueryBuilder WhereUserId(int userId)
    {
        _query = _query.Where(pm => pm.UserId == userId);
        return this;
    }

    public PacerQueryBuilder WherePulseAndUser(int pulseId, int userId)
    {
        _query = _query.Where(pm => pm.PulseId == pulseId && pm.UserId == userId);
        return this;
    }

    public PacerQueryBuilder WhereJoinedAfter(DateTime date)
    {
        _query = _query.Where(pm => pm.JoinedAt > date);
        return this;
    }

    public PacerQueryBuilder WhereJoinedBefore(DateTime date)
    {
        _query = _query.Where(pm => pm.JoinedAt < date);
        return this;
    }

    public PacerQueryBuilder OrderByJoinedAt()
    {
        _query = _query.OrderBy(pm => pm.JoinedAt);
        return this;
    }

    public PacerQueryBuilder OrderByJoinedAtDescending()
    {
        _query = _query.OrderByDescending(pm => pm.JoinedAt);
        return this;
    }

    public PacerQueryBuilder Paginate(int page, int pageSize)
    {
        _query = _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
        return this;
    }

    public PacerQueryBuilder Take(int count)
    {
        _query = _query.Take(count);
        return this;
    }

    public PacerQueryBuilder Skip(int count)
    {
        _query = _query.Skip(count);
        return this;
    }

    public async Task<Pacer> GetByIdAsync(int id)
    {
        return await _query.FirstAsync(pm => pm.Id == id);
    }

    public async Task<Pacer?> FindByIdAsync(int id)
    {
        return await _query.FirstOrDefaultAsync(pm => pm.Id == id);
    }

    public async Task<Pacer> FirstAsync()
    {
        return await _query.FirstAsync();
    }

    public async Task<Pacer?> FirstOrDefaultAsync()
    {
        return await _query.FirstOrDefaultAsync();
    }

    public async Task<List<Pacer>> ToListAsync()
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

    public async Task<(List<Pacer> pacers, int totalCount)> ToPagedListAsync(int page, int pageSize)
    {
        var totalCount = await _query.CountAsync();
        var pacers = await _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (pacers, totalCount);
    }

    public IQueryable<Pacer> AsQueryable()
    {
        return _query;
    }
}
