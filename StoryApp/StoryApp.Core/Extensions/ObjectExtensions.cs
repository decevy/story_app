namespace StoryApp.Core.Extensions;

public static class ObjectExtensions
{
    public static TResult Transform<TInput, TResult>(this TInput input, Func<TInput, TResult> transformer)
    {
        return transformer(input);
    }

    public static async Task<TResult> TransformAsync<TInput, TResult>(this TInput input, Func<TInput, Task<TResult>> transformer)
    {
        return await transformer(input);
    }
}

