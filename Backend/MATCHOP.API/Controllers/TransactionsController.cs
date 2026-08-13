using MATCHOP.API.DTOs.Transactions;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionHistoryService _transactionHistoryService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ApplicationDbContext _dbContext;

    public TransactionsController(
        ITransactionHistoryService transactionHistoryService,
        ICurrentUserService currentUserService,
        ApplicationDbContext dbContext)
    {
        _transactionHistoryService = transactionHistoryService;
        _currentUserService = currentUserService;
        _dbContext = dbContext;
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyTransactions(
        [FromQuery] TransactionHistoryQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await EnsureRoleAsync(UserRole.USER, cancellationToken);
        var userId = GetCurrentUserId();
        var result = await _transactionHistoryService.GetForUserAsync(userId, query, cancellationToken);
        return Ok(ApiResponse<TransactionHistoryResponseDto>.Ok(result));
    }

    [HttpGet("owner")]
    public async Task<IActionResult> GetOwnerTransactions(
        [FromQuery] TransactionHistoryQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await EnsureRoleAsync(UserRole.OWNER, cancellationToken);
        var ownerId = GetCurrentUserId();
        var result = await _transactionHistoryService.GetForOwnerAsync(ownerId, query, cancellationToken);
        return Ok(ApiResponse<TransactionHistoryResponseDto>.Ok(result));
    }

    [HttpGet("coach")]
    public async Task<IActionResult> GetCoachTransactions(
        [FromQuery] TransactionHistoryQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        await EnsureCoachProfileAsync(userId, cancellationToken);
        var result = await _transactionHistoryService.GetForCoachAsync(userId, query, cancellationToken);
        return Ok(ApiResponse<TransactionHistoryResponseDto>.Ok(result));
    }

    [HttpGet("admin")]
    public async Task<IActionResult> GetAdminTransactions(
        [FromQuery] TransactionHistoryQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await EnsureRoleAsync(UserRole.ADMIN, cancellationToken);
        var result = await _transactionHistoryService.GetForAdminAsync(query, cancellationToken);
        return Ok(ApiResponse<TransactionHistoryResponseDto>.Ok(result));
    }

    private Guid GetCurrentUserId() =>
        _currentUserService.UserId
        ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized", StatusCodes.Status401Unauthorized);

    private async Task EnsureRoleAsync(UserRole requiredRole, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var actualRole = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => (UserRole?)u.Role)
            .FirstOrDefaultAsync(cancellationToken);

        if (!actualRole.HasValue)
        {
            throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized", StatusCodes.Status401Unauthorized);
        }

        if (actualRole.Value != requiredRole)
        {
            throw new AppException(ErrorCodes.FORBIDDEN, "Forbidden", StatusCodes.Status403Forbidden);
        }
    }

    private async Task EnsureCoachProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var hasProfile = await _dbContext.CoachProfiles
            .AsNoTracking()
            .AnyAsync(c => c.UserId == userId, cancellationToken);

        if (!hasProfile)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotFound,
                "Bạn chưa có hồ sơ huấn luyện viên.",
                StatusCodes.Status404NotFound);
        }
    }
}
