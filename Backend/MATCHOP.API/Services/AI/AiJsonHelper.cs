using System.Text.Json;
using System.Text.RegularExpressions;

namespace MATCHOP.API.Services.AI;

public static partial class AiJsonHelper
{
    public static string ExtractJson(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return "{}";

        var trimmed = content.Trim();
        if (trimmed.StartsWith('{') && trimmed.EndsWith('}'))
            return trimmed;

        var match = JsonBlockRegex().Match(trimmed);
        if (match.Success)
            return match.Value;

        var start = trimmed.IndexOf('{');
        var end = trimmed.LastIndexOf('}');
        if (start >= 0 && end > start)
            return trimmed[start..(end + 1)];

        return trimmed;
    }

    public static AiPlan ParsePlan(string content)
    {
        try
        {
            var json = ExtractJson(content);
            var parsed = JsonSerializer.Deserialize<GroqIntentResponse>(json, JsonOptions)
                         ?? new GroqIntentResponse();

            return new AiPlan
            {
                Intent = NormalizeIntent(parsed.Intent),
                Parameters = parsed.Parameters ?? new AiPlanParameters(),
                NeedsClarification = parsed.NeedsClarification,
                ClarificationQuestion = parsed.ClarificationQuestion
            };
        }
        catch
        {
            return new AiPlan { Intent = AiIntents.Unknown };
        }
    }

    public static string SerializeMetadata(AiConversationMetadata metadata) =>
        JsonSerializer.Serialize(metadata, JsonOptions);

    public static AiConversationMetadata DeserializeMetadata(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new AiConversationMetadata();

        try
        {
            return JsonSerializer.Deserialize<AiConversationMetadata>(json, JsonOptions)
                   ?? new AiConversationMetadata();
        }
        catch
        {
            return new AiConversationMetadata();
        }
    }

    public static string SerializeToolResult(AiToolResult result) =>
        JsonSerializer.Serialize(result, JsonOptions);

    private static string NormalizeIntent(string? intent)
    {
        if (string.IsNullOrWhiteSpace(intent))
            return AiIntents.Unknown;

        return intent.Trim().ToUpperInvariant() switch
        {
            "SEARCH_VENUES" => AiIntents.SearchVenue,
            "SEARCH_COURTS" => AiIntents.SearchCourt,
            "CHECK_AVAILABILITY" or "AVAILABILITY" => AiIntents.CheckAvailability,
            "BOOK_COURT" or "CREATE_BOOKING" => AiIntents.BookCourt,
            "CONFIRM_BOOKING" or "CONFIRM" => AiIntents.ConfirmBooking,
            "CANCEL_BOOKING" => AiIntents.CancelBooking,
            "VIEW_BOOKING" or "VIEW_BOOKINGS" or "MY_BOOKINGS" => AiIntents.ViewBooking,
            "PAYMENT" or "PAYMENT_STATUS" => AiIntents.Payment,
            "VENUE_INFORMATION" or "VENUE_INFO" => AiIntents.VenueInformation,
            "COURT_INFORMATION" or "COURT_INFO" => AiIntents.CourtInformation,
            "PRICE_INFORMATION" or "PRICE_INFO" => AiIntents.PriceInformation,
            "OWNER_DASHBOARD" or "OWNER_ANALYTICS" => AiIntents.OwnerDashboard,
            "ADMIN_DASHBOARD" or "ADMIN_ANALYTICS" => AiIntents.AdminDashboard,
            "COACH_DASHBOARD" or "COACH_ANALYTICS" => AiIntents.CoachDashboard,
            "GENERAL_CHAT" or "CHAT" => AiIntents.GeneralChat,
            "FAQ" => AiIntents.Faq,
            _ => intent.Trim().ToUpperInvariant()
        };
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };

    [GeneratedRegex(@"\{[\s\S]*\}", RegexOptions.Singleline)]
    private static partial Regex JsonBlockRegex();
}
