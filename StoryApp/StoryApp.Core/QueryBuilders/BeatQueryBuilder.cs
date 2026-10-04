using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;

namespace StoryApp.Core.QueryBuilders;

public class BeatQueryBuilder(IQueryable<Beat> query)
{
    private IQueryable<Beat> _query = query;

    #region Include properties
    public BeatQueryBuilder WithUser()
    {
        _query = _query.Include(b => b.User);
        return this;
    }

    public BeatQueryBuilder WithPulse()
    {
        _query = _query.Include(b => b.Pulse);
        return this;
    }

    public BeatQueryBuilder WithSegments()
    {
        _query = _query.Include(b => b.Segments);
        return this;
    }

    public BeatQueryBuilder WithFullDetails()
    {
        return WithUser().WithPulse().WithSegments();
    }
    #endregion

    #region Where properties
    public BeatQueryBuilder WhereId(int id)
    {
        _query = _query.Where(b => b.Id == id);
        return this;
    }

    public BeatQueryBuilder WherePulseId(int pulseId)
    {
        _query = _query.Where(b => b.PulseId == pulseId);
        return this;
    }

    public BeatQueryBuilder WhereUserId(int userId)
    {
        _query = _query.Where(b => b.UserId == userId);
        return this;
    }

    public BeatQueryBuilder WhereEdited()
    {
        _query = _query.Where(b => b.EditedAt != null);
        return this;
    }

    public BeatQueryBuilder WhereCreatedAfter(DateTime date)
    {
        _query = _query.Where(b => b.CreatedAt > date);
        return this;
    }

    public BeatQueryBuilder WhereCreatedBefore(DateTime date)
    {
        _query = _query.Where(b => b.CreatedAt < date);
        return this;
    }
    #endregion

    #region Order properties
    public BeatQueryBuilder OrderByNewest()
    {
        _query = _query.OrderByDescending(b => b.CreatedAt);
        return this;
    }

    public BeatQueryBuilder OrderByOldest()
    {
        _query = _query.OrderBy(b => b.CreatedAt);
        return this;
    }

    public BeatQueryBuilder OrderByBeatOrder()
    {
        _query = _query.OrderBy(b => b.Order).ThenBy(b => b.CreatedAt);
        return this;
    }

    public BeatQueryBuilder OrderByBeatOrderDescending()
    {
        _query = _query.OrderByDescending(b => b.Order).ThenByDescending(b => b.CreatedAt);
        return this;
    }
    #endregion

    #region Paginate properties
    public BeatQueryBuilder Paginate(int page, int pageSize)
    {
        _query = _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
        return this;
    }

    public BeatQueryBuilder Take(int count)
    {
        _query = _query.Take(count);
        return this;
    }

    public BeatQueryBuilder Skip(int count)
    {
        _query = _query.Skip(count);
        return this;
    }
    #endregion

    #region Terminal operations
    public async Task<Beat> GetByIdAsync(int id)
    {
        return await _query.FirstAsync(b => b.Id == id);
    }

    public async Task<Beat?> FindByIdAsync(int id)
    {
        return await _query.FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Beat> FirstAsync()
    {
        return await _query.FirstAsync();
    }

    public async Task<Beat?> FirstOrDefaultAsync()
    {
        return await _query.FirstOrDefaultAsync();
    }

    public async Task<List<Beat>> ToListAsync()
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

    public async Task<(List<Beat> beats, int totalCount)> ToPagedListAsync(int page, int pageSize)
    {
        var totalCount = await _query.CountAsync();
        var beats = await _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (beats, totalCount);
    }

    public IQueryable<Beat> AsQueryable()
    {
        return _query;
    }
    #endregion
}
