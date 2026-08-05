using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class CoachService : ICoachService
{
    private const int MaxProofCount = 5;
    private const int MaxVerificationDocumentCount = 5;

    private readonly ApplicationDbContext _context;
    private readonly ICloudinaryService _cloudinary;

    public CoachService(ApplicationDbContext context, ICloudinaryService cloudinary)
    {
        _context = context;
        _cloudinary = cloudinary;
    }

    public async Task<CoachProfileMeResponseDto> ApplyAsync(Guid userId, CoachApplyRequestDto dto)
    {
        var existing = await _context.CoachProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (existing is not null)
        {
            throw new AppException(
                ErrorCodes.CoachProfileAlreadyExists,
                "Bạn đã có hồ sơ huấn luyện viên hoặc đơn đăng ký đang chờ duyệt.",
                StatusCodes.Status409Conflict);
        }

        var sportIds = (dto.SportIds ?? new List<Guid>()).Distinct().ToList();
        await EnsureSportsExistAsync(sportIds);

        var profile = new CoachProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DisplayName = string.IsNullOrWhiteSpace(dto.DisplayName) ? null : dto.DisplayName.Trim(),
            Bio = string.IsNullOrWhiteSpace(dto.Bio) ? null : dto.Bio.Trim(),
            ExperienceYears = dto.ExperienceYears,
            HourlyRate = dto.HourlyRate,
            City = dto.City.Trim(),
            District = dto.District.Trim(),
            Achievements = string.IsNullOrWhiteSpace(dto.Achievements) ? null : dto.Achievements.Trim(),
            Status = CoachProfileStatus.PENDING_APPROVAL,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CoachProfiles.Add(profile);

        foreach (var sportId in sportIds)
        {
            _context.CoachSports.Add(new CoachSport
            {
                Id = Guid.NewGuid(),
                CoachProfileId = profile.Id,
                SportId = sportId,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return await GetMyProfileAsync(userId);
    }

    public async Task<CoachProfileMeResponseDto> GetMyProfileAsync(Guid userId)
    {
        var profile = await GetOwnProfileOrThrowAsync(userId, tracking: false);
        return MapToResponse(profile);
    }

    public async Task<CoachProfileMeResponseDto> UpdateMyProfileAsync(Guid userId, CoachUpdateMyProfileRequestDto dto)
    {
        var profile = await GetOwnProfileOrThrowAsync(userId, tracking: true);

        if (profile.Status == CoachProfileStatus.SUSPENDED)
        {
            throw new AppException(
                ErrorCodes.CoachProfileSuspended,
                "Hồ sơ huấn luyện viên đang bị tạm khóa, không thể chỉnh sửa.",
                StatusCodes.Status403Forbidden);
        }

        if (dto.DisplayName is not null)
        {
            profile.DisplayName = string.IsNullOrWhiteSpace(dto.DisplayName) ? null : dto.DisplayName.Trim();
        }

        if (dto.Bio is not null)
        {
            profile.Bio = string.IsNullOrWhiteSpace(dto.Bio) ? null : dto.Bio.Trim();
        }

        if (dto.ExperienceYears.HasValue)
        {
            profile.ExperienceYears = dto.ExperienceYears.Value;
        }

        if (dto.HourlyRate.HasValue)
        {
            profile.HourlyRate = dto.HourlyRate.Value;
        }

        if (dto.City is not null)
        {
            profile.City = dto.City.Trim();
        }

        if (dto.District is not null)
        {
            profile.District = dto.District.Trim();
        }

        if (dto.Achievements is not null)
        {
            profile.Achievements = string.IsNullOrWhiteSpace(dto.Achievements) ? null : dto.Achievements.Trim();
        }

        if (dto.SportIds is not null)
        {
            var requestedSportIds = dto.SportIds.Distinct().ToList();
            await EnsureSportsExistAsync(requestedSportIds);

            var requestedSet = requestedSportIds.ToHashSet();
            var existingSportIds = profile.CoachSports.Select(cs => cs.SportId).ToHashSet();

            var toRemove = profile.CoachSports
                .Where(cs => !requestedSet.Contains(cs.SportId))
                .ToList();

            if (toRemove.Count > 0)
            {
                _context.CoachSports.RemoveRange(toRemove);
            }

            var toAdd = requestedSportIds.Where(sportId => !existingSportIds.Contains(sportId));

            foreach (var sportId in toAdd)
            {
                _context.CoachSports.Add(new CoachSport
                {
                    Id = Guid.NewGuid(),
                    CoachProfileId = profile.Id,
                    SportId = sportId,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        if (profile.Status == CoachProfileStatus.REJECTED)
        {
            profile.Status = CoachProfileStatus.PENDING_APPROVAL;
            profile.RejectionReason = null;
        }

        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetMyProfileAsync(userId);
    }

    public async Task<List<CoachProofResponseDto>> UploadMyCoachProofsAsync(
        Guid userId,
        List<IFormFile> files,
        CoachProofType proofType)
    {
        var profile = await GetOwnProfileOrThrowAsync(userId, tracking: true);

        if (profile.Status == CoachProfileStatus.SUSPENDED)
        {
            throw new AppException(
                ErrorCodes.CoachProfileSuspended,
                "Hồ sơ huấn luyện viên đang bị tạm khóa, không thể tải lên minh chứng.",
                StatusCodes.Status403Forbidden);
        }

        var incomingCount = files?.Count ?? 0;

        if (incomingCount == 0)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Vui lòng chọn ít nhất một ảnh minh chứng.");
        }

        if (profile.Proofs.Count + incomingCount > MaxProofCount)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                $"Chỉ được lưu tối đa {MaxProofCount} ảnh minh chứng cho mỗi hồ sơ.");
        }

        var uploaded = await _cloudinary.UploadImagesAsync(files, "coach-proofs", MaxProofCount);

        try
        {
            var nextSortOrder = profile.Proofs.Count == 0
                ? 0
                : profile.Proofs.Max(p => p.SortOrder) + 1;

            var newProofs = new List<CoachProfileProof>();

            foreach (var result in uploaded)
            {
                newProofs.Add(new CoachProfileProof
                {
                    Id = Guid.NewGuid(),
                    CoachProfileId = profile.Id,
                    ImageUrl = result.Url,
                    PublicId = result.PublicId,
                    ProofType = proofType,
                    SortOrder = nextSortOrder++,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _context.CoachProfileProofs.AddRange(newProofs);

            if (profile.Status == CoachProfileStatus.REJECTED)
            {
                profile.Status = CoachProfileStatus.PENDING_APPROVAL;
                profile.RejectionReason = null;
                profile.ApprovedAt = null;
            }

            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return newProofs.Select(MapProof).ToList();
        }
        catch
        {
            await _cloudinary.DeleteImagesByPublicIdsAsync(uploaded.Select(u => u.PublicId));
            throw;
        }
    }

    public async Task<List<CoachProofResponseDto>> GetMyCoachProofsAsync(Guid userId)
    {
        var profile = await GetOwnProfileOrThrowAsync(userId, tracking: false);
        return MapProofs(profile);
    }

    public async Task DeleteMyCoachProofAsync(Guid userId, Guid proofId)
    {
        var profile = await GetOwnProfileOrThrowAsync(userId, tracking: true);

        if (profile.Status == CoachProfileStatus.SUSPENDED)
        {
            throw new AppException(
                ErrorCodes.CoachProfileSuspended,
                "Hồ sơ huấn luyện viên đang bị tạm khóa, không thể xoá minh chứng.",
                StatusCodes.Status403Forbidden);
        }

        var proof = profile.Proofs.FirstOrDefault(p => p.Id == proofId);

        if (proof is null)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotFound,
                "Không tìm thấy ảnh minh chứng.",
                StatusCodes.Status404NotFound);
        }

        _context.CoachProfileProofs.Remove(proof);

        await _context.SaveChangesAsync();

        await _cloudinary.DeleteImageByPublicIdAsync(proof.PublicId);
    }

    // ── Own-profile verification documents ──────────────────────────────────

    public async Task<List<CoachVerificationDocumentResponseDto>> UploadMyVerificationDocumentsAsync(
        Guid userId,
        List<IFormFile> files,
        CoachVerificationDocumentType documentType)
    {
        var profile = await GetOwnProfileOrThrowAsync(userId, tracking: true);

        if (profile.Status == CoachProfileStatus.SUSPENDED)
        {
            throw new AppException(
                ErrorCodes.CoachProfileSuspended,
                "Hồ sơ huấn luyện viên đang bị tạm khóa, không thể tải lên tài liệu xác minh.",
                StatusCodes.Status403Forbidden);
        }

        var incomingCount = files?.Count ?? 0;

        if (incomingCount == 0)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Vui lòng chọn ít nhất một tài liệu xác minh.");
        }

        if (profile.VerificationDocuments.Count + incomingCount > MaxVerificationDocumentCount)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                $"Chỉ được lưu tối đa {MaxVerificationDocumentCount} tài liệu xác minh cho mỗi hồ sơ.");
        }

        var uploaded = await _cloudinary.UploadVerificationDocumentsAsync(
            files, "coach-verification-documents", MaxVerificationDocumentCount);

        try
        {
            var nextSortOrder = profile.VerificationDocuments.Count == 0
                ? 0
                : profile.VerificationDocuments.Max(d => d.SortOrder) + 1;

            var newDocuments = new List<CoachVerificationDocument>();

            for (var i = 0; i < uploaded.Count; i++)
            {
                var file = files![i];
                var result = uploaded[i];

                newDocuments.Add(new CoachVerificationDocument
                {
                    Id = Guid.NewGuid(),
                    CoachProfileId = profile.Id,
                    FileUrl = result.Url,
                    PublicId = result.PublicId,
                    OriginalFileName = file.FileName,
                    ContentType = file.ContentType,
                    FileSizeBytes = file.Length,
                    DocumentType = documentType,
                    SortOrder = nextSortOrder++,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _context.CoachVerificationDocuments.AddRange(newDocuments);

            if (profile.Status == CoachProfileStatus.REJECTED)
            {
                profile.Status = CoachProfileStatus.PENDING_APPROVAL;
                profile.RejectionReason = null;
                profile.ApprovedAt = null;
            }

            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return newDocuments.Select(MapVerificationDocument).ToList();
        }
        catch
        {
            for (var i = 0; i < uploaded.Count; i++)
            {
                await _cloudinary.DeleteVerificationDocumentAsync(uploaded[i].PublicId, files![i].ContentType);
            }
            throw;
        }
    }

    public async Task<List<CoachVerificationDocumentResponseDto>> GetMyVerificationDocumentsAsync(Guid userId)
    {
        var profile = await GetOwnProfileOrThrowAsync(userId, tracking: false);
        return MapVerificationDocuments(profile);
    }

    public async Task DeleteMyVerificationDocumentAsync(Guid userId, Guid documentId)
    {
        var profile = await GetOwnProfileOrThrowAsync(userId, tracking: true);

        if (profile.Status == CoachProfileStatus.SUSPENDED)
        {
            throw new AppException(
                ErrorCodes.CoachProfileSuspended,
                "Hồ sơ huấn luyện viên đang bị tạm khóa, không thể xoá tài liệu xác minh.",
                StatusCodes.Status403Forbidden);
        }

        var document = profile.VerificationDocuments.FirstOrDefault(d => d.Id == documentId);

        if (document is null)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotFound,
                "Không tìm thấy tài liệu xác minh.",
                StatusCodes.Status404NotFound);
        }

        _context.CoachVerificationDocuments.Remove(document);

        await _context.SaveChangesAsync();

        await _cloudinary.DeleteVerificationDocumentAsync(document.PublicId, document.ContentType);
    }

    private async Task<CoachProfile> GetOwnProfileOrThrowAsync(Guid userId, bool tracking)
    {
        var query = _context.CoachProfiles
            .Include(x => x.User)
            .Include(x => x.CoachSports)
            .ThenInclude(x => x.Sport)
            .Include(x => x.Proofs)
            .Include(x => x.VerificationDocuments)
            .AsQueryable();

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        var profile = await query.FirstOrDefaultAsync(x => x.UserId == userId);

        if (profile is null)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotFound,
                "Bạn chưa có hồ sơ huấn luyện viên.",
                StatusCodes.Status404NotFound);
        }

        return profile;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    public async Task<AdminCoachProfileListResponseDto> GetCoachProfilesForAdminAsync(
        CoachProfileStatus? status,
        string? city,
        string? district,
        Guid? sportId,
        string? search,
        int page,
        int pageSize)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 100);

        var query = _context.CoachProfiles
            .Include(x => x.User)
            .Include(x => x.CoachSports)
            .ThenInclude(x => x.Sport)
            .AsNoTracking()
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            var cityValue = city.Trim().ToLower();
            query = query.Where(x => x.City.ToLower() == cityValue);
        }

        if (!string.IsNullOrWhiteSpace(district))
        {
            var districtValue = district.Trim().ToLower();
            query = query.Where(x => x.District.ToLower() == districtValue);
        }

        if (sportId.HasValue)
        {
            query = query.Where(x => x.CoachSports.Any(cs => cs.SportId == sportId.Value));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();
            query = query.Where(x =>
                (x.DisplayName != null && x.DisplayName.ToLower().Contains(keyword)) ||
                x.User.FullName.ToLower().Contains(keyword) ||
                x.User.Email.ToLower().Contains(keyword));
        }

        query = query.OrderByDescending(x => x.CreatedAt);

        var totalCount = await query.CountAsync();

        var profiles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new AdminCoachProfileListResponseDto
        {
            Items = profiles.Select(MapToAdminListItem).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminCoachProfileDetailDto> GetCoachProfileForAdminAsync(Guid id)
    {
        var profile = await GetProfileForAdminOrThrowAsync(id, tracking: false);
        return MapToAdminDetail(profile);
    }

    public async Task<AdminCoachProfileDetailDto> ApproveCoachProfileAsync(Guid id)
    {
        var profile = await GetProfileForAdminOrThrowAsync(id, tracking: true);

        if (profile.Status == CoachProfileStatus.SUSPENDED)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Hồ sơ đang bị tạm khóa. Vui lòng dùng chức năng kích hoạt lại (reactivate) thay vì duyệt.");
        }

        if (profile.Status == CoachProfileStatus.ACTIVE)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Hồ sơ đã được duyệt trước đó.");
        }

        profile.Status = CoachProfileStatus.ACTIVE;
        profile.RejectionReason = null;
        profile.ApprovedAt = DateTime.UtcNow;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetCoachProfileForAdminAsync(id);
    }

    public async Task<AdminCoachProfileDetailDto> RejectCoachProfileAsync(Guid id, RejectCoachProfileRequestDto dto)
    {
        var profile = await GetProfileForAdminOrThrowAsync(id, tracking: true);

        profile.Status = CoachProfileStatus.REJECTED;
        profile.RejectionReason = dto.RejectionReason.Trim();
        profile.ApprovedAt = null;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetCoachProfileForAdminAsync(id);
    }

    public async Task<AdminCoachProfileDetailDto> SuspendCoachProfileAsync(Guid id, SuspendCoachProfileRequestDto dto)
    {
        var profile = await GetProfileForAdminOrThrowAsync(id, tracking: true);

        profile.Status = CoachProfileStatus.SUSPENDED;
        profile.RejectionReason = string.IsNullOrWhiteSpace(dto.Reason) ? null : dto.Reason.Trim();
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetCoachProfileForAdminAsync(id);
    }

    public async Task<AdminCoachProfileDetailDto> ReactivateCoachProfileAsync(Guid id)
    {
        var profile = await GetProfileForAdminOrThrowAsync(id, tracking: true);

        if (profile.Status != CoachProfileStatus.SUSPENDED)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Chỉ có thể kích hoạt lại hồ sơ đang bị tạm khóa.");
        }

        profile.Status = CoachProfileStatus.ACTIVE;
        profile.RejectionReason = null;
        profile.ApprovedAt ??= DateTime.UtcNow;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetCoachProfileForAdminAsync(id);
    }

    private async Task<CoachProfile> GetProfileForAdminOrThrowAsync(Guid id, bool tracking)
    {
        var query = _context.CoachProfiles
            .Include(x => x.User)
            .Include(x => x.CoachSports)
            .ThenInclude(x => x.Sport)
            .Include(x => x.Proofs)
            .Include(x => x.VerificationDocuments)
            .AsQueryable();

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        var profile = await query.FirstOrDefaultAsync(x => x.Id == id);

        if (profile is null)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotFound,
                "Không tìm thấy hồ sơ huấn luyện viên.",
                StatusCodes.Status404NotFound);
        }

        return profile;
    }

    // ── Public ────────────────────────────────────────────────────────────────

    public async Task<PublicCoachListResponseDto> GetPublicCoachProfilesAsync(
        string? city,
        string? district,
        Guid? sportId,
        string? search,
        decimal? minHourlyRate,
        decimal? maxHourlyRate,
        int page,
        int pageSize)
    {
        if (minHourlyRate.HasValue && maxHourlyRate.HasValue && minHourlyRate.Value > maxHourlyRate.Value)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Giá tối thiểu không được lớn hơn giá tối đa.");
        }

        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 100);

        var query = _context.CoachProfiles
            .Include(x => x.User)
            .Include(x => x.CoachSports)
            .ThenInclude(x => x.Sport)
            .AsNoTracking()
            .Where(x => x.Status == CoachProfileStatus.ACTIVE)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(city))
        {
            var cityValue = city.Trim().ToLower();
            query = query.Where(x => x.City.ToLower() == cityValue);
        }

        if (!string.IsNullOrWhiteSpace(district))
        {
            var districtValue = district.Trim().ToLower();
            query = query.Where(x => x.District.ToLower() == districtValue);
        }

        if (sportId.HasValue)
        {
            query = query.Where(x => x.CoachSports.Any(cs => cs.SportId == sportId.Value));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();
            query = query.Where(x =>
                (x.DisplayName != null && x.DisplayName.ToLower().Contains(keyword)) ||
                x.User.FullName.ToLower().Contains(keyword) ||
                (x.Bio != null && x.Bio.ToLower().Contains(keyword)));
        }

        if (minHourlyRate.HasValue)
        {
            query = query.Where(x => x.HourlyRate.HasValue && x.HourlyRate.Value >= minHourlyRate.Value);
        }

        if (maxHourlyRate.HasValue)
        {
            query = query.Where(x => x.HourlyRate.HasValue && x.HourlyRate.Value <= maxHourlyRate.Value);
        }

        query = query.OrderByDescending(x => x.ApprovedAt ?? x.CreatedAt);

        var totalCount = await query.CountAsync();

        var profiles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PublicCoachListResponseDto
        {
            Items = profiles.Select(MapToPublicListItem).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PublicCoachDetailDto> GetPublicCoachProfileByIdAsync(Guid id)
    {
        var profile = await _context.CoachProfiles
            .Include(x => x.User)
            .Include(x => x.CoachSports)
            .ThenInclude(x => x.Sport)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.Status == CoachProfileStatus.ACTIVE);

        if (profile is null)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotFound,
                "Không tìm thấy huấn luyện viên.",
                StatusCodes.Status404NotFound);
        }

        return MapToPublicDetail(profile);
    }

    private async Task EnsureSportsExistAsync(List<Guid> sportIds)
    {
        if (sportIds.Count == 0)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Vui lòng chọn ít nhất một môn thể thao.");
        }

        var existingCount = await _context.Sports
            .CountAsync(x => sportIds.Contains(x.Id));

        if (existingCount != sportIds.Count)
        {
            throw new AppException(
                ErrorCodes.SportNotFound,
                "Một hoặc nhiều môn thể thao không tồn tại.");
        }
    }

    private static CoachProfileMeResponseDto MapToResponse(CoachProfile profile)
    {
        return new CoachProfileMeResponseDto
        {
            Id = profile.Id,
            DisplayName = profile.DisplayName,
            Bio = profile.Bio,
            ExperienceYears = profile.ExperienceYears,
            HourlyRate = profile.HourlyRate,
            City = profile.City,
            District = profile.District,
            Achievements = profile.Achievements,
            Email = profile.User?.Email ?? string.Empty,
            PhoneNumber = profile.User?.PhoneNumber,
            Status = profile.Status.ToString(),
            RejectionReason = profile.RejectionReason,
            ApprovedAt = profile.ApprovedAt,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt,
            Sports = MapSports(profile),
            Proofs = MapProofs(profile),
            VerificationDocuments = MapVerificationDocuments(profile)
        };
    }

    private static AdminCoachProfileListItemDto MapToAdminListItem(CoachProfile profile)
    {
        return new AdminCoachProfileListItemDto
        {
            Id = profile.Id,
            UserId = profile.UserId,
            UserFullName = profile.User?.FullName ?? string.Empty,
            UserEmail = profile.User?.Email ?? string.Empty,
            DisplayName = profile.DisplayName,
            BioPreview = BuildBioPreview(profile.Bio),
            ExperienceYears = profile.ExperienceYears,
            HourlyRate = profile.HourlyRate,
            City = profile.City,
            District = profile.District,
            Status = profile.Status.ToString(),
            RejectionReason = profile.RejectionReason,
            ApprovedAt = profile.ApprovedAt,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt,
            Sports = MapSports(profile)
        };
    }

    private static AdminCoachProfileDetailDto MapToAdminDetail(CoachProfile profile)
    {
        return new AdminCoachProfileDetailDto
        {
            Id = profile.Id,
            UserId = profile.UserId,
            UserFullName = profile.User?.FullName ?? string.Empty,
            UserEmail = profile.User?.Email ?? string.Empty,
            UserPhoneNumber = profile.User?.PhoneNumber,
            DisplayName = profile.DisplayName,
            Bio = profile.Bio,
            ExperienceYears = profile.ExperienceYears,
            HourlyRate = profile.HourlyRate,
            City = profile.City,
            District = profile.District,
            Achievements = profile.Achievements,
            Status = profile.Status.ToString(),
            RejectionReason = profile.RejectionReason,
            ApprovedAt = profile.ApprovedAt,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt,
            Sports = MapSports(profile),
            Proofs = MapProofs(profile),
            VerificationDocuments = MapVerificationDocuments(profile)
        };
    }

    private static PublicCoachListItemDto MapToPublicListItem(CoachProfile profile)
    {
        return new PublicCoachListItemDto
        {
            Id = profile.Id,
            DisplayName = ResolvePublicDisplayName(profile),
            BioPreview = BuildBioPreview(profile.Bio),
            ExperienceYears = profile.ExperienceYears,
            HourlyRate = profile.HourlyRate,
            City = profile.City,
            District = profile.District,
            ApprovedAt = profile.ApprovedAt,
            CreatedAt = profile.CreatedAt,
            Sports = MapSports(profile)
        };
    }

    private static PublicCoachDetailDto MapToPublicDetail(CoachProfile profile)
    {
        return new PublicCoachDetailDto
        {
            Id = profile.Id,
            DisplayName = ResolvePublicDisplayName(profile),
            Bio = profile.Bio,
            ExperienceYears = profile.ExperienceYears,
            HourlyRate = profile.HourlyRate,
            City = profile.City,
            District = profile.District,
            ApprovedAt = profile.ApprovedAt,
            CreatedAt = profile.CreatedAt,
            Sports = MapSports(profile)
        };
    }

    private static string ResolvePublicDisplayName(CoachProfile profile) =>
        !string.IsNullOrWhiteSpace(profile.DisplayName) ? profile.DisplayName! : (profile.User?.FullName ?? string.Empty);

    private static string? BuildBioPreview(string? bio)
    {
        const int bioPreviewLength = 160;
        return bio is not null && bio.Length > bioPreviewLength
            ? bio[..bioPreviewLength] + "…"
            : bio;
    }

    private static List<CoachProofResponseDto> MapProofs(CoachProfile profile)
    {
        return profile.Proofs
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.CreatedAt)
            .Select(MapProof)
            .ToList();
    }

    private static CoachProofResponseDto MapProof(CoachProfileProof proof)
    {
        return new CoachProofResponseDto
        {
            Id = proof.Id,
            ImageUrl = proof.ImageUrl,
            ProofType = proof.ProofType.ToString(),
            SortOrder = proof.SortOrder,
            CreatedAt = proof.CreatedAt
        };
    }

    private static List<CoachVerificationDocumentResponseDto> MapVerificationDocuments(CoachProfile profile)
    {
        return profile.VerificationDocuments
            .OrderBy(d => d.SortOrder)
            .ThenBy(d => d.CreatedAt)
            .Select(MapVerificationDocument)
            .ToList();
    }

    private static CoachVerificationDocumentResponseDto MapVerificationDocument(CoachVerificationDocument document)
    {
        return new CoachVerificationDocumentResponseDto
        {
            Id = document.Id,
            FileUrl = document.FileUrl,
            OriginalFileName = document.OriginalFileName,
            ContentType = document.ContentType,
            FileSizeBytes = document.FileSizeBytes,
            DocumentType = document.DocumentType.ToString(),
            SortOrder = document.SortOrder,
            CreatedAt = document.CreatedAt
        };
    }

    private static List<CoachSportResponseDto> MapSports(CoachProfile profile)
    {
        return profile.CoachSports.Select(cs => new CoachSportResponseDto
        {
            SportId = cs.SportId,
            SportName = cs.Sport?.Name ?? "Unknown"
        }).ToList();
    }
}
