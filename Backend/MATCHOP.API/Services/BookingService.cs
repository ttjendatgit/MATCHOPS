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
    private readonly ILogger<BookingService> _logger;
    private readonly int _slotMinutes;
    private readonly int _pendingExpireMinutes;
    private readonly int _minBookingMinutes;
    private readonly int _maxBookingHours;

    public BookingService(
        ApplicationDbContext context,
        IBookingRepository bookingRepository,
        IBookingSlotRepository bookingSlotRepository,
        ICourtRepository courtRepository,
        IPriceRuleRepository priceRuleRepository,
        ICurrentUserService currentUserService,
        ILogger<BookingService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _bookingRepository = bookingRepository;
        _bookingSlotRepository = bookingSlotRepository;
        _courtRepository = courtRepository;
        _priceRuleRepository = priceRuleRepository;
        _currentUserService = currentUserService;
        _logger = logger;
        _slotMinutes = configuration.GetValue("Booking:SlotMinutes", 30);
        _pendingExpireMinutes = configuration.GetValue("Booking:PendingExpireMinutes", 10);
        _minBookingMinutes = configuration.GetValue("Booking:MinBookingMinutes", 30);
        _maxBookingHours = configuration.GetValue("Booking:MaxBookingHours", 4);
    }

    // ── Public: User ──────────────────────────────────────────────────────────

    public async Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserIdOrThrow();
        _logger.LogInformation("[BOOKING] UserId={UserId}, CourtId={CourtId}, Date={Date}, Start={Start}, End={End}",
            userId, dto.CourtId, dto.BookingDate, dto.StartTime, dto.EndTime);
        var court = await GetActivePublicCourtOrThrowAsync(dto.CourtId, cancellationToken);

        return await CreateBookingCoreAsync(
            court: court,
            bookingDate: dto.BookingDate,
            startTime: dto.StartTime,
            endTime: dto.EndTime,
            userId: userId,
            ownerId: null,
            bookingType: BookingType.ONLINE,
            bookingSource: BookingSource.MATCHOP,
            customerName: null,
            customerPhone: null,
            note: dto.Note,
            initialBookingStatus: BookingStatus.PENDING_PAYMENT,
            initialPaymentStatus: BookingPaymentStatus.UNPAID,
            initialSlotStatus: BookingSlotStatus.HOLDING,
            expireAt: DateTime.UtcNow.AddMinutes(_pendingExpireMinutes),
            createSuccessPayment: false,
            cancellationToken: cancellationToken);
    }

    public async Task<List<BookingResponseDto>> GetMyBookingsAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserIdOrThrow();

        // Chỉ expire booking của user này, không phải toàn hệ thống
        var pendingExpired = await _bookingRepository
            .GetPendingExpiredByUserIdAsync(userId, DateTime.UtcNow, cancellationToken);

        if (pendingExpired.Count > 0)
        {
            foreach (var b in pendingExpired)
                MarkBookingExpired(b);
            await _bookingRepository.SaveChangesAsync(cancellationToken);
        }

        var bookings = await _bookingRepository.GetByUserIdAsync(userId, cancellationToken);
        return bookings.Select(MapToResponse).ToList();
    }

    public async Task<BookingResponseDto> GetMyBookingByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserIdOrThrow();
        ValidateGuid(id, "BookingId");

        var booking = await _bookingRepository.GetByIdAndUserIdAsync(id, userId, cancellationToken);
        if (booking is null)
            throw new AppException(
                ErrorCodes.BookingNotFound,
                "Không tìm thấy booking của bạn.",
                StatusCodes.Status404NotFound);

        await ExpireBookingIfNeededAsync(booking, cancellationToken);
        return MapToResponse(booking);
    }

    public async Task<BookingResponseDto> PayMyBookingMockAsync(Guid id, MockPaymentRequestDto dto, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserIdOrThrow();
        ValidateGuid(id, "BookingId");

        // Load trước khi mở transaction
        var booking = await _bookingRepository.GetByIdAndUserIdAsync(id, userId, cancellationToken);
        if (booking is null)
            throw new AppException(
                ErrorCodes.BookingNotFound,
                "Không tìm thấy booking của bạn.",
                StatusCodes.Status404NotFound);

        // Kiểm tra expire trước khi mở transaction
        if (booking.Status == BookingStatus.PENDING_PAYMENT &&
            booking.ExpireAt is not null &&
            booking.ExpireAt <= DateTime.UtcNow)
        {
            MarkBookingExpired(booking);
            await _bookingRepository.SaveChangesAsync(cancellationToken);
            throw new AppException(
                ErrorCodes.BookingExpired,
                "Booking đã hết hạn thanh toán. Vui lòng đặt lại khung giờ.",
                StatusCodes.Status400BadRequest);
        }

        if (booking.Status != BookingStatus.PENDING_PAYMENT ||
            booking.PaymentStatus != BookingPaymentStatus.UNPAID)
            throw new AppException(
                ErrorCodes.BookingAlreadyPaid,
                "Booking này không còn ở trạng thái chờ thanh toán.",
                StatusCodes.Status400BadRequest);

        // Chỉ mở transaction khi chắc chắn sẽ write
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            booking.Status = BookingStatus.CONFIRMED;
            booking.PaymentStatus = BookingPaymentStatus.PAID;
            booking.ExpireAt = null;
            booking.UpdatedAt = DateTime.UtcNow;

            foreach (var slot in booking.BookingSlots
                .Where(s => s.Status == BookingSlotStatus.HOLDING))
            {
                slot.Status = BookingSlotStatus.BOOKED;
                slot.UpdatedAt = DateTime.UtcNow;
            }

            _context.Payments.Add(new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                UserId = userId,
                Amount = booking.TotalPrice,
                Method = PaymentMethod.MOCK,
                Status = PaymentTransactionStatus.SUCCESS,
                TransactionCode = string.IsNullOrWhiteSpace(dto.TransactionCode)
                    ? $"MOCK-{DateTime.UtcNow:yyyyMMddHHmmss}-{booking.Id:N}"[..36]
                    : dto.TransactionCode.Trim(),
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await _bookingRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var updated = await _bookingRepository.GetByIdAsync(booking.Id, cancellationToken);
            return MapToResponse(updated!);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BookingResponseDto> PayMyBookingCashAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserIdOrThrow();
        ValidateGuid(id, "BookingId");

        var booking = await _bookingRepository.GetByIdAndUserIdAsync(id, userId, cancellationToken);
        if (booking is null)
            throw new AppException(
                ErrorCodes.BookingNotFound,
                "Không tìm thấy booking của bạn.",
                StatusCodes.Status404NotFound);

        // Cash payment vẫn cho phép thanh toán trước khi booking hết hạn —
        // không expire booking ở đây, chỉ chặn khi đã hết hạn hoàn toàn.
        if (booking.Status != BookingStatus.PENDING_PAYMENT ||
            booking.PaymentStatus != BookingPaymentStatus.UNPAID)
            throw new AppException(
                ErrorCodes.BookingAlreadyPaid,
                "Booking này không còn ở trạng thái chờ thanh toán.",
                StatusCodes.Status400BadRequest);

        if (booking.Status == BookingStatus.PENDING_PAYMENT &&
            booking.ExpireAt is not null &&
            booking.ExpireAt <= DateTime.UtcNow)
        {
            MarkBookingExpired(booking);
            await _bookingRepository.SaveChangesAsync(cancellationToken);
            throw new AppException(
                ErrorCodes.BookingExpired,
                "Booking đã hết hạn thanh toán. Vui lòng đặt lại khung giờ.",
                StatusCodes.Status400BadRequest);
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            booking.Status = BookingStatus.CONFIRMED;
            booking.PaymentStatus = BookingPaymentStatus.PAID;
            booking.ExpireAt = null;
            booking.UpdatedAt = DateTime.UtcNow;

            foreach (var slot in booking.BookingSlots
                .Where(s => s.Status == BookingSlotStatus.HOLDING))
            {
                slot.Status = BookingSlotStatus.BOOKED;
                slot.UpdatedAt = DateTime.UtcNow;
            }

            _context.Payments.Add(new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                UserId = userId,
                Amount = booking.TotalPrice,
                Method = PaymentMethod.CASH,
                Status = PaymentTransactionStatus.SUCCESS,
                TransactionCode = $"CASH-{DateTime.UtcNow:yyyyMMddHHmmss}-{booking.Id:N}"[..36],
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await _bookingRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var updated = await _bookingRepository.GetByIdAsync(booking.Id, cancellationToken);
            return MapToResponse(updated!);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BookingResponseDto> CancelMyBookingAsync(Guid id, CancelBookingDto dto, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserIdOrThrow();
        ValidateGuid(id, "BookingId");

        var booking = await _bookingRepository.GetByIdAndUserIdAsync(id, userId, cancellationToken);
        if (booking is null)
            throw new AppException(
                ErrorCodes.BookingNotFound,
                "Không tìm thấy booking của bạn.",
                StatusCodes.Status404NotFound);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            CancelBooking(booking, BookingStatus.CANCELLED_BY_USER, dto.Reason);
            await _bookingRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var updated = await _bookingRepository.GetByIdAsync(booking.Id, cancellationToken);
            return MapToResponse(updated!);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    // ── Public: Owner ─────────────────────────────────────────────────────────

    public async Task<List<BookingResponseDto>> GetOwnerBookingsAsync(
        DateOnly? date,
        Guid? venueId,
        Guid? courtId,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        // Expire booking pending toàn venue của owner này
        var pendingExpired = await _bookingRepository
            .GetPendingExpiredByOwnerIdAsync(ownerId, DateTime.UtcNow, cancellationToken);

        if (pendingExpired.Count > 0)
        {
            foreach (var b in pendingExpired)
                MarkBookingExpired(b);
            await _bookingRepository.SaveChangesAsync(cancellationToken);
        }

        var bookings = await _bookingRepository.GetByOwnerIdAsync(ownerId, date, venueId, courtId, cancellationToken);
        return bookings.Select(MapToResponse).ToList();
    }

    public async Task<BookingResponseDto> GetOwnerBookingByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();
        ValidateGuid(id, "BookingId");

        var booking = await _bookingRepository.GetByIdAndOwnerIdAsync(id, ownerId, cancellationToken);
        if (booking is null)
            throw new AppException(
                ErrorCodes.BookingNotFound,
                "Không tìm thấy booking thuộc sân của bạn.",
                StatusCodes.Status404NotFound);

        await ExpireBookingIfNeededAsync(booking, cancellationToken);
        return MapToResponse(booking);
    }

    public async Task<BookingResponseDto> CreateOfflineBookingAsync(CreateOfflineBookingDto dto, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        var court = await _courtRepository.GetOwnerCourtByIdAsync(dto.CourtId, ownerId, cancellationToken);
        if (court is null)
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân của bạn.",
                StatusCodes.Status404NotFound);

        EnsureCourtCanBeBooked(court);

        return await CreateBookingCoreAsync(
            court: court,
            bookingDate: dto.BookingDate,
            startTime: dto.StartTime,
            endTime: dto.EndTime,
            userId: null,
            ownerId: ownerId,
            bookingType: BookingType.OFFLINE,
            bookingSource: BookingSource.OTHER,
            customerName: dto.CustomerName,
            customerPhone: dto.CustomerPhone,
            note: dto.Note,
            initialBookingStatus: BookingStatus.CONFIRMED,
            initialPaymentStatus: BookingPaymentStatus.PAID,
            initialSlotStatus: BookingSlotStatus.BOOKED,
            expireAt: null,
            createSuccessPayment: true,
            cancellationToken: cancellationToken);
    }

    public async Task<BookingResponseDto> CreateExternalBookingAsync(
        CreateExternalBookingDto dto,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        if (dto.BookingSource == BookingSource.MATCHOP)
            throw new AppException(
                ErrorCodes.ValidationError,
                "Nguồn booking phải là Zalo, Facebook, Điện thoại, Trực tiếp hoặc Khác.",
                StatusCodes.Status400BadRequest);

        var court = await _courtRepository.GetOwnerCourtByIdAsync(dto.CourtId, ownerId, cancellationToken);
        if (court is null)
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân của bạn.",
                StatusCodes.Status404NotFound);

        EnsureCourtCanBeBooked(court);

        var result = await CreateBookingCoreAsync(
            court: court,
            bookingDate: dto.BookingDate,
            startTime: dto.StartTime,
            endTime: dto.EndTime,
            userId: null,
            ownerId: ownerId,
            bookingType: BookingType.OFFLINE,
            bookingSource: dto.BookingSource,
            customerName: dto.CustomerName,
            customerPhone: dto.CustomerPhone,
            note: dto.Notes,
            initialBookingStatus: BookingStatus.CONFIRMED,
            initialPaymentStatus: BookingPaymentStatus.PAID,
            initialSlotStatus: BookingSlotStatus.BOOKED,
            expireAt: null,
            createSuccessPayment: true,
            cancellationToken: cancellationToken);

        _logger.LogInformation(
            "[EXTERNAL_BOOKING] Created. OwnerId={OwnerId}, BookingId={BookingId}, CourtId={CourtId}, Source={Source}, Date={Date}, Start={Start}, End={End}",
            ownerId, result.Id, dto.CourtId, dto.BookingSource, dto.BookingDate, dto.StartTime, dto.EndTime);

        return result;
    }

    public async Task<BookingResponseDto> UpdateExternalBookingAsync(
        Guid id,
        UpdateExternalBookingDto dto,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();
        ValidateGuid(id, "BookingId");

        var booking = await _bookingRepository.GetByIdAndOwnerIdAsync(id, ownerId, cancellationToken);
        if (booking is null)
            throw new AppException(
                ErrorCodes.BookingNotFound,
                "Không tìm thấy booking thuộc sân của bạn.",
                StatusCodes.Status404NotFound);

        if (booking.BookingSource == BookingSource.MATCHOP)
            throw new AppException(
                ErrorCodes.ValidationError,
                "Chỉ có thể cập nhật lịch ngoài hệ thống.",
                StatusCodes.Status400BadRequest);

        if (booking.Status is BookingStatus.CANCELLED_BY_USER
            or BookingStatus.CANCELLED_BY_OWNER
            or BookingStatus.CANCELLED_BY_ADMIN
            or BookingStatus.EXPIRED
            or BookingStatus.COMPLETED)
            throw new AppException(
                ErrorCodes.ValidationError,
                "Booking này không thể chỉnh sửa ở trạng thái hiện tại.",
                StatusCodes.Status400BadRequest);

        if (dto.BookingSource == BookingSource.MATCHOP)
            throw new AppException(
                ErrorCodes.ValidationError,
                "Nguồn booking không hợp lệ.",
                StatusCodes.Status400BadRequest);

        var newDate = dto.BookingDate ?? booking.BookingDate;
        var newStart = dto.StartTime ?? booking.StartTime;
        var newEnd = dto.EndTime ?? booking.EndTime;

        if (newStart >= newEnd)
            throw new AppException(
                ErrorCodes.ValidationError,
                "StartTime phải nhỏ hơn EndTime.",
                StatusCodes.Status400BadRequest);

        var court = booking.Court;
        ValidateBookingTime(newDate, newStart, newEnd);
        EnsureCourtCanBeBooked(court);

        if (newStart < court.Venue.OpeningTime || newEnd > court.Venue.ClosingTime)
            throw new AppException(
                ErrorCodes.OutsideOpeningHours,
                $"Thời gian đặt phải trong giờ mở cửa " +
                $"({court.Venue.OpeningTime:HH:mm} - {court.Venue.ClosingTime:HH:mm}).");

        var timeChanged = newDate != booking.BookingDate ||
                          newStart != booking.StartTime ||
                          newEnd != booking.EndTime;

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            if (timeChanged)
            {
                var slotStartTimes = GenerateSlotStartTimes(newStart, newEnd);
                var hasConflict = await _bookingSlotRepository.HasConflictAsync(
                    court.Id, newDate, slotStartTimes, excludeBookingId: booking.Id, cancellationToken);

                if (hasConflict)
                    throw new AppException(
                        ErrorCodes.SlotAlreadyBooked,
                        "Khung giờ này đã được đặt hoặc bị khóa. Vui lòng chọn khung giờ khác.",
                        StatusCodes.Status409Conflict);

                foreach (var slot in booking.BookingSlots.Where(s =>
                    s.Status == BookingSlotStatus.HOLDING ||
                    s.Status == BookingSlotStatus.BOOKED))
                {
                    slot.Status = BookingSlotStatus.CANCELLED;
                    slot.UpdatedAt = DateTime.UtcNow;
                }

                var now = DateTime.UtcNow;
                var newSlots = slotStartTimes.Select(start => new BookingSlot
                {
                    Id = Guid.NewGuid(),
                    BookingId = booking.Id,
                    CourtId = court.Id,
                    SlotDate = newDate,
                    SlotStartTime = start,
                    SlotEndTime = start.AddMinutes(_slotMinutes),
                    Status = BookingSlotStatus.BOOKED,
                    CreatedAt = now,
                    UpdatedAt = now
                }).ToList();

                await _bookingRepository.AddSlotsAsync(newSlots, cancellationToken);

                booking.BookingDate = newDate;
                booking.StartTime = newStart;
                booking.EndTime = newEnd;

                var priceRules = await _priceRuleRepository.GetPublicCourtPriceRulesAsync(court.Id, cancellationToken);
                var isWeekend = newDate.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
                booking.TotalPrice = CalculateTotalPrice(priceRules, newStart, newEnd, isWeekend);
            }

            if (dto.BookingSource.HasValue)
                booking.BookingSource = dto.BookingSource.Value;

            if (dto.CustomerName is not null)
                booking.CustomerName = NormalizeOptionalText(dto.CustomerName);

            if (dto.CustomerPhone is not null)
                booking.CustomerPhone = NormalizeOptionalText(dto.CustomerPhone);

            if (dto.Notes is not null)
                booking.Note = NormalizeOptionalText(dto.Notes);

            booking.UpdatedAt = DateTime.UtcNow;
            await _bookingRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "[EXTERNAL_BOOKING] Updated. OwnerId={OwnerId}, BookingId={BookingId}, TimeChanged={TimeChanged}",
                ownerId, booking.Id, timeChanged);

            var updated = await _bookingRepository.GetByIdAsync(booking.Id, cancellationToken);
            return MapToResponse(updated!);
        }
        catch (DbUpdateException ex)
            when (ex.InnerException?.Message
                .Contains("ux_booking_slots_active", StringComparison.OrdinalIgnoreCase) == true)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new AppException(
                ErrorCodes.SlotAlreadyBooked,
                "Khung giờ này vừa được đặt bởi người khác. Vui lòng chọn khung giờ khác.",
                StatusCodes.Status409Conflict);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<OwnerCourtCalendarResponseDto> GetOwnerCourtCalendarAsync(
        Guid courtId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();
        ValidateGuid(courtId, "CourtId");

        var court = await _courtRepository.GetOwnerCourtByIdAsync(courtId, ownerId, cancellationToken);
        if (court is null)
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân của bạn.",
                StatusCodes.Status404NotFound);

        var bookings = await _bookingRepository.GetCalendarBookingsByCourtAndDateAsync(
            courtId, date, cancellationToken);

        var blocks = await _context.CourtBlocks
            .AsNoTracking()
            .Where(b =>
                b.CourtId == courtId &&
                b.BlockDate == date &&
                b.Status == CourtBlockStatus.ACTIVE)
            .OrderBy(b => b.StartTime)
            .ToListAsync(cancellationToken);

        var entries = new List<CourtCalendarEntryDto>();

        foreach (var booking in bookings)
        {
            entries.Add(new CourtCalendarEntryDto
            {
                BookingId = booking.Id,
                EntryType = "BOOKING",
                StartTime = booking.StartTime.ToString("HH:mm"),
                EndTime = booking.EndTime.ToString("HH:mm"),
                Status = booking.Status.ToString(),
                BookingSource = booking.BookingSource.ToString(),
                CustomerName = booking.CustomerName,
                Note = booking.Note
            });
        }

        foreach (var block in blocks)
        {
            entries.Add(new CourtCalendarEntryDto
            {
                BlockId = block.Id,
                EntryType = "BLOCK",
                StartTime = block.StartTime.ToString("HH:mm"),
                EndTime = block.EndTime.ToString("HH:mm"),
                Status = "BLOCKED",
                BookingSource = null,
                CustomerName = null,
                Note = block.Reason
            });
        }

        entries = entries
            .OrderBy(e => e.StartTime)
            .ToList();

        return new OwnerCourtCalendarResponseDto
        {
            CourtId = court.Id,
            CourtName = court.Name,
            VenueName = court.Venue.Name,
            Date = date.ToString("yyyy-MM-dd"),
            OpeningTime = court.Venue.OpeningTime.ToString("HH:mm"),
            ClosingTime = court.Venue.ClosingTime.ToString("HH:mm"),
            Entries = entries
        };
    }

    public async Task<BookingResponseDto> CancelOwnerBookingAsync(Guid id, CancelBookingDto dto, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();
        ValidateGuid(id, "BookingId");

        var booking = await _bookingRepository.GetByIdAndOwnerIdAsync(id, ownerId, cancellationToken);
        if (booking is null)
            throw new AppException(
                ErrorCodes.BookingNotFound,
                "Không tìm thấy booking thuộc sân của bạn.",
                StatusCodes.Status404NotFound);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            CancelBooking(booking, BookingStatus.CANCELLED_BY_OWNER, dto.Reason);
            await _bookingRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            if (booking.BookingSource != BookingSource.MATCHOP)
            {
                _logger.LogInformation(
                    "[EXTERNAL_BOOKING] Cancelled. OwnerId={OwnerId}, BookingId={BookingId}, CourtId={CourtId}, Source={Source}",
                    ownerId, booking.Id, booking.CourtId, booking.BookingSource);
            }

            var updated = await _bookingRepository.GetByIdAsync(booking.Id, cancellationToken);
            return MapToResponse(updated!);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BookingResponseDto> ConfirmOwnerBookingAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();
        ValidateGuid(id, "BookingId");

        var booking = await _bookingRepository.GetByIdAndOwnerIdAsync(id, ownerId, cancellationToken);
        if (booking is null)
            throw new AppException(
                ErrorCodes.BookingNotFound,
                "Không tìm thấy booking thuộc sân của bạn.",
                StatusCodes.Status404NotFound);

        if (booking.Status != BookingStatus.PENDING_PAYMENT)
            throw new AppException(
                ErrorCodes.ValidationError,
                "Chỉ có thể xác nhận booking đang chờ thanh toán.",
                StatusCodes.Status400BadRequest);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            booking.Status = BookingStatus.CONFIRMED;
            booking.PaymentStatus = BookingPaymentStatus.PAID;
            booking.ExpireAt = null;
            booking.UpdatedAt = DateTime.UtcNow;

            foreach (var slot in booking.BookingSlots.Where(s => s.Status == BookingSlotStatus.HOLDING))
            {
                slot.Status = BookingSlotStatus.BOOKED;
                slot.UpdatedAt = DateTime.UtcNow;
            }

            await _bookingRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var updated = await _bookingRepository.GetByIdAsync(booking.Id, cancellationToken);
            return MapToResponse(updated!);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BookingResponseDto> CompleteOwnerBookingAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();
        ValidateGuid(id, "BookingId");

        var booking = await _bookingRepository.GetByIdAndOwnerIdAsync(id, ownerId, cancellationToken);
        if (booking is null)
            throw new AppException(
                ErrorCodes.BookingNotFound,
                "Không tìm thấy booking thuộc sân của bạn.",
                StatusCodes.Status404NotFound);

        if (booking.Status != BookingStatus.CONFIRMED)
            throw new AppException(
                ErrorCodes.ValidationError,
                "Chỉ có thể hoàn tất booking đã được xác nhận.",
                StatusCodes.Status400BadRequest);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var nowTime = TimeOnly.FromDateTime(DateTime.UtcNow);

        if (booking.BookingDate > today ||
            (booking.BookingDate == today && booking.EndTime > nowTime))
            throw new AppException(
                ErrorCodes.ValidationError,
                "Chỉ có thể hoàn tất booking sau khi khung giờ kết thúc.",
                StatusCodes.Status400BadRequest);

        booking.Status = BookingStatus.COMPLETED;
        booking.UpdatedAt = DateTime.UtcNow;
        await _bookingRepository.SaveChangesAsync(cancellationToken);

        var updated = await _bookingRepository.GetByIdAsync(booking.Id, cancellationToken);
        return MapToResponse(updated!);
    }

    // ── Public: System ────────────────────────────────────────────────────────

    public async Task<int> ExpirePendingBookingsAsync(DateTime utcNow, CancellationToken cancellationToken = default)
    {
        var expiredBookings = await _bookingRepository
            .GetExpiredPendingBookingsAsync(utcNow, batchSize: 100, cancellationToken);

        if (expiredBookings.Count == 0) return 0;

        foreach (var booking in expiredBookings)
            MarkBookingExpired(booking);

        await _bookingRepository.SaveChangesAsync(cancellationToken);
        return expiredBookings.Count;
    }

    // ── Public: Admin ─────────────────────────────────────────────────────────
    public async Task<List<BookingResponseDto>> GetAllBookingsAsync(CancellationToken cancellationToken = default)
    {
        // Expire pending bookings first
        var pendingExpired = await _bookingRepository
            .GetExpiredPendingBookingsAsync(DateTime.UtcNow, batchSize: 100, cancellationToken);
        if (pendingExpired.Count > 0)
        {
            foreach (var b in pendingExpired)
                MarkBookingExpired(b);
            await _bookingRepository.SaveChangesAsync(cancellationToken);
        }

        var bookings = await _bookingRepository.GetAllAsync(cancellationToken);
        return bookings.Select(MapToResponse).ToList();
    }

    public async Task<BookingResponseDto> GetBookingByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        ValidateGuid(id, "BookingId");
        var booking = await _bookingRepository.GetByIdAsync(id, cancellationToken);
        if (booking is null)
            throw new AppException(ErrorCodes.BookingNotFound, "Không tìm thấy booking.", StatusCodes.Status404NotFound);
        await ExpireBookingIfNeededAsync(booking, cancellationToken);
        return MapToResponse(booking);
    }

    public async Task<BookingResponseDto> CancelBookingAsync(Guid id, CancelBookingDto dto, CancellationToken cancellationToken = default)
    {
        ValidateGuid(id, "BookingId");
        var booking = await _bookingRepository.GetByIdAsync(id, cancellationToken);
        if (booking is null)
            throw new AppException(ErrorCodes.BookingNotFound, "Không tìm thấy booking.", StatusCodes.Status404NotFound);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            CancelBooking(booking, BookingStatus.CANCELLED_BY_ADMIN, dto.Reason);
            await _bookingRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            var updated = await _bookingRepository.GetByIdAsync(booking.Id, cancellationToken);
            return MapToResponse(updated!);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BookingResponseDto> ConfirmBookingAsync(Guid id, CancellationToken cancellationToken = default)
    {
        ValidateGuid(id, "BookingId");
        var booking = await _bookingRepository.GetByIdAsync(id, cancellationToken);
        if (booking is null)
            throw new AppException(ErrorCodes.BookingNotFound, "Không tìm thấy booking.", StatusCodes.Status404NotFound);
        if (booking.Status != BookingStatus.PENDING_PAYMENT)
            throw new AppException(ErrorCodes.ValidationError, "Chỉ có thể xác nhận booking đang chờ thanh toán.", StatusCodes.Status400BadRequest);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            booking.Status = BookingStatus.CONFIRMED;
            booking.PaymentStatus = BookingPaymentStatus.PAID;
            booking.ExpireAt = null;
            booking.UpdatedAt = DateTime.UtcNow;
            foreach (var slot in booking.BookingSlots.Where(s => s.Status == BookingSlotStatus.HOLDING))
            {
                slot.Status = BookingSlotStatus.BOOKED;
                slot.UpdatedAt = DateTime.UtcNow;
            }
            await _bookingRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            var updated = await _bookingRepository.GetByIdAsync(booking.Id, cancellationToken);
            return MapToResponse(updated!);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BookingResponseDto> CompleteBookingAsync(Guid id, CancellationToken cancellationToken = default)
    {
        ValidateGuid(id, "BookingId");
        var booking = await _bookingRepository.GetByIdAsync(id, cancellationToken);
        if (booking is null)
            throw new AppException(ErrorCodes.BookingNotFound, "Không tìm thấy booking.", StatusCodes.Status404NotFound);
        if (booking.Status != BookingStatus.CONFIRMED)
            throw new AppException(ErrorCodes.ValidationError, "Chỉ có thể hoàn tất booking đã được xác nhận.", StatusCodes.Status400BadRequest);

        booking.Status = BookingStatus.COMPLETED;
        booking.UpdatedAt = DateTime.UtcNow;
        await _bookingRepository.SaveChangesAsync(cancellationToken);
        var updated = await _bookingRepository.GetByIdAsync(booking.Id, cancellationToken);
        return MapToResponse(updated!);
    }

    // ── Core booking logic ────────────────────────────────────────────────────

    private async Task<BookingResponseDto> CreateBookingCoreAsync(
        Court court,
        DateOnly bookingDate,
        TimeOnly startTime,
        TimeOnly endTime,
        Guid? userId,
        Guid? ownerId,
        BookingType bookingType,
        BookingSource bookingSource,
        string? customerName,
        string? customerPhone,
        string? note,
        BookingStatus initialBookingStatus,
        BookingPaymentStatus initialPaymentStatus,
        BookingSlotStatus initialSlotStatus,
        DateTime? expireAt,
        bool createSuccessPayment,
        CancellationToken cancellationToken = default)
    {
        ValidateBookingTime(bookingDate, startTime, endTime);
        EnsureCourtCanBeBooked(court);

        if (startTime < court.Venue.OpeningTime || endTime > court.Venue.ClosingTime)
            throw new AppException(
                ErrorCodes.OutsideOpeningHours,
                $"Thời gian đặt phải trong giờ mở cửa " +
                $"({court.Venue.OpeningTime:HH:mm} - {court.Venue.ClosingTime:HH:mm}).");

        var priceRules = await _priceRuleRepository.GetPublicCourtPriceRulesAsync(court.Id, cancellationToken);
        var isWeekend = bookingDate.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
        var totalPrice = CalculateTotalPrice(priceRules, startTime, endTime, isWeekend);
        var slotStartTimes = GenerateSlotStartTimes(startTime, endTime);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Kiểm tra conflict trong transaction
            var hasConflict = await _bookingSlotRepository.HasConflictAsync(
                court.Id, bookingDate, slotStartTimes, cancellationToken: cancellationToken);

            if (hasConflict)
            {
                _logger.LogWarning("[BOOKING] Slot conflict detected. CourtId={CourtId}, Date={Date}, Slots={Slots}",
                    court.Id, bookingDate, string.Join(",", slotStartTimes));
            }

            if (hasConflict)
                throw new AppException(
                    ErrorCodes.SlotAlreadyBooked,
                    "Khung giờ này đã được đặt hoặc bị khóa. Vui lòng chọn khung giờ khác.",
                    StatusCodes.Status409Conflict);

            var now = DateTime.UtcNow;

            var booking = new Booking
            {
                Id            = Guid.NewGuid(),
                UserId        = userId,
                OwnerId       = ownerId,
                VenueId       = court.VenueId,
                CourtId       = court.Id,
                SportId       = court.SportId,
                BookingDate   = bookingDate,
                StartTime     = startTime,
                EndTime       = endTime,
                TotalPrice    = totalPrice,
                Status        = initialBookingStatus,
                PaymentStatus = initialPaymentStatus,
                BookingType   = bookingType,
                BookingSource = bookingSource,
                CustomerName  = NormalizeOptionalText(customerName),
                CustomerPhone = NormalizeOptionalText(customerPhone),
                Note          = NormalizeOptionalText(note),
                ExpireAt      = expireAt,
                CreatedAt     = now,
                UpdatedAt     = now
            };

            await _bookingRepository.AddAsync(booking, cancellationToken);

            var slots = slotStartTimes.Select(start => new BookingSlot
            {
                Id            = Guid.NewGuid(),
                BookingId     = booking.Id,
                CourtId       = court.Id,
                SlotDate      = bookingDate,
                SlotStartTime = start,
                SlotEndTime   = start.AddMinutes(_slotMinutes),
                Status        = initialSlotStatus,
                CreatedAt     = now,
                UpdatedAt     = now
            }).ToList();

            await _bookingRepository.AddSlotsAsync(slots, cancellationToken);

            if (createSuccessPayment)
            {
                _context.Payments.Add(new Payment
                {
                    Id              = Guid.NewGuid(),
                    BookingId       = booking.Id,
                    UserId          = userId,
                    Amount          = totalPrice,
                    Method          = PaymentMethod.CASH,
                    Status          = PaymentTransactionStatus.SUCCESS,
                    TransactionCode = $"OFFLINE-{now:yyyyMMddHHmmss}-{booking.Id:N}"[..39],
                    PaidAt          = now,
                    CreatedAt       = now,
                    UpdatedAt       = now
                });
            }

            await _bookingRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var created = await _bookingRepository.GetByIdAsync(booking.Id, cancellationToken);
            return MapToResponse(created!);
        }
        catch (DbUpdateException ex)
            when (ex.InnerException?.Message
                .Contains("ux_booking_slots_active", StringComparison.OrdinalIgnoreCase) == true)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new AppException(
                ErrorCodes.SlotAlreadyBooked,
                "Khung giờ này vừa được đặt bởi người khác. Vui lòng chọn khung giờ khác.",
                StatusCodes.Status409Conflict);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<Court> GetActivePublicCourtOrThrowAsync(Guid courtId, CancellationToken cancellationToken = default)
    {
        ValidateGuid(courtId, "CourtId");

        var court = await _courtRepository.GetPublicCourtByIdAsync(courtId, cancellationToken);

        // Null means the court doesn't exist or isn't fully active (court/venue/sport all must be ACTIVE)
        if (court is null)
        {
            _logger.LogWarning("[BOOKING] Court not found or inactive. CourtId={CourtId}", courtId);
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân đang hoạt động.",
                StatusCodes.Status404NotFound);
        }

        // Defensive: if court.Venue or court.Sport are null (shouldn't happen with Include), throw 500
        if (court.Venue is null)
        {
            _logger.LogError("[BOOKING] Court {CourtId} loaded but Venue is null!", courtId);
            throw new AppException(ErrorCodes.CourtNotFound, "Lỗi dữ liệu: sân không có thông tin cơ sở.", 500);
        }
        if (court.Sport is null)
        {
            _logger.LogError("[BOOKING] Court {CourtId} loaded but Sport is null!", courtId);
            throw new AppException(ErrorCodes.CourtNotFound, "Lỗi dữ liệu: sân không có thông tin môn thể thao.", 500);
        }

        return court;
    }

    private void ValidateBookingTime(DateOnly bookingDate, TimeOnly startTime, TimeOnly endTime)
    {
        if (!IsValidTimeBlock(startTime) || !IsValidTimeBlock(endTime))
            throw new AppException(
                ErrorCodes.InvalidTimeBlock,
                $"StartTime và EndTime phải đúng block {_slotMinutes} phút.");

        if (startTime >= endTime)
            throw new AppException(
                ErrorCodes.InvalidTimeRange,
                "StartTime phải nhỏ hơn EndTime.");

        var duration = endTime - startTime;

        if (duration.TotalMinutes < _minBookingMinutes)
            throw new AppException(
                ErrorCodes.BookingDurationTooShort,
                $"Thời lượng đặt sân tối thiểu là {_minBookingMinutes} phút.");

        if (duration.TotalHours > _maxBookingHours)
            throw new AppException(
                ErrorCodes.BookingDurationTooLong,
                $"Thời lượng đặt sân tối đa là {_maxBookingHours} giờ.");

        var today = VenueTimeHelper.GetToday();

        if (bookingDate < today ||
            (bookingDate == today && startTime <= VenueTimeHelper.GetCurrentTime()))
            throw new AppException(
                ErrorCodes.BookingInPast,
                "Không thể đặt khung giờ đã qua.");
    }

    private static void EnsureCourtCanBeBooked(Court court)
    {
        if (court.Status != CourtStatus.ACTIVE ||
            court.Venue.Status != VenueStatus.ACTIVE ||
            court.Sport.Status != SportStatus.ACTIVE)
            throw new AppException(
                ErrorCodes.CourtInactive,
                "Sân, venue hoặc môn thể thao hiện không hoạt động.",
                StatusCodes.Status400BadRequest);
    }

    private bool IsValidTimeBlock(TimeOnly time)
    {
        var totalMinutes = time.Hour * 60 + time.Minute;
        return time.Second == 0 && time.Millisecond == 0 && totalMinutes % _slotMinutes == 0;
    }

    private List<TimeOnly> GenerateSlotStartTimes(TimeOnly start, TimeOnly end)
    {
        var slots = new List<TimeOnly>();
        var current = start;
        while (current < end)
        {
            slots.Add(current);
            current = current.AddMinutes(_slotMinutes);
        }
        return slots;
    }

    private decimal CalculateTotalPrice(
        List<PriceRule> rules,
        TimeOnly start,
        TimeOnly end,
        bool isWeekend)
    {
        decimal total = 0;
        var current = start;

        while (current < end)
        {
            var next = current.AddMinutes(_slotMinutes);

            var rule = rules
                .Where(r =>
                    r.StartTime <= current &&
                    r.EndTime >= next &&
                    (r.DayType == DayType.ALL ||
                     (r.DayType == DayType.WEEKEND && isWeekend) ||
                     (r.DayType == DayType.WEEKDAY && !isWeekend)))
                .OrderByDescending(r => r.DayType != DayType.ALL)
                .ThenByDescending(r => r.Priority)
                .FirstOrDefault();

            if (rule is null)
                throw new AppException(
                    ErrorCodes.PriceRuleNotFound,
                    $"Không tìm thấy quy tắc giá cho khung giờ {current:HH:mm} - {next:HH:mm}.",
                    StatusCodes.Status400BadRequest);

            total += rule.PricePerHour * _slotMinutes / 60m;
            current = next;
        }

        return total;
    }

    private async Task<bool> ExpireBookingIfNeededAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        if (booking.Status != BookingStatus.PENDING_PAYMENT ||
            booking.PaymentStatus != BookingPaymentStatus.UNPAID ||
            booking.ExpireAt is null ||
            booking.ExpireAt > DateTime.UtcNow)
            return false;

        MarkBookingExpired(booking);
        await _bookingRepository.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static void MarkBookingExpired(Booking booking)
    {
        booking.Status = BookingStatus.EXPIRED;
        booking.PaymentStatus = BookingPaymentStatus.FAILED;
        booking.UpdatedAt = DateTime.UtcNow;

        foreach (var slot in booking.BookingSlots
            .Where(s => s.Status == BookingSlotStatus.HOLDING))
        {
            slot.Status = BookingSlotStatus.EXPIRED;
            slot.UpdatedAt = DateTime.UtcNow;
        }
    }

    private static void CancelBooking(
        Booking booking,
        BookingStatus targetStatus,
        string? reason)
    {
        if (booking.Status is
            BookingStatus.CANCELLED_BY_USER or
            BookingStatus.CANCELLED_BY_OWNER or
            BookingStatus.CANCELLED_BY_ADMIN or
            BookingStatus.EXPIRED or
            BookingStatus.COMPLETED)
            throw new AppException(
                ErrorCodes.BookingAlreadyCancelled,
                "Booking này không thể hủy ở trạng thái hiện tại.",
                StatusCodes.Status400BadRequest);

        var today = VenueTimeHelper.GetToday();
        var nowTime = VenueTimeHelper.GetCurrentTime();

        if (booking.BookingDate < today ||
            (booking.BookingDate == today && booking.StartTime <= nowTime))
            throw new AppException(
                ErrorCodes.ValidationError,
                "Không thể hủy booking đã bắt đầu.",
                StatusCodes.Status400BadRequest);

        booking.Status = targetStatus;
        booking.PaymentStatus = booking.PaymentStatus == BookingPaymentStatus.PAID
            ? BookingPaymentStatus.REFUNDED
            : booking.PaymentStatus;
        booking.ExpireAt = null;
        booking.Note = AppendReason(booking.Note, reason);
        booking.UpdatedAt = DateTime.UtcNow;

        foreach (var slot in booking.BookingSlots.Where(s =>
            s.Status == BookingSlotStatus.HOLDING ||
            s.Status == BookingSlotStatus.BOOKED))
        {
            slot.Status = BookingSlotStatus.CANCELLED;
            slot.UpdatedAt = DateTime.UtcNow;
        }

        foreach (var payment in booking.Payments
            .Where(p => p.Status == PaymentTransactionStatus.SUCCESS))
        {
            payment.Status = PaymentTransactionStatus.REFUNDED;
            payment.UpdatedAt = DateTime.UtcNow;
        }
    }

    private Guid GetCurrentUserIdOrThrow()
    {
        if (_currentUserService.UserId is null)
            throw new AppException(
                ErrorCodes.AuthRequired,
                "Bạn chưa đăng nhập.",
                StatusCodes.Status401Unauthorized);

        return _currentUserService.UserId.Value;
    }

    private static void ValidateGuid(Guid value, string fieldName)
    {
        if (value == Guid.Empty)
            throw new AppException(ErrorCodes.ValidationError, $"{fieldName} không hợp lệ.");
    }

    private static string? NormalizeOptionalText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? AppendReason(string? note, string? reason)
    {
        if (string.IsNullOrWhiteSpace(reason)) return note;

        var normalized = reason.Trim();
        return string.IsNullOrWhiteSpace(note)
            ? $"Lý do hủy: {normalized}"
            : $"{note.Trim()}\nLý do hủy: {normalized}";
    }

    private static BookingResponseDto MapToResponse(Booking b) => new()
    {
        Id            = b.Id,
        VenueId       = b.VenueId,
        CourtId       = b.CourtId,
        SportId       = b.SportId,
        UserId        = b.UserId,
        OwnerId       = b.OwnerId,
        CourtName     = b.Court?.Name ?? string.Empty,
        VenueName     = b.Court?.Venue?.Name ?? b.Venue?.Name ?? string.Empty,
        VenueAddress  = b.Court?.Venue?.Address ?? b.Venue?.Address ?? string.Empty,
        SportName     = b.Court?.Sport?.Name ?? b.Sport?.Name ?? string.Empty,
        CustomerName  = b.CustomerName ?? b.User?.FullName,
        CustomerPhone = b.CustomerPhone ?? b.User?.PhoneNumber,
        UserEmail     = b.User?.Email,
        BookingDate   = b.BookingDate.ToString("yyyy-MM-dd"),
        StartTime     = b.StartTime.ToString("HH:mm"),
        EndTime       = b.EndTime.ToString("HH:mm"),
        TotalPrice    = b.TotalPrice,
        Status        = b.Status.ToString(),
        PaymentStatus = b.PaymentStatus.ToString(),
        BookingType   = b.BookingType.ToString(),
        BookingSource = b.BookingSource.ToString(),
        Note          = b.Note,
        ExpireAt      = b.ExpireAt,
        CreatedAt     = b.CreatedAt,
        UpdatedAt     = b.UpdatedAt,
        Payments      = b.Payments
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PaymentResponseDto
            {
                Id              = p.Id,
                Amount          = p.Amount,
                Method          = p.Method.ToString(),
                Status          = p.Status.ToString(),
                TransactionCode = p.TransactionCode,
                PaidAt          = p.PaidAt,
                CreatedAt       = p.CreatedAt
            }).ToList(),
        Slots = b.BookingSlots
            .OrderBy(s => s.SlotStartTime)
            .Select(s => new BookingSlotResponseDto
            {
                Id            = s.Id,
                SlotDate      = s.SlotDate.ToString("yyyy-MM-dd"),
                SlotStartTime = s.SlotStartTime.ToString("HH:mm"),
                SlotEndTime   = s.SlotEndTime.ToString("HH:mm"),
                Status        = s.Status.ToString()
            }).ToList()
    };

    public async Task<BookingReportDto> GetBookingsReportAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default)
    {
        // Expire pending bookings first
        var pendingExpired = await _bookingRepository
            .GetExpiredPendingBookingsAsync(DateTime.UtcNow, batchSize: 100, cancellationToken);
        if (pendingExpired.Count > 0)
        {
            foreach (var b in pendingExpired)
                MarkBookingExpired(b);
            await _bookingRepository.SaveChangesAsync(cancellationToken);
        }

        var query = _context.Bookings
            .Include(b => b.Court).ThenInclude(c => c!.Venue)
            .Include(b => b.Court).ThenInclude(c => c!.Sport)
            .Include(b => b.User)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(b => b.BookingDate >= DateOnly.FromDateTime(fromDate.Value));
        if (toDate.HasValue)
            query = query.Where(b => b.BookingDate <= DateOnly.FromDateTime(toDate.Value));

        var bookings = await query.ToListAsync(cancellationToken);

        var completedRevenue = bookings
            .Where(b => b.Status == BookingStatus.COMPLETED)
            .Sum(b => b.TotalPrice);

        var totalRevenue = bookings
            .Where(b => b.Status is BookingStatus.COMPLETED or BookingStatus.CONFIRMED)
            .Sum(b => b.TotalPrice);

        return new BookingReportDto
        {
            GeneratedAt = DateTime.UtcNow.AddHours(7),
            FromDate = fromDate,
            ToDate = toDate,
            TotalBookings = bookings.Count,
            CompletedBookings = bookings.Count(b => b.Status == BookingStatus.COMPLETED),
            ConfirmedBookings = bookings.Count(b => b.Status == BookingStatus.CONFIRMED),
            CancelledBookings = bookings.Count(b => b.Status is BookingStatus.CANCELLED_BY_USER or BookingStatus.CANCELLED_BY_OWNER or BookingStatus.CANCELLED_BY_ADMIN),
            PendingBookings = bookings.Count(b => b.Status == BookingStatus.PENDING_PAYMENT),
            TotalRevenue = totalRevenue,
            CompletedRevenue = completedRevenue,
            Bookings = bookings.Select(MapToResponse).ToList()
        };
    }
}