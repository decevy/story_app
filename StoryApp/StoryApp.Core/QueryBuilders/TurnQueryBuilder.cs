using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Extensions;

namespace StoryApp.Core.QueryBuilders;

public class TurnQueryBuilder(IQueryable<Turn> query)
{
    private IQueryable<Turn> _query = query;

    #region Include properties
    public TurnQueryBuilder WithUser()
    {
        _query = _query.Include(t => t.User);
        return this;
    }

    public TurnQueryBuilder WithStory()
    {
        _query = _query.Include(t => t.Story);
        return this;
    }

    public TurnQueryBuilder WithReactions(bool includeUsers = false)
    {
        _query = _query
            .Include(t => t.Reactions)
            .ThenIncludeIf(includeUsers, r => r.User);
        return this;
    }

    public TurnQueryBuilder WithFullDetails()
    {
        return WithUser().WithStory().WithReactions(includeUsers: true);
    }
    #endregion

    #region Where properties
    public TurnQueryBuilder WhereId(int id)
    {
        _query = _query.Where(t => t.Id == id);
        return this;
    }

    public TurnQueryBuilder WhereStoryId(int storyId)
    {
        _query = _query.Where(t => t.StoryId == storyId);
        return this;
    }

    public TurnQueryBuilder WhereUserId(int userId)
    {
        _query = _query.Where(t => t.UserId == userId);
        return this;
    }

    public TurnQueryBuilder WhereType(TurnType type)
    {
        _query = _query.Where(t => t.Type == type);
        return this;
    }

    public TurnQueryBuilder WhereEdited()
    {
        _query = _query.Where(t => t.EditedAt != null);
        return this;
    }

    public TurnQueryBuilder WhereHasAttachment()
    {
        _query = _query.Where(t => t.AttachmentUrl != null);
        return this;
    }

    public TurnQueryBuilder WhereCreatedAfter(DateTime date)
    {
        _query = _query.Where(t => t.CreatedAt > date);
        return this;
    }

    public TurnQueryBuilder WhereCreatedBefore(DateTime date)
    {
        _query = _query.Where(t => t.CreatedAt < date);
        return this;
    }
    #endregion

    #region Order properties
    public TurnQueryBuilder OrderByNewest()
    {
        _query = _query.OrderByDescending(t => t.CreatedAt);
        return this;
    }

    public TurnQueryBuilder OrderByOldest()
    {
        _query = _query.OrderBy(t => t.CreatedAt);
        return this;
    }
    #endregion

    #region Paginate properties
    public TurnQueryBuilder Paginate(int page, int pageSize)
    {
        _query = _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
        return this;
    }

    public TurnQueryBuilder Take(int count)
    {
        _query = _query.Take(count);
        return this;
    }

    public TurnQueryBuilder Skip(int count)
    {
        _query = _query.Skip(count);
        return this;
    }
    #endregion

    #region Terminal operations
    public async Task<Turn> GetByIdAsync(int id)
    {
        return await _query.FirstAsync(t => t.Id == id);
    }

    public async Task<Turn?> FindByIdAsync(int id)
    {
        return await _query.FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Turn> FirstAsync()
    {
        return await _query.FirstAsync();
    }

    public async Task<Turn?> FirstOrDefaultAsync()
    {
        return await _query.FirstOrDefaultAsync();
    }

    public async Task<List<Turn>> ToListAsync()
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

    public async Task<(List<Turn> turns, int totalCount)> ToPagedListAsync(int page, int pageSize)
    {
        var totalCount = await _query.CountAsync();
        var turns = await _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (turns, totalCount);
    }

    public IQueryable<Turn> AsQueryable()
    {
        return _query;
    }
    #endregion
}
