using MATCHOP.API.DTOs.OwnerApplications;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class OwnerApplicationService : IOwnerApplicationService
{
    private readonly ApplicationDbContext _context;

    public OwnerApplicationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OwnerApplicationMeResponseDto> ApplyAsync(Guid userId, OwnerApplyRequestDto dto)
    {
        var user = await GetUserOrThrowAsync(userId);

        if (user.Role == UserRole.OWNER)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Tài khoản của bạn đã là chủ sân.",
                StatusCodes.Status400BadRequest);
        }

        if (user.Role == UserRole.ADMIN)
        {
            throw new AppException(
                ErrorCodes.PermissionDenied,
                "Tài khoản quản trị không thể nộp đơn đăng ký chủ sân.",
                StatusCodes.Status403Forbidden);
        }

        var existing = await _context.OwnerApplications
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (existing is not null)
        {
            throw new AppException(
                ErrorCodes.OwnerApplicationAlreadyExists,
                "Bạn đã có đơn đăng ký chủ sân hoặc đơn đang chờ duyệt.",
                StatusCodes.Status409Conflict);
        }

        var application = new OwnerApplication
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BusinessName = dto.BusinessName.Trim(),
            ContactPhone = dto.ContactPhone.Trim(),
            Address = dto.Address.Trim(),
            City = dto.City.Trim(),
            District = dto.District.Trim(),
            Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
            BusinessLicenseNumber = string.IsNullOrWhiteSpace(dto.BusinessLicenseNumber)
                ? null
                : dto.BusinessLicenseNumber.Trim(),
            Status = OwnerApplicationStatus.PENDING_APPROVAL,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.OwnerApplications.Add(application);
        await _context.SaveChangesAsync();

        return MapToMeResponse(application);
    }

    public async Task<OwnerApplicationMeResponseDto> GetMyApplicationAsync(Guid userId)
    {
        var application = await GetOwnApplicationOrThrowAsync(userId, tracking: false);
        return MapToMeResponse(application);
    }

    public async Task<OwnerApplicationMeResponseDto> UpdateMyApplicationAsync(
        Guid userId,
        OwnerUpdateApplicationRequestDto dto)
    {
        var application = await GetOwnApplicationOrThrowAsync(userId, tracking: true);

        if (application.Status == OwnerApplicationStatus.APPROVED)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Đơn đã được duyệt, không thể chỉnh sửa.",
                StatusCodes.Status400BadRequest);
        }

        if (dto.BusinessName is not null)
            application.BusinessName = dto.BusinessName.Trim();

        if (dto.ContactPhone is not null)
            application.ContactPhone = dto.ContactPhone.Trim();

        if (dto.Address is not null)
            application.Address = dto.Address.Trim();

        if (dto.City is not null)
            application.City = dto.City.Trim();

        if (dto.District is not null)
            application.District = dto.District.Trim();

        if (dto.Description is not null)
            application.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();

        if (dto.BusinessLicenseNumber is not null)
        {
            application.BusinessLicenseNumber = string.IsNullOrWhiteSpace(dto.BusinessLicenseNumber)
                ? null
                : dto.BusinessLicenseNumber.Trim();
        }

        if (application.Status == OwnerApplicationStatus.REJECTED)
        {
            application.Status = OwnerApplicationStatus.PENDING_APPROVAL;
            application.RejectionReason = null;
            application.ApprovedAt = null;
        }

        application.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToMeResponse(application);
    }

    public async Task<AdminOwnerApplicationListResponseDto> GetApplicationsForAdminAsync(
        OwnerApplicationStatus? status,
        string? city,
        string? search,
        int page,
        int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.OwnerApplications
            .AsNoTracking()
            .Include(x => x.User)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(x => x.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(city))
        {
            var cityTerm = city.Trim().ToLower();
            query = query.Where(x => x.City.ToLower().Contains(cityTerm));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x =>
                x.BusinessName.ToLower().Contains(term) ||
                x.User.FullName.ToLower().Contains(term) ||
                x.User.Email.ToLower().Contains(term) ||
                x.ContactPhone.Contains(term));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AdminOwnerApplicationListItemDto
            {
                Id = x.Id,
                UserId = x.UserId,
                UserFullName = x.User.FullName,
                UserEmail = x.User.Email,
                UserPhone = x.User.PhoneNumber,
                BusinessName = x.BusinessName,
                ContactPhone = x.ContactPhone,
                City = x.City,
                District = x.District,
                Status = x.Status.ToString(),
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        return new AdminOwnerApplicationListResponseDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminOwnerApplicationDetailDto> GetApplicationForAdminAsync(Guid id)
    {
        var application = await GetApplicationForAdminOrThrowAsync(id, tracking: false);
        return MapToAdminDetail(application);
    }

    public async Task<AdminOwnerApplicationDetailDto> ApproveApplicationAsync(Guid id)
    {
        var application = await GetApplicationForAdminOrThrowAsync(id, tracking: true);

        if (application.Status == OwnerApplicationStatus.APPROVED)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Đơn đã được duyệt trước đó.",
                StatusCodes.Status400BadRequest);
        }

        var user = application.User;
        if (user.Role == UserRole.ADMIN)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Không thể duyệt đơn của tài khoản quản trị.",
                StatusCodes.Status400BadRequest);
        }

        application.Status = OwnerApplicationStatus.APPROVED;
        application.RejectionReason = null;
        application.ApprovedAt = DateTime.UtcNow;
        application.UpdatedAt = DateTime.UtcNow;

        user.Role = UserRole.OWNER;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetApplicationForAdminAsync(id);
    }

    public async Task<AdminOwnerApplicationDetailDto> RejectApplicationAsync(
        Guid id,
        RejectOwnerApplicationRequestDto dto)
    {
        var application = await GetApplicationForAdminOrThrowAsync(id, tracking: true);

        if (application.Status == OwnerApplicationStatus.APPROVED)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Đơn đã được duyệt, không thể từ chối.",
                StatusCodes.Status400BadRequest);
        }

        application.Status = OwnerApplicationStatus.REJECTED;
        application.RejectionReason = dto.RejectionReason.Trim();
        application.ApprovedAt = null;
        application.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetApplicationForAdminAsync(id);
    }

    private async Task<User> GetUserOrThrowAsync(Guid userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null)
        {
            throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);
        }

        return user;
    }

    private async Task<OwnerApplication> GetOwnApplicationOrThrowAsync(Guid userId, bool tracking)
    {
        var query = tracking
            ? _context.OwnerApplications.AsQueryable()
            : _context.OwnerApplications.AsNoTracking();

        var application = await query.FirstOrDefaultAsync(x => x.UserId == userId);
        if (application is null)
        {
            throw new AppException(
                ErrorCodes.OwnerApplicationNotFound,
                "Không tìm thấy đơn đăng ký chủ sân.",
                StatusCodes.Status404NotFound);
        }

        return application;
    }

    private async Task<OwnerApplication> GetApplicationForAdminOrThrowAsync(Guid id, bool tracking)
    {
        var query = tracking
            ? _context.OwnerApplications.Include(x => x.User).AsQueryable()
            : _context.OwnerApplications.Include(x => x.User).AsNoTracking();

        var application = await query.FirstOrDefaultAsync(x => x.Id == id);
        if (application is null)
        {
            throw new AppException(
                ErrorCodes.OwnerApplicationNotFound,
                "Không tìm thấy đơn đăng ký chủ sân.",
                StatusCodes.Status404NotFound);
        }

        return application;
    }

    private static OwnerApplicationMeResponseDto MapToMeResponse(OwnerApplication application) => new()
    {
        Id = application.Id,
        BusinessName = application.BusinessName,
        ContactPhone = application.ContactPhone,
        Address = application.Address,
        City = application.City,
        District = application.District,
        Description = application.Description,
        BusinessLicenseNumber = application.BusinessLicenseNumber,
        Status = application.Status.ToString(),
        RejectionReason = application.RejectionReason,
        ApprovedAt = application.ApprovedAt,
        CreatedAt = application.CreatedAt,
        UpdatedAt = application.UpdatedAt
    };

    private static AdminOwnerApplicationDetailDto MapToAdminDetail(OwnerApplication application) => new()
    {
        Id = application.Id,
        UserId = application.UserId,
        UserFullName = application.User.FullName,
        UserEmail = application.User.Email,
        UserPhone = application.User.PhoneNumber,
        UserRole = application.User.Role.ToString(),
        BusinessName = application.BusinessName,
        ContactPhone = application.ContactPhone,
        Address = application.Address,
        City = application.City,
        District = application.District,
        Description = application.Description,
        BusinessLicenseNumber = application.BusinessLicenseNumber,
        Status = application.Status.ToString(),
        RejectionReason = application.RejectionReason,
        ApprovedAt = application.ApprovedAt,
        CreatedAt = application.CreatedAt,
        UpdatedAt = application.UpdatedAt
    };
}
