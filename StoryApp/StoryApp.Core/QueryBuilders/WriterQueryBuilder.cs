using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Extensions;

namespace StoryApp.Core.QueryBuilders;

public class WriterQueryBuilder(IQueryable<Writer> query)
{
    private IQueryable<Writer> _query = query;

    public WriterQueryBuilder WithUser()
    {
        _query = _query.Include(pm => pm.User);
        return this;
    }

    public WriterQueryBuilder WithStory()
    {
        _query = _query.Include(pm => pm.Story);
        return this;
    }

    public WriterQueryBuilder WithFullDetails()
    {
        _query = _query.Include(pm => pm.User).Include(pm => pm.Story);
        return this;
    }

    public WriterQueryBuilder WhereId(int id)
    {
        _query = _query.Where(pm => pm.Id == id);
        return this;
    }

    public WriterQueryBuilder WhereStoryId(int storyId)
    {
        _query = _query.Where(pm => pm.StoryId == storyId);
        return this;
    }

    public WriterQueryBuilder WhereUserId(int userId)
    {
        _query = _query.Where(pm => pm.UserId == userId);
        return this;
    }

    public WriterQueryBuilder WhereStoryAndUser(int storyId, int userId)
    {
        _query = _query.Where(pm => pm.StoryId == storyId && pm.UserId == userId);
        return this;
    }

    public WriterQueryBuilder WhereJoinedAfter(DateTime date)
    {
        _query = _query.Where(pm => pm.JoinedAt > date);
        return this;
    }

    public WriterQueryBuilder WhereJoinedBefore(DateTime date)
    {
        _query = _query.Where(pm => pm.JoinedAt < date);
        return this;
    }

    public WriterQueryBuilder OrderByJoinedAt()
    {
        _query = _query.OrderBy(pm => pm.JoinedAt);
        return this;
    }

    public WriterQueryBuilder OrderByJoinedAtDescending()
    {
        _query = _query.OrderByDescending(pm => pm.JoinedAt);
        return this;
    }

    public WriterQueryBuilder Paginate(int page, int pageSize)
    {
        _query = _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
        return this;
    }

    public WriterQueryBuilder Take(int count)
    {
        _query = _query.Take(count);
        return this;
    }

    public WriterQueryBuilder Skip(int count)
    {
        _query = _query.Skip(count);
        return this;
    }

    public async Task<Writer> GetByIdAsync(int id)
    {
        return await _query.FirstAsync(pm => pm.Id == id);
    }

    public async Task<Writer?> FindByIdAsync(int id)
    {
        return await _query.FirstOrDefaultAsync(pm => pm.Id == id);
    }

    public async Task<Writer> FirstAsync()
    {
        return await _query.FirstAsync();
    }

    public async Task<Writer?> FirstOrDefaultAsync()
    {
        return await _query.FirstOrDefaultAsync();
    }

    public async Task<List<Writer>> ToListAsync()
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

    public async Task<(List<Writer> writers, int totalCount)> ToPagedListAsync(int page, int pageSize)
    {
        var totalCount = await _query.CountAsync();
        var writers = await _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (writers, totalCount);
    }

    public IQueryable<Writer> AsQueryable()
    {
        return _query;
    }
}
