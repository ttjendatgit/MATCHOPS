using MATCHOP.API.Entities;

namespace MATCHOP.API.Services.AI;

public interface IAiIntentPlanner
{
    Task<AiPlan> PlanAsync(
        string userMessage,
        IReadOnlyList<AIChatMessage> history,
        AiConversationMetadata metadata,
        CancellationToken cancellationToken = default);
}

public class AiIntentPlanner : IAiIntentPlanner
{
    private readonly ILogger<AiIntentPlanner> _logger;

    private static readonly string[] ConfirmKeywords =
        ["đồng ý", "dong y", "xác nhận", "xac nhan", "confirm", "ok", "đặt luôn", "dat luon", "yes", "chốt", "chot"];

    private static readonly string[] RejectKeywords =
        ["không", "khong", "hủy", "huy", "cancel", "no", "thôi", "thoi", "bỏ", "bo"];

    public AiIntentPlanner(ILogger<AiIntentPlanner> logger)
    {
        _logger = logger;
    }

    public Task<AiPlan> PlanAsync(
        string userMessage,
        IReadOnlyList<AIChatMessage> history,
        AiConversationMetadata metadata,
        CancellationToken cancellationToken = default)
    {
        var normalized = userMessage.Trim().ToLowerInvariant();

        if (metadata.PendingBooking != null && IsConfirmation(normalized))
        {
            return Task.FromResult(new AiPlan { Intent = AiIntents.ConfirmBooking });
        }

        if (metadata.PendingBooking != null && IsRejection(normalized))
        {
            return Task.FromResult(new AiPlan
            {
                Intent = AiIntents.GeneralChat,
                Parameters = new AiPlanParameters()
            });
        }

        var rulePlan = AiRuleBasedPlanner.TryPlan(userMessage);
        if (rulePlan != null)
        {
            _logger.LogInformation("AI rule-based intent: {Intent}", rulePlan.Intent);
            return Task.FromResult(rulePlan);
        }

        var heuristicPlan = AiRuleBasedPlanner.TryHeuristicFallback(userMessage);
        if (heuristicPlan != null)
        {
            _logger.LogInformation("AI heuristic intent: {Intent}", heuristicPlan.Intent);
            return Task.FromResult(heuristicPlan);
        }

        _logger.LogInformation("AI intent fallback to GENERAL_CHAT (Groq skipped)");
        return Task.FromResult(new AiPlan { Intent = AiIntents.GeneralChat });
    }

    private static bool IsConfirmation(string normalized) =>
        ConfirmKeywords.Any(k => normalized == k || normalized.StartsWith(k + " ") || normalized.EndsWith(" " + k));

    private static bool IsRejection(string normalized) =>
        RejectKeywords.Any(k => normalized == k || normalized.StartsWith(k + " ") || normalized.EndsWith(" " + k));
}
