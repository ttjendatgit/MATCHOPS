using MATCHOP.API.DTOs.Bookings;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories.Interfaces;
using MATCHOP.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class BookingService : IBookingService
{
    private readonly ApplicationDbContext _context;
    private readonly IBookingRepository _bookingRepository;
    private readonly IBookingSlotRepository _bookingSlotRepository;
    private readonly ICourtRepository _courtRepository;
    private readonly IPriceRuleRepository _priceRuleRepository;
    private readonly ICurrentUserService _currentUserService;

    public BookingService(
        ApplicationDbContext context,
        IBookingRepository bookingRepository,
        IBookingSlotRepository bookingSlotRepository,
        ICourtRepository courtRepository,
        IPriceRuleRepository priceRuleRepository,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _bookingRepository = bookingRepository;
        _bookingSlotRepository = bookingSlotRepository;
        _courtRepository = courtRepository;
        _priceRuleRepository = priceRuleRepository;
        _currentUserService = currentUserService;
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private static BookingResponseDto MapToResponse(Booking b) => new()
    {
        Id = b.Id,
        CourtId = b.CourtId,
        CourtName = b.Court?.Name ?? string.Empty,
        VenueName = b.Court?.Venue?.Name ?? string.Empty,
        VenueAddress = b.Court?.Venue?.Address ?? string.Empty,
        SportName = b.Court?.Sport?.Name ?? string.Empty,
        BookingDate = b.BookingDate.ToString("yyyy-MM-dd"),
        StartTime = b.StartTime.ToString("HH:mm"),
        EndTime = b.EndTime.ToString("HH:mm"),
        TotalPrice = b.TotalPrice,
        Status = b.Status.ToString(),
        PaymentStatus = b.PaymentStatus.ToString(),
        BookingType = b.BookingType.ToString(),
        Note = b.Note,
        ExpireAt = b.ExpireAt,
        CreatedAt = b.CreatedAt,
        Slots = b.BookingSlots
            .OrderBy(s => s.SlotStartTime)
            .Select(s => new BookingSlotResponseDto
            {
                Id = s.Id,
                SlotDate = s.SlotDate.ToString("yyyy-MM-dd"),
                SlotStartTime = s.SlotStartTime.ToString("HH:mm"),
                SlotEndTime = s.SlotEndTime.ToString("HH:mm"),
                Status = s.Status.ToString()
            }).ToList()
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Guid GetCurrentUserIdOrThrow()
    {
        if (_currentUserService.UserId is null)
            throw new AppException(
                ErrorCodes.AuthRequired,
                "Bạn chưa đăng nhập.",
                StatusCodes.Status401Unauthorized);

        return _currentUserService.UserId.Value;
    }

    private static bool IsValidTimeBlock(TimeOnly time)
        => time.Minute == 0 || time.Minute == 30;

    private static List<TimeOnly> GenerateSlotStartTimes(TimeOnly start, TimeOnly end)
    {
        var slots = new List<TimeOnly>();
        var current = start;
        while (current < end)
        {
            slots.Add(current);
            current = current.AddMinutes(30);
        }
        return slots;
    }

    private static decimal CalculateTotalPrice(
        List<PriceRule> rules,
        TimeOnly start,
        TimeOnly end,
        bool isWeekend)
    {
        decimal total = 0;
        var current = start;

        while (current < end)
        {
            var next = current.AddMinutes(30);

            // Tìm rule phù hợp nhất cho slot này
            var rule = rules
                .Where(r =>
                    r.StartTime <= current &&
                    r.EndTime >= next &&
                    (r.DayType == DayType.ALL ||
                     (r.DayType == DayType.WEEKEND && isWeekend) ||
                     (r.DayType == DayType.WEEKDAY && !isWeekend)))
                .OrderByDescending(r => r.DayType != DayType.ALL) // specific hơn ALL
                .ThenByDescending(r => r.Priority)
                .FirstOrDefault();

            if (rule is null)
                throw new AppException(
                    ErrorCodes.PriceRuleNotFound,
                    $"Không tìm thấy quy tắc giá cho khung giờ " +
                    $"{current:HH:mm} - {next:HH:mm}.",
                    StatusCodes.Status400BadRequest);

            total += rule.PricePerHour / 2; // 30 phút = nửa giờ
            current = next;
        }

        return total;
    }

    // ── Public methods ────────────────────────────────────────────────────────

    public async Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto)
    {
        var userId = GetCurrentUserIdOrThrow();
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);

        // ── 1. Validate time block ────────────────────────────────────────────
        if (!IsValidTimeBlock(dto.StartTime) || !IsValidTimeBlock(dto.EndTime))
            throw new AppException(
                ErrorCodes.InvalidTimeBlock,
                "StartTime và EndTime phải đúng block 30 phút (HH:00 hoặc HH:30).");

        if (dto.StartTime >= dto.EndTime)
            throw new AppException(
                ErrorCodes.InvalidTimeRange,
                "StartTime phải nhỏ hơn EndTime.");

        var duration = dto.EndTime - dto.StartTime;

        if (duration.TotalMinutes < 30)
            throw new AppException(
                ErrorCodes.BookingDurationTooShort,
                "Thời lượng đặt sân tối thiểu là 30 phút.");

        if (duration.TotalHours > 4)
            throw new AppException(
                ErrorCodes.BookingDurationTooLong,
                "Thời lượng đặt sân tối đa là 4 giờ.");

        // ── 2. Validate không đặt trong quá khứ ──────────────────────────────
        if (dto.BookingDate < today)
            throw new AppException(
                ErrorCodes.BookingInPast,
                "Không thể đặt sân trong quá khứ.");

        if (dto.BookingDate == today)
        {
            // So sánh với giờ hiện tại theo UTC
            var nowTimeOnly = TimeOnly.FromDateTime(now);
            if (dto.StartTime <= nowTimeOnly)
                throw new AppException(
                    ErrorCodes.BookingInPast,
                    "Không thể đặt khung giờ đã qua trong ngày hôm nay.");
        }

        // ── 3. Load court (đã validate ACTIVE + venue ACTIVE + sport ACTIVE) ──
        var court = await _courtRepository.GetPublicCourtByIdAsync(dto.CourtId);

        if (court is null)
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân đang hoạt động.",
                StatusCodes.Status404NotFound);

        // ── 4. Validate giờ mở cửa ────────────────────────────────────────────
        if (dto.StartTime < court.Venue.OpeningTime || dto.EndTime > court.Venue.ClosingTime)
            throw new AppException(
                ErrorCodes.OutsideOpeningHours,
                $"Thời gian đặt phải trong giờ mở cửa " +
                $"({court.Venue.OpeningTime:HH:mm} - {court.Venue.ClosingTime:HH:mm}).");

        // ── 5. Load price rules và tính giá ───────────────────────────────────
        var priceRules = await _priceRuleRepository
            .GetPublicCourtPriceRulesAsync(dto.CourtId);

        var isWeekend = dto.BookingDate.DayOfWeek is
            DayOfWeek.Saturday or DayOfWeek.Sunday;

        var totalPrice = CalculateTotalPrice(
            priceRules, dto.StartTime, dto.EndTime, isWeekend);

        // ── 6. Generate slots cần tạo ─────────────────────────────────────────
        var slotStartTimes = GenerateSlotStartTimes(dto.StartTime, dto.EndTime);

        // ── 7. Transaction: check conflict + insert ───────────────────────────
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Check conflict bên trong transaction
            var hasConflict = await _bookingSlotRepository.HasConflictAsync(
                dto.CourtId, dto.BookingDate, slotStartTimes);

            if (hasConflict)
                throw new AppException(
                    ErrorCodes.SlotAlreadyBooked,
                    "Khung giờ này đã được đặt. Vui lòng chọn khung giờ khác.",
                    StatusCodes.Status409Conflict);

            // Tạo Booking
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                VenueId = court.VenueId,
                CourtId = court.Id,
                SportId = court.SportId,
                BookingDate = dto.BookingDate,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                TotalPrice = totalPrice,
                Status = BookingStatus.PENDING_PAYMENT,
                PaymentStatus = BookingPaymentStatus.UNPAID,
                BookingType = BookingType.ONLINE,
                Note = dto.Note?.Trim(),
                ExpireAt = DateTime.UtcNow.AddMinutes(10),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _bookingRepository.AddAsync(booking);
            await _bookingRepository.SaveChangesAsync();

            // Tạo BookingSlots (HOLDING)
            var slots = slotStartTimes.Select(start => new BookingSlot
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                CourtId = court.Id,
                SlotDate = dto.BookingDate,
                SlotStartTime = start,
                SlotEndTime = start.AddMinutes(30),
                Status = BookingSlotStatus.HOLDING,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            await _bookingRepository.AddSlotsAsync(slots);
            await _bookingRepository.SaveChangesAsync();

            await transaction.CommitAsync();

            // Load lại đầy đủ để trả response
            var created = await _bookingRepository.GetByIdAsync(booking.Id);
            return MapToResponse(created!);
        }
        catch (DbUpdateException ex)
            when (ex.InnerException?.Message
                .Contains("ux_booking_slots_active", StringComparison.OrdinalIgnoreCase) == true)
        {
            // Partial unique index bắt race condition đồng thời
            await transaction.RollbackAsync();
            throw new AppException(
                ErrorCodes.SlotAlreadyBooked,
                "Khung giờ này vừa được đặt bởi người khác. Vui lòng chọn khung giờ khác.",
                StatusCodes.Status409Conflict);
        }
        catch (AppException)
        {
            await transaction.RollbackAsync();
            throw;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<List<BookingResponseDto>> GetMyBookingsAsync()
    {
        var userId = GetCurrentUserIdOrThrow();
        var bookings = await _bookingRepository.GetByUserIdAsync(userId);
        return bookings.Select(MapToResponse).ToList();
    }

    public async Task<BookingResponseDto> GetMyBookingByIdAsync(Guid id)
    {
        var userId = GetCurrentUserIdOrThrow();

        if (id == Guid.Empty)
            throw new AppException(ErrorCodes.ValidationError, "BookingId không hợp lệ.");

        var booking = await _bookingRepository.GetByIdAndUserIdAsync(id, userId);

        if (booking is null)
            throw new AppException(
                ErrorCodes.BookingNotFound,
                "Không tìm thấy booking của bạn.",
                StatusCodes.Status404NotFound);

        return MapToResponse(booking);
    }
}