using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;

namespace StoryApp.Core.QueryBuilders;

public class PassageQueryBuilder(IQueryable<Passage> query)
{
    private IQueryable<Passage> _query = query;

    #region Include properties
    public PassageQueryBuilder WithUser()
    {
        _query = _query.Include(b => b.User);
        return this;
    }

    public PassageQueryBuilder WithStory()
    {
        _query = _query.Include(b => b.Story);
        return this;
    }

    public PassageQueryBuilder WithSegments()
    {
        _query = _query.Include(b => b.Segments);
        return this;
    }

    public PassageQueryBuilder WithFullDetails()
    {
        return WithUser().WithStory().WithSegments();
    }
    #endregion

    #region Where properties
    public PassageQueryBuilder WhereId(int id)
    {
        _query = _query.Where(b => b.Id == id);
        return this;
    }

    public PassageQueryBuilder WhereStoryId(int storyId)
    {
        _query = _query.Where(b => b.StoryId == storyId);
        return this;
    }

    public PassageQueryBuilder WhereUserId(int userId)
    {
        _query = _query.Where(b => b.UserId == userId);
        return this;
    }

    public PassageQueryBuilder WhereEdited()
    {
        _query = _query.Where(b => b.EditedAt != null);
        return this;
    }

    public PassageQueryBuilder WhereCreatedAfter(DateTime date)
    {
        _query = _query.Where(b => b.CreatedAt > date);
        return this;
    }

    public PassageQueryBuilder WhereCreatedBefore(DateTime date)
    {
        _query = _query.Where(b => b.CreatedAt < date);
        return this;
    }
    #endregion

    #region Order properties
    public PassageQueryBuilder OrderByNewest()
    {
        _query = _query.OrderByDescending(b => b.CreatedAt);
        return this;
    }

    public PassageQueryBuilder OrderByOldest()
    {
        _query = _query.OrderBy(b => b.CreatedAt);
        return this;
    }

    public PassageQueryBuilder OrderByPassageOrder()
    {
        _query = _query.OrderBy(b => b.Order).ThenBy(b => b.CreatedAt);
        return this;
    }

    public PassageQueryBuilder OrderByPassageOrderDescending()
    {
        _query = _query.OrderByDescending(b => b.Order).ThenByDescending(b => b.CreatedAt);
        return this;
    }
    #endregion

    #region Paginate properties
    public PassageQueryBuilder Paginate(int page, int pageSize)
    {
        _query = _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
        return this;
    }

    public PassageQueryBuilder Take(int count)
    {
        _query = _query.Take(count);
        return this;
    }

    public PassageQueryBuilder Skip(int count)
    {
        _query = _query.Skip(count);
        return this;
    }
    #endregion

    #region Terminal operations
    public async Task<Passage> GetByIdAsync(int id)
    {
        return await _query.FirstAsync(b => b.Id == id);
    }

    public async Task<Passage?> FindByIdAsync(int id)
    {
        return await _query.FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Passage> FirstAsync()
    {
        return await _query.FirstAsync();
    }

    public async Task<Passage?> FirstOrDefaultAsync()
    {
        return await _query.FirstOrDefaultAsync();
    }

    public async Task<List<Passage>> ToListAsync()
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

    public async Task<(List<Passage> passages, int totalCount)> ToPagedListAsync(int page, int pageSize)
    {
        var totalCount = await _query.CountAsync();
        var passages = await _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (passages, totalCount);
    }

    public IQueryable<Passage> AsQueryable()
    {
        return _query;
    }
    #endregion
}
