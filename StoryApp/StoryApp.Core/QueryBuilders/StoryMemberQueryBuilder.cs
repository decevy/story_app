using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;

namespace StoryApp.Core.QueryBuilders;

public class StoryMemberQueryBuilder(IQueryable<StoryMember> query)
{
    private IQueryable<StoryMember> _query = query;

    #region Include properties
    public StoryMemberQueryBuilder WithUser()
    {
        _query = _query.Include(sm => sm.User);
        return this;
    }

    public StoryMemberQueryBuilder WithStory()
    {
        _query = _query.Include(sm => sm.Story);
        return this;
    }

    public StoryMemberQueryBuilder WithFullDetails()
    {
        return WithUser().WithStory();
    }
    #endregion

    #region Where properties
    public StoryMemberQueryBuilder WhereId(int id)
    {
        _query = _query.Where(sm => sm.Id == id);
        return this;
    }

    public StoryMemberQueryBuilder WhereStoryId(int storyId)
    {
        _query = _query.Where(sm => sm.StoryId == storyId);
        return this;
    }

    public StoryMemberQueryBuilder WhereUserId(int userId)
    {
        _query = _query.Where(sm => sm.UserId == userId);
        return this;
    }

    public StoryMemberQueryBuilder WhereStoryAndUser(int storyId, int userId)
    {
        _query = _query.Where(sm => sm.StoryId == storyId && sm.UserId == userId);
        return this;
    }

    public StoryMemberQueryBuilder WhereRole(StoryRole role)
    {
        _query = _query.Where(sm => sm.Role == role);
        return this;
    }

    public StoryMemberQueryBuilder WhereAdmin()
    {
        _query = _query.Where(sm => sm.Role == StoryRole.Admin);
        return this;
    }

    public StoryMemberQueryBuilder WhereMember()
    {
        _query = _query.Where(sm => sm.Role == StoryRole.Member);
        return this;
    }

    public StoryMemberQueryBuilder WhereJoinedAfter(DateTime date)
    {
        _query = _query.Where(sm => sm.JoinedAt > date);
        return this;
    }

    public StoryMemberQueryBuilder WhereJoinedBefore(DateTime date)
    {
        _query = _query.Where(sm => sm.JoinedAt < date);
        return this;
    }
    #endregion

    #region Order properties
    public StoryMemberQueryBuilder OrderByJoinedAt()
    {
        _query = _query.OrderBy(sm => sm.JoinedAt);
        return this;
    }

    public StoryMemberQueryBuilder OrderByJoinedAtDescending()
    {
        _query = _query.OrderByDescending(sm => sm.JoinedAt);
        return this;
    }

    public StoryMemberQueryBuilder OrderByRole()
    {
        _query = _query.OrderBy(sm => sm.Role);
        return this;
    }
    #endregion

    #region Paginate properties
    public StoryMemberQueryBuilder Paginate(int page, int pageSize)
    {
        _query = _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
        return this;
    }

    public StoryMemberQueryBuilder Take(int count)
    {
        _query = _query.Take(count);
        return this;
    }

    public StoryMemberQueryBuilder Skip(int count)
    {
        _query = _query.Skip(count);
        return this;
    }
    #endregion

    #region Terminal operations
    public async Task<StoryMember> GetByIdAsync(int id)
    {
        return await _query.FirstAsync(sm => sm.Id == id);
    }

    public async Task<StoryMember?> FindByIdAsync(int id)
    {
        return await _query.FirstOrDefaultAsync(sm => sm.Id == id);
    }

    public async Task<StoryMember> FirstAsync()
    {
        return await _query.FirstAsync();
    }

    public async Task<StoryMember?> FirstOrDefaultAsync()
    {
        return await _query.FirstOrDefaultAsync();
    }

    public async Task<List<StoryMember>> ToListAsync()
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

    public async Task<(List<StoryMember> members, int totalCount)> ToPagedListAsync(int page, int pageSize)
    {
        var totalCount = await _query.CountAsync();
        var members = await _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (members, totalCount);
    }

    public IQueryable<StoryMember> AsQueryable()
    {
        return _query;
    }
    #endregion
}
