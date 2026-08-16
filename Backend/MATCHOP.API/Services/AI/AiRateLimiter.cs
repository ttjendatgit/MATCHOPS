using System.Collections.Concurrent;
using MATCHOP.API.Helpers;

namespace MATCHOP.API.Services.AI;

public interface IAiRateLimiter
{
    void CheckLimit(Guid userId, int limitPerMinute);
}

public class AiRateLimiter : IAiRateLimiter
{
    private static readonly ConcurrentDictionary<Guid, Queue<DateTime>> Requests = new();
    private readonly IConfiguration _configuration;

    public AiRateLimiter(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public void CheckLimit(Guid userId, int limitPerMinute)
    {
        var limit = _configuration.GetValue("Ai:RequestLimitPerMinute", limitPerMinute);
        if (limit <= 0)
            return;

        var now = DateTime.UtcNow;
        var windowStart = now.AddMinutes(-1);
        var queue = Requests.GetOrAdd(userId, _ => new Queue<DateTime>());

        lock (queue)
        {
            while (queue.Count > 0 && queue.Peek() < windowStart)
                queue.Dequeue();

            if (queue.Count >= limit)
                throw new AppException(
                    ErrorCodes.AiRateLimited,
                    "Bạn đã gửi quá nhiều yêu cầu AI. Vui lòng đợi một phút rồi thử lại.",
                    StatusCodes.Status429TooManyRequests);

            queue.Enqueue(now);
        }
    }
}
