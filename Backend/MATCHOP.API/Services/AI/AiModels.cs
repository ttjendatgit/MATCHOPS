using System.Text.Json.Serialization;

namespace MATCHOP.API.Services.AI;

public static class AiIntents
{
    public const string SearchVenue = "SEARCH_VENUE";
    public const string SearchCourt = "SEARCH_COURT";
    public const string CheckAvailability = "CHECK_AVAILABILITY";
    public const string BookCourt = "BOOK_COURT";
    public const string ConfirmBooking = "CONFIRM_BOOKING";
    public const string CancelBooking = "CANCEL_BOOKING";
    public const string ViewBooking = "VIEW_BOOKING";
    public const string Payment = "PAYMENT";
    public const string VenueInformation = "VENUE_INFORMATION";
    public const string CourtInformation = "COURT_INFORMATION";
    public const string PriceInformation = "PRICE_INFORMATION";
    public const string SportRecommendation = "SPORT_RECOMMENDATION";
    public const string LocationRecommendation = "LOCATION_RECOMMENDATION";
    public const string OwnerDashboard = "OWNER_DASHBOARD";
    public const string AdminDashboard = "ADMIN_DASHBOARD";
    public const string CoachDashboard = "COACH_DASHBOARD";
    public const string GeneralChat = "GENERAL_CHAT";
    public const string Faq = "FAQ";
    public const string Unknown = "UNKNOWN";
}

public class AiPlan
{
    public string Intent { get; set; } = AiIntents.Unknown;

    public AiPlanParameters Parameters { get; set; } = new();

    public bool NeedsClarification { get; set; }

    public string? ClarificationQuestion { get; set; }
}

public class AiPlanParameters
{
    public string? Sport { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Ward { get; set; }
    public string? Keyword { get; set; }
    public decimal? MaxPrice { get; set; }
    public decimal? MinRating { get; set; }
    public Guid? VenueId { get; set; }
    public Guid? CourtId { get; set; }
    public Guid? BookingId { get; set; }
    public string? Date { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? VenueName { get; set; }
    public string? CourtName { get; set; }
    public int? PlayerCount { get; set; }
}

public class AiConversationMetadata
{
    public PendingBookingDraft? PendingBooking { get; set; }
}

public class PendingBookingDraft
{
    public Guid CourtId { get; set; }
    public string VenueName { get; set; } = string.Empty;
    public string CourtName { get; set; } = string.Empty;
    public string BookingDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
}

public class AiExecutionContext
{
    public Guid UserId { get; init; }
    public string Role { get; init; } = "USER";
    public AiConversationMetadata Metadata { get; set; } = new();
}

public class AiToolResult
{
    public string Intent { get; set; } = string.Empty;
    public bool Success { get; set; } = true;
    public string? ErrorCode { get; set; }
    public string? Message { get; set; }
    public object? Data { get; set; }
    public bool RequiresConfirmation { get; set; }
    public PendingBookingDraft? PendingBooking { get; set; }
}

public class GroqIntentResponse
{
    [JsonPropertyName("intent")]
    public string Intent { get; set; } = AiIntents.Unknown;

    [JsonPropertyName("parameters")]
    public AiPlanParameters? Parameters { get; set; }

    [JsonPropertyName("needsClarification")]
    public bool NeedsClarification { get; set; }

    [JsonPropertyName("clarificationQuestion")]
    public string? ClarificationQuestion { get; set; }
}
