using MATCHOP.API.DTOs.Transactions;
using MATCHOP.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public interface ITransactionHistoryService
{
    Task<TransactionHistoryResponseDto> GetForUserAsync(Guid userId, TransactionHistoryQueryDto query, CancellationToken cancellationToken = default);
    Task<TransactionHistoryResponseDto> GetForOwnerAsync(Guid ownerId, TransactionHistoryQueryDto query, CancellationToken cancellationToken = default);
    Task<TransactionHistoryResponseDto> GetForCoachAsync(Guid coachUserId, TransactionHistoryQueryDto query, CancellationToken cancellationToken = default);
    Task<TransactionHistoryResponseDto> GetForAdminAsync(TransactionHistoryQueryDto query, CancellationToken cancellationToken = default);
}

public class TransactionHistoryService : ITransactionHistoryService
{
    private readonly ApplicationDbContext _dbContext;

    public TransactionHistoryService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<TransactionHistoryResponseDto> GetForUserAsync(
        Guid userId,
        TransactionHistoryQueryDto query,
        CancellationToken cancellationToken = default) =>
        BuildResponseAsync(
            includeMembership: true,
            includeCoachSessions: true,
            coachSessionForCoachView: false,
            paymentFilter: p => p.UserId == userId || (p.Booking != null && p.Booking.UserId == userId),
            membershipFilter: s => s.UserId == userId,
            coachSessionFilter: s => s.RequesterId == userId,
            query,
            cancellationToken);

    public Task<TransactionHistoryResponseDto> GetForOwnerAsync(
        Guid ownerId,
        TransactionHistoryQueryDto query,
        CancellationToken cancellationToken = default) =>
        BuildResponseAsync(
            includeMembership: false,
            includeCoachSessions: false,
            coachSessionForCoachView: false,
            paymentFilter: p => p.Booking != null && p.Booking.Venue.OwnerId == ownerId,
            membershipFilter: _ => false,
            coachSessionFilter: _ => false,
            query,
            cancellationToken);

    public Task<TransactionHistoryResponseDto> GetForCoachAsync(
        Guid coachUserId,
        TransactionHistoryQueryDto query,
        CancellationToken cancellationToken = default) =>
        BuildResponseAsync(
            includeMembership: false,
            includeCoachSessions: true,
            coachSessionForCoachView: true,
            paymentFilter: _ => false,
            membershipFilter: _ => false,
            coachSessionFilter: s => s.CoachProfile.UserId == coachUserId,
            query,
            cancellationToken);

    public Task<TransactionHistoryResponseDto> GetForAdminAsync(
        TransactionHistoryQueryDto query,
        CancellationToken cancellationToken = default) =>
        BuildResponseAsync(
            includeMembership: true,
            includeCoachSessions: true,
            coachSessionForCoachView: false,
            paymentFilter: _ => true,
            membershipFilter: _ => true,
            coachSessionFilter: _ => true,
            query,
            cancellationToken);

    private async Task<TransactionHistoryResponseDto> BuildResponseAsync(
        bool includeMembership,
        bool includeCoachSessions,
        bool coachSessionForCoachView,
        System.Linq.Expressions.Expression<Func<Entities.Payment, bool>> paymentFilter,
        System.Linq.Expressions.Expression<Func<Entities.UserSubscription, bool>> membershipFilter,
        System.Linq.Expressions.Expression<Func<Entities.CoachSession, bool>> coachSessionFilter,
        TransactionHistoryQueryDto query,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var statusFilter = ParseStatus(query.Status);

        var payments = await _dbContext.Payments
            .AsNoTracking()
            .Include(p => p.Booking)
                .ThenInclude(b => b.Venue)
            .Include(p => p.Booking)
                .ThenInclude(b => b.Court)
            .Include(p => p.User)
            .Where(paymentFilter)
            .ToListAsync(cancellationToken);

        var items = payments
            .Select(MapPayment)
            .ToList();

        if (includeMembership)
        {
            var subscriptions = await _dbContext.UserSubscriptions
                .AsNoTracking()
                .Include(s => s.MembershipPlan)
                .Include(s => s.User)
                .Where(membershipFilter)
                .Where(s =>
                    s.MembershipPlan.PricePerMonth > 0 &&
                    (s.Status == SubscriptionStatus.ACTIVE || s.Status == SubscriptionStatus.PENDING))
                .ToListAsync(cancellationToken);

            items.AddRange(subscriptions.Select(MapMembership));
        }

        if (includeCoachSessions)
        {
            var coachSessions = await _dbContext.CoachSessions
                .AsNoTracking()
                .Include(s => s.CoachProfile)
                .Include(s => s.Requester)
                .Include(s => s.Sport)
                .Where(coachSessionFilter)
                .Where(s =>
                    s.PaymentStatus == CoachSessionPaymentStatus.PAID ||
                    s.Status == CoachSessionStatus.AWAITING_PAYMENT)
                .ToListAsync(cancellationToken);

            items.AddRange(coachSessions.Select(s => MapCoachSession(s, coachSessionForCoachView)));
        }

        items = ApplyFilters(items, query.FromDate, query.ToDate, statusFilter)
            .OrderByDescending(x => x.PaidAt ?? x.CreatedAt)
            .ToList();

        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var summary = new TransactionSummaryDto
        {
            TotalCount = items.Count,
            SuccessCount = items.Count(x => x.Status == nameof(PaymentTransactionStatus.SUCCESS)),
            TotalAmount = items
                .Where(x => x.Status == nameof(PaymentTransactionStatus.SUCCESS))
                .Sum(x => x.Amount),
            ThisMonthAmount = items
                .Where(x => x.Status == nameof(PaymentTransactionStatus.SUCCESS))
                .Where(x => (x.PaidAt ?? x.CreatedAt) >= monthStart)
                .Sum(x => x.Amount)
        };

        var totalCount = items.Count;
        var pagedItems = items
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new TransactionHistoryResponseDto
        {
            Items = pagedItems,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            Summary = summary
        };
    }

    private static IEnumerable<TransactionItemDto> ApplyFilters(
        IEnumerable<TransactionItemDto> items,
        DateTime? fromDate,
        DateTime? toDate,
        PaymentTransactionStatus? status)
    {
        var filtered = items;

        if (fromDate.HasValue)
        {
            filtered = filtered.Where(x => (x.PaidAt ?? x.CreatedAt) >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            filtered = filtered.Where(x => (x.PaidAt ?? x.CreatedAt) <= toDate.Value);
        }

        if (status.HasValue)
        {
            filtered = filtered.Where(x => x.Status == status.Value.ToString());
        }

        return filtered;
    }

    private static PaymentTransactionStatus? ParseStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return null;
        }

        return Enum.TryParse<PaymentTransactionStatus>(status, true, out var parsed)
            ? parsed
            : null;
    }

    private static TransactionItemDto MapPayment(Entities.Payment payment)
    {
        var booking = payment.Booking;
        var venueName = booking?.Venue?.Name;
        var courtName = booking?.Court?.Name;
        var description = booking is null
            ? "Thanh toán"
            : $"Đặt sân {courtName} — {venueName}";

        return new TransactionItemDto
        {
            Id = payment.Id,
            Type = "BOOKING",
            Amount = payment.Amount,
            Method = payment.Method.ToString(),
            Status = payment.Status.ToString(),
            TransactionCode = payment.TransactionCode,
            PaidAt = payment.PaidAt,
            CreatedAt = payment.CreatedAt,
            Description = description,
            ReferenceId = booking?.Id,
            VenueName = venueName,
            CourtName = courtName,
            CustomerName = payment.User?.FullName,
            CustomerEmail = payment.User?.Email
        };
    }

    private static TransactionItemDto MapMembership(Entities.UserSubscription subscription)
    {
        var plan = subscription.MembershipPlan;
        var amount = plan.PricePerMonth;
        var isPending = subscription.Status == SubscriptionStatus.PENDING;

        return new TransactionItemDto
        {
            Id = subscription.Id,
            Type = "MEMBERSHIP",
            Amount = amount,
            Method = PaymentMethod.BANK_TRANSFER.ToString(),
            Status = isPending
                ? PaymentTransactionStatus.PENDING.ToString()
                : PaymentTransactionStatus.SUCCESS.ToString(),
            TransactionCode = $"MEM{subscription.Id.ToString("N")[..8].ToUpperInvariant()}",
            PaidAt = isPending ? null : subscription.StartedAt,
            CreatedAt = subscription.CreatedAt,
            Description = isPending
                ? $"Gói thành viên {plan.Name} (chờ xác nhận)"
                : $"Gói thành viên {plan.Name}",
            ReferenceId = subscription.Id,
            CustomerName = subscription.User?.FullName,
            CustomerEmail = subscription.User?.Email
        };
    }

    private static TransactionItemDto MapCoachSession(Entities.CoachSession session, bool forCoachView)
    {
        var coachName = session.CoachProfile.DisplayName ?? "Huấn luyện viên";
        var requesterName = session.Requester.FullName;
        var sportName = session.Sport?.Name;
        var sportSuffix = string.IsNullOrWhiteSpace(sportName) ? string.Empty : $" ({sportName})";
        var counterparty = forCoachView ? requesterName : coachName;
        var description = $"Buổi huấn luyện{sportSuffix} — {counterparty}";

        return new TransactionItemDto
        {
            Id = session.Id,
            Type = "COACH_SESSION",
            Amount = session.PriceAmount ?? 0m,
            Method = PaymentMethod.BANK_TRANSFER.ToString(),
            Status = MapCoachPaymentStatus(session.PaymentStatus, session.Status),
            TransactionCode = session.PaymentTransactionCode
                ?? $"COACH{session.Id.ToString("N")[..8].ToUpperInvariant()}",
            PaidAt = session.PaidAt,
            CreatedAt = session.CreatedAt,
            Description = description,
            ReferenceId = session.Id,
            VenueName = session.LocationNote,
            CustomerName = session.Requester.FullName,
            CustomerEmail = session.Requester.Email
        };
    }

    private static string MapCoachPaymentStatus(
        CoachSessionPaymentStatus paymentStatus,
        CoachSessionStatus sessionStatus)
    {
        if (paymentStatus == CoachSessionPaymentStatus.PAID)
        {
            return PaymentTransactionStatus.SUCCESS.ToString();
        }

        if (paymentStatus == CoachSessionPaymentStatus.FAILED)
        {
            return PaymentTransactionStatus.FAILED.ToString();
        }

        if (paymentStatus == CoachSessionPaymentStatus.REFUNDED)
        {
            return PaymentTransactionStatus.REFUNDED.ToString();
        }

        if (sessionStatus == CoachSessionStatus.CANCELLED)
        {
            return PaymentTransactionStatus.FAILED.ToString();
        }

        return PaymentTransactionStatus.PENDING.ToString();
    }
}
