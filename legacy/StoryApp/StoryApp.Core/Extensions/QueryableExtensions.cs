using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;

namespace StoryApp.Core.Extensions;

public static class QueryableExtensions
{
    // IncludeIf for IQueryable<TEntity>
    public static IIncludableQueryable<TEntity, TProperty> IncludeIf<TEntity, TProperty>(
        this IQueryable<TEntity> source,
        bool condition,
        Expression<Func<TEntity, TProperty>> navigationPropertyPath)
        where TEntity : class
    {
        return condition
            ? source.Include(navigationPropertyPath)
            : new PassthroughIncludableQueryable<TEntity, TProperty>(source);
    }

    // ThenIncludeIf for single navigation property (reference)
    public static IIncludableQueryable<TEntity, TProperty> ThenIncludeIf<TEntity, TPreviousProperty, TProperty>(
        this IIncludableQueryable<TEntity, TPreviousProperty> source,
        bool condition,
        Expression<Func<TPreviousProperty, TProperty>> navigationPropertyPath)
        where TEntity : class
    {
        if (source is PassthroughIncludableQueryable<TEntity, TProperty> passthrough)
            return passthrough;

        return condition
            ? source.ThenInclude(navigationPropertyPath)
            : new PassthroughIncludableQueryable<TEntity, TProperty>(source);
    }

    // ThenIncludeIf for collection navigation property
    public static IIncludableQueryable<TEntity, TProperty> ThenIncludeIf<TEntity, TPreviousProperty, TProperty>(
        this IIncludableQueryable<TEntity, IEnumerable<TPreviousProperty>> source,
        bool condition,
        Expression<Func<TPreviousProperty, TProperty>> navigationPropertyPath)
        where TEntity : class
    {
        if (source is PassthroughIncludableQueryable<TEntity, TProperty> passthrough)
            return passthrough;

        return condition
            ? source.ThenInclude(navigationPropertyPath)
            : new PassthroughIncludableQueryable<TEntity, TProperty>(source);
    }

    // ThenIncludeIf for ICollection navigation property
    public static IIncludableQueryable<TEntity, TProperty> ThenIncludeIf<TEntity, TPreviousProperty, TProperty>(
        this IIncludableQueryable<TEntity, ICollection<TPreviousProperty>> source,
        bool condition,
        Expression<Func<TPreviousProperty, TProperty>> navigationPropertyPath)
        where TEntity : class
    {
        if (source is PassthroughIncludableQueryable<TEntity, TProperty> passthrough)
            return passthrough;

        return condition
            ? source.ThenInclude(navigationPropertyPath)
            : new PassthroughIncludableQueryable<TEntity, TProperty>(source);
    }

    // Fake implementation to maintain return type chain
    private class PassthroughIncludableQueryable<TEntity, TProperty>(IQueryable<TEntity> queryable)
        : IIncludableQueryable<TEntity, TProperty>
        where TEntity : class
    {
        public Type ElementType => queryable.ElementType;
        public Expression Expression => queryable.Expression;
        public IQueryProvider Provider => queryable.Provider;

        public IEnumerator<TEntity> GetEnumerator() => queryable.GetEnumerator();
        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => GetEnumerator();
    }
}

