using MATCHOP.API.DTOs.Courts;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories.Interfaces;
using MATCHOP.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class CourtBlockService : ICourtBlockService
{
    private readonly ApplicationDbContext _context;
    private readonly ICourtRepository _courtRepository;
    private readonly IBookingSlotRepository _bookingSlotRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly int _slotMinutes;

    public CourtBlockService(
        ApplicationDbContext context,
        ICourtRepository courtRepository,
        IBookingSlotRepository bookingSlotRepository,
        ICurrentUserService currentUserService,
        IConfiguration configuration)
    {
        _context = context;
        _courtRepository = courtRepository;
        _bookingSlotRepository = bookingSlotRepository;
        _currentUserService = currentUserService;
        _slotMinutes = configuration.GetValue("Booking:SlotMinutes", 30);
    }

    public async Task<CourtBlockResponseDto> CreateAsync(CreateCourtBlockDto dto, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();
        ValidateBlockInput(dto.CourtId, dto.BlockDate, dto.StartTime, dto.EndTime);

        var court = await _courtRepository.GetOwnerCourtByIdAsync(dto.CourtId, ownerId, cancellationToken);
        if (court is null)
        {
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân của bạn.",
                StatusCodes.Status404NotFound);
        }

        if (court.Status == CourtStatus.INACTIVE)
        {
            throw new AppException(ErrorCodes.CourtInactive, "Sân này đang không hoạt động.");
        }

        if (dto.StartTime < court.Venue.OpeningTime || dto.EndTime > court.Venue.ClosingTime)
        {
            throw new AppException(
                ErrorCodes.OutsideOpeningHours,
                $"Thời gian khóa sân phải trong giờ mở cửa ({court.Venue.OpeningTime:HH:mm} - {court.Venue.ClosingTime:HH:mm}).");
        }

        var slotStartTimes = GenerateSlotStartTimes(dto.StartTime, dto.EndTime);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var hasConflict = await _bookingSlotRepository.HasConflictAsync(
                court.Id,
                dto.BlockDate,
                slotStartTimes,
                cancellationToken: cancellationToken);

            if (hasConflict)
            {
                throw new AppException(
                    ErrorCodes.SlotAlreadyBooked,
                    "Khung giờ này đã có booking hoặc đã bị khóa.",
                    StatusCodes.Status409Conflict);
            }

            var now = DateTime.UtcNow;
            var block = new CourtBlock
            {
                Id = Guid.NewGuid(),
                OwnerId = ownerId,
                VenueId = court.VenueId,
                CourtId = court.Id,
                BlockDate = dto.BlockDate,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Reason = NormalizeOptionalText(dto.Reason),
                Status = CourtBlockStatus.ACTIVE,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.CourtBlocks.Add(block);

            var slots = slotStartTimes.Select(start => new BookingSlot
            {
                Id = Guid.NewGuid(),
                BookingId = null,
                CourtId = court.Id,
                SlotDate = dto.BlockDate,
                SlotStartTime = start,
                SlotEndTime = start.AddMinutes(_slotMinutes),
                Status = BookingSlotStatus.BLOCKED,
                CreatedAt = now,
                UpdatedAt = now
            });

            _context.BookingSlots.AddRange(slots);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var created = await GetOwnerBlockQuery(ownerId)
                .FirstAsync(x => x.Id == block.Id, cancellationToken);

            return MapToResponse(created);
        }
        catch (DbUpdateException ex)
            when (ex.InnerException?.Message.Contains("ux_booking_slots_active", StringComparison.OrdinalIgnoreCase) == true)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new AppException(
                ErrorCodes.SlotAlreadyBooked,
                "Khung giờ này vừa được đặt hoặc khóa bởi thao tác khác.",
                StatusCodes.Status409Conflict);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<List<CourtBlockResponseDto>> GetOwnerBlocksAsync(
        DateOnly? date,
        Guid? venueId,
        Guid? courtId,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();
        var query = GetOwnerBlockQuery(ownerId);

        if (date.HasValue)
        {
            query = query.Where(x => x.BlockDate == date.Value);
        }

        if (venueId.HasValue)
        {
            query = query.Where(x => x.VenueId == venueId.Value);
        }

        if (courtId.HasValue)
        {
            query = query.Where(x => x.CourtId == courtId.Value);
        }

        var blocks = await query
            .OrderByDescending(x => x.BlockDate)
            .ThenBy(x => x.StartTime)
            .ToListAsync(cancellationToken);

        return blocks.Select(MapToResponse).ToList();
    }

    public async Task<CourtBlockResponseDto> CancelAsync(Guid id, CancelCourtBlockDto dto, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();
        if (id == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "CourtBlockId không hợp lệ.");
        }

        var block = await GetOwnerBlockQuery(ownerId)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (block is null)
        {
            throw new AppException(
                ErrorCodes.CourtBlockNotFound,
                "Không tìm thấy lịch khóa sân của bạn.",
                StatusCodes.Status404NotFound);
        }

        if (block.Status == CourtBlockStatus.CANCELLED)
        {
            throw new AppException(ErrorCodes.ValidationError, "Lịch khóa sân đã được hủy trước đó.");
        }

        var slotStartTimes = GenerateSlotStartTimes(block.StartTime, block.EndTime);
        var slots = await _bookingSlotRepository.GetActiveSlotsAsync(
            block.CourtId,
            block.BlockDate,
            slotStartTimes,
            cancellationToken);

        block.Status = CourtBlockStatus.CANCELLED;
        block.Reason = AppendReason(block.Reason, dto.Reason);
        block.UpdatedAt = DateTime.UtcNow;

        foreach (var slot in slots.Where(x => x.Status == BookingSlotStatus.BLOCKED))
        {
            slot.Status = BookingSlotStatus.CANCELLED;
            slot.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return MapToResponse(block);
    }

    private IQueryable<CourtBlock> GetOwnerBlockQuery(Guid ownerId)
    {
        return _context.CourtBlocks
            .Include(x => x.Court)
            .Include(x => x.Venue)
            .Where(x => x.OwnerId == ownerId);
    }

    private void ValidateBlockInput(Guid courtId, DateOnly date, TimeOnly startTime, TimeOnly endTime)
    {
        if (courtId == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "CourtId không hợp lệ.");
        }

        if (!IsValidTimeBlock(startTime) || !IsValidTimeBlock(endTime))
        {
            throw new AppException(
                ErrorCodes.InvalidTimeBlock,
                $"StartTime và EndTime phải đúng block {_slotMinutes} phút.");
        }

        if (startTime >= endTime)
        {
            throw new AppException(ErrorCodes.InvalidTimeRange, "StartTime phải nhỏ hơn EndTime.");
        }

        var today = VenueTimeHelper.GetToday();
        if (date < today)
        {
            throw new AppException(ErrorCodes.BookingInPast, "Không thể khóa sân trong quá khứ.");
        }
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

    private Guid GetCurrentUserIdOrThrow()
    {
        if (_currentUserService.UserId is null)
        {
            throw new AppException(
                ErrorCodes.AuthRequired,
                "Bạn chưa đăng nhập.",
                StatusCodes.Status401Unauthorized);
        }

        return _currentUserService.UserId.Value;
    }

    private static string? NormalizeOptionalText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? AppendReason(string? currentReason, string? cancelReason)
    {
        if (string.IsNullOrWhiteSpace(cancelReason))
        {
            return currentReason;
        }

        var normalized = cancelReason.Trim();
        return string.IsNullOrWhiteSpace(currentReason)
            ? $"Lý do hủy: {normalized}"
            : $"{currentReason.Trim()}\nLý do hủy: {normalized}";
    }

    private static CourtBlockResponseDto MapToResponse(CourtBlock block)
    {
        return new CourtBlockResponseDto
        {
            Id = block.Id,
            VenueId = block.VenueId,
            CourtId = block.CourtId,
            CourtName = block.Court?.Name ?? string.Empty,
            VenueName = block.Venue?.Name ?? string.Empty,
            BlockDate = block.BlockDate.ToString("yyyy-MM-dd"),
            StartTime = block.StartTime.ToString("HH:mm"),
            EndTime = block.EndTime.ToString("HH:mm"),
            Reason = block.Reason,
            Status = block.Status.ToString(),
            CreatedAt = block.CreatedAt,
            UpdatedAt = block.UpdatedAt
        };
    }
}
