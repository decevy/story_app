using Microsoft.EntityFrameworkCore;
using StoryApp.Core.Entities;
using StoryApp.Core.Interfaces;
using StoryApp.Core.QueryBuilders;
using StoryApp.Infrastructure.Data;

namespace StoryApp.Infrastructure.Repositories;

public class UserRepository(StoryDbContext context) : IUserRepository
{
    public UserQueryBuilder Query()
    {
        return new UserQueryBuilder(context.Users.AsQueryable());
    }

    public async Task<User> GetByIdAsync(int id)
    {
        return await Query().GetByIdAsync(id);
    }

    public async Task<User?> FindByIdAsync(int id)
    {
        return await Query().FindByIdAsync(id);
    }

    public async Task<User?> FindByEmailAsync(string email)
    {
        return await Query()
            .WhereEmail(email)
            .FirstOrDefaultAsync();
    }

    public async Task<User?> FindByUsernameAsync(string username)
    {
        return await Query()
            .WhereUsername(username)
            .FirstOrDefaultAsync();
    }

    public async Task<User?> FindByRefreshTokenAsync(string refreshToken)
    {
        return await Query()
            .WhereRefreshToken(refreshToken)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        return await Query().ToListAsync();
    }

    public async Task<IEnumerable<User>> SearchUsersAsync(string query)
    {
        return await Query()
            .WhereSearchTerm(query)
            .OrderByUsername()
            .Take(20)
            .ToListAsync();
    }

    public async Task<User> CreateAsync(User user)
    {
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return user;
    }

    public async Task UpdateAsync(User user)
    {
        context.Entry(user).State = EntityState.Modified;
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var user = await context.Users.FindAsync(id);
        if (user != null)
        {
            context.Users.Remove(user);
            await context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await Query()
            .WhereId(id)
            .AnyAsync();
    }

    public async Task<bool> IsEmailTakenAsync(string email) 
    {
        return await Query()
            .WhereEmail(email)
            .AnyAsync();
    }

    public async Task<bool> IsUsernameTakenAsync(string username) 
    {
        return await Query()
            .WhereUsername(username)
            .AnyAsync();
    }
}
