using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Extensions;

namespace StoryApp.Core.QueryBuilders;

public class UserQueryBuilder(IQueryable<User> query)
{
    private IQueryable<User> _query = query;

    #region Include properties
    public UserQueryBuilder WithTurns()
    {
        _query = _query.Include(u => u.Turns);
        return this;
    }

    public UserQueryBuilder WithStoryMemberships(bool includeStories = false)
    {
        _query = _query
            .Include(u => u.StoryMemberships)
            .ThenIncludeIf(includeStories, sm => sm.Story);
        return this;
    }

    public UserQueryBuilder WithFullDetails()
    {
        return WithTurns().WithStoryMemberships(includeStories: true);
    }
    #endregion

    #region Where properties
    public UserQueryBuilder WhereId(int id)
    {
        _query = _query.Where(u => u.Id == id);
        return this;
    }

    public UserQueryBuilder WhereEmail(string email)
    {
        _query = _query.Where(u => u.Email == email);
        return this;
    }

    public UserQueryBuilder WhereUsername(string username)
    {
        _query = _query.Where(u => u.Username == username);
        return this;
    }

    public UserQueryBuilder WhereRefreshToken(string refreshToken)
    {
        _query = _query.Where(u => u.RefreshToken == refreshToken);
        return this;
    }

    public UserQueryBuilder WhereOnline()
    {
        _query = _query.Where(u => u.IsOnline);
        return this;
    }

    public UserQueryBuilder WhereOffline()
    {
        _query = _query.Where(u => !u.IsOnline);
        return this;
    }

    public UserQueryBuilder WhereSearchTerm(string searchTerm) // todo: check how safe this is (sql injection)
    {
        var lowerTerm = searchTerm.ToLower();
        _query = _query.Where(u => 
            u.Username.ToLower().Contains(lowerTerm) || 
            u.Email.ToLower().Contains(lowerTerm));
        return this;
    }

    public UserQueryBuilder WhereCreatedAfter(DateTime date)
    {
        _query = _query.Where(u => u.CreatedAt > date);
        return this;
    }

    public UserQueryBuilder WhereCreatedBefore(DateTime date)
    {
        _query = _query.Where(u => u.CreatedAt < date);
        return this;
    }

    public UserQueryBuilder WhereLastSeenAfter(DateTime date)
    {
        _query = _query.Where(u => u.LastSeen > date);
        return this;
    }

    public UserQueryBuilder WhereLastSeenBefore(DateTime date)
    {
        _query = _query.Where(u => u.LastSeen < date);
        return this;
    }

    public UserQueryBuilder WhereRefreshTokenValid()
    {
        _query = _query.Where(u => 
            u.RefreshToken != null && 
            u.RefreshTokenExpiry != null && 
            u.RefreshTokenExpiry > DateTime.UtcNow);
        return this;
    }
    #endregion

    #region Order properties
    public UserQueryBuilder OrderByUsername()
    {
        _query = _query.OrderBy(u => u.Username);
        return this;
    }

    public UserQueryBuilder OrderByEmail()
    {
        _query = _query.OrderBy(u => u.Email);
        return this;
    }

    public UserQueryBuilder OrderByCreatedAt()
    {
        _query = _query.OrderBy(u => u.CreatedAt);
        return this;
    }

    public UserQueryBuilder OrderByCreatedAtDescending()
    {
        _query = _query.OrderByDescending(u => u.CreatedAt);
        return this;
    }

    public UserQueryBuilder OrderByLastSeen()
    {
        _query = _query.OrderBy(u => u.LastSeen);
        return this;
    }

    public UserQueryBuilder OrderByLastSeenDescending()
    {
        _query = _query.OrderByDescending(u => u.LastSeen);
        return this;
    }
    #endregion

    #region Paginate properties
    public UserQueryBuilder Paginate(int page, int pageSize)
    {
        _query = _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
        return this;
    }

    public UserQueryBuilder Take(int count)
    {
        _query = _query.Take(count);
        return this;
    }

    public UserQueryBuilder Skip(int count)
    {
        _query = _query.Skip(count);
        return this;
    }
    #endregion

    #region Terminal operations
    public async Task<User> GetByIdAsync(int id)
    {
        return await _query.FirstAsync(u => u.Id == id);
    }

    public async Task<User?> FindByIdAsync(int id)
    {
        return await _query.FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User> FirstAsync()
    {
        return await _query.FirstAsync();
    }

    public async Task<User?> FirstOrDefaultAsync()
    {
        return await _query.FirstOrDefaultAsync();
    }

    public async Task<List<User>> ToListAsync()
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

    public async Task<(List<User> users, int totalCount)> ToPagedListAsync(int page, int pageSize)
    {
        var totalCount = await _query.CountAsync();
        var users = await _query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        
        return (users, totalCount);
    }
    
    public IQueryable<User> AsQueryable()
    {
        return _query;
    }
    #endregion

}

