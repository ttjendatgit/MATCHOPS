using MATCHOP.API.DTOs.Courts;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories.Interfaces;
using MATCHOP.API.Services.Interfaces;

namespace MATCHOP.API.Services;

public class CourtAvailabilityService : ICourtAvailabilityService
{
    private readonly ICourtRepository _courtRepository;
    private readonly IPriceRuleRepository _priceRuleRepository;
    private readonly IBookingSlotRepository _bookingSlotRepository;

    public CourtAvailabilityService(
        ICourtRepository courtRepository,
        IPriceRuleRepository priceRuleRepository,
        IBookingSlotRepository bookingSlotRepository)
    {
        _courtRepository = courtRepository;
        _priceRuleRepository = priceRuleRepository;
        _bookingSlotRepository = bookingSlotRepository;
    }

    public async Task<CourtAvailabilityResponseDto> GetAvailabilityAsync(
        Guid courtId, DateOnly date, CancellationToken cancellationToken = default)
    {
        // ── 1. Validate court + venue + sport ─────────────────────────────────
        var court = await _courtRepository.GetPublicCourtByIdAsync(courtId, cancellationToken);

        if (court is null)
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân đang hoạt động.",
                StatusCodes.Status404NotFound);

        // ── 2. Load price rules then booking slots (sequential — shared DbContext is not thread-safe)
        var priceRules = await _priceRuleRepository.GetPublicCourtPriceRulesAsync(courtId, cancellationToken);
        var existingSlots = await _bookingSlotRepository.GetSlotsByCourtAndDateAsync(courtId, date, cancellationToken);

        // ── 3. Build lookup: startTime → status ───────────────────────────────
        // Nếu 1 slot có nhiều bản ghi (không nên xảy ra nhưng phòng thủ)
        // ưu tiên status theo mức độ nghiêm trọng: BOOKED > BLOCKED > HOLDING > EXPIRED
        var slotStatusMap = existingSlots
            .GroupBy(s => s.SlotStartTime)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(s => GetStatusPriority(s.Status))
                      .First().Status);

        // ── 4. Xác định weekday/weekend ───────────────────────────────────────
        var isWeekend = date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;

        // ── 5. Generate slots 30 phút ─────────────────────────────────────────
        var slots = new List<AvailabilitySlotDto>();
        var current = court.Venue.OpeningTime;
        var closing = court.Venue.ClosingTime;

        while (current < closing)
        {
            var next = current.AddMinutes(30);
            if (next > closing) break;

            // Xác định status
            var slotStatus = "AVAILABLE";
            if (slotStatusMap.TryGetValue(current, out var existingStatus))
            {
                slotStatus = existingStatus switch
                {
                    BookingSlotStatus.HOLDING => "HOLDING",
                    BookingSlotStatus.BOOKED => "BOOKED",
                    BookingSlotStatus.BLOCKED => "BLOCKED",
                    BookingSlotStatus.EXPIRED => "EXPIRED",
                    _ => "AVAILABLE"
                };
            }

            // Tính giá cho slot này
            var price = ResolveSlotPrice(priceRules, current, next, isWeekend);

            slots.Add(new AvailabilitySlotDto
            {
                StartTime = current.ToString("HH:mm"),
                EndTime = next.ToString("HH:mm"),
                Status = slotStatus,
                Price = price
            });

            current = next;
        }

        return new CourtAvailabilityResponseDto
        {
            CourtId = court.Id,
            CourtName = court.Name,
            VenueName = court.Venue.Name,
            Date = date.ToString("yyyy-MM-dd"),
            OpeningTime = court.Venue.OpeningTime.ToString("HH:mm"),
            ClosingTime = court.Venue.ClosingTime.ToString("HH:mm"),
            Slots = slots
        };
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static decimal? ResolveSlotPrice(
        List<PriceRule> rules,
        TimeOnly start,
        TimeOnly end,
        bool isWeekend)
    {
        var rule = rules
            .Where(r =>
                r.StartTime <= start &&
                r.EndTime >= end &&
                (r.DayType == DayType.ALL ||
                 (r.DayType == DayType.WEEKEND && isWeekend) ||
                 (r.DayType == DayType.WEEKDAY && !isWeekend)))
            .OrderByDescending(r => r.DayType != DayType.ALL) // specific trước ALL
            .ThenByDescending(r => r.Priority)
            .FirstOrDefault();

        // WARNING: null = chưa có PriceRule cho khung giờ này
        // Owner cần cấu hình đủ PriceRule để tất cả slot có giá
        if (rule is null) return null;

        return rule.PricePerHour / 2; // 30 phút = nửa giờ
    }

    private static int GetStatusPriority(BookingSlotStatus status) => status switch
    {
        BookingSlotStatus.BOOKED => 4,
        BookingSlotStatus.BLOCKED => 3,
        BookingSlotStatus.HOLDING => 2,
        BookingSlotStatus.EXPIRED => 1,
        _ => 0
    };
}