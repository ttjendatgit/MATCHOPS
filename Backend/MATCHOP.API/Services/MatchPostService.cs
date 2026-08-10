using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;
using MATCHOP.API.Services.Interfaces;

namespace MATCHOP.API.Services
{
    public class MatchPostService : IMatchPostService
    {
        private readonly IMatchPostRepository _matchPostRepository;
        private readonly IUserSkillRepository _userSkillRepository;
        private readonly IMembershipService _membershipService;

        public MatchPostService(
            IMatchPostRepository matchPostRepository,
            IUserSkillRepository userSkillRepository,
            IMembershipService membershipService)
        {
            _matchPostRepository = matchPostRepository;
            _userSkillRepository = userSkillRepository;
            _membershipService = membershipService;
        }

        public async Task<MatchPostResponseDto> CreatePostAsync(Guid userId, CreateMatchPostDto dto, CancellationToken cancellationToken = default)
        {
            // Check membership limits before creating post
            await _membershipService.CheckMatchPostLimitAsync(userId, cancellationToken);

            var userSkill = await _userSkillRepository.GetAsync(userId, dto.SportId, cancellationToken);
            if (userSkill == null)
            {
                throw new AppException(ErrorCodes.ValidationError, "Bạn cần cập nhật trình độ cho môn thể thao này trước khi tạo bài tìm trận.");
            }

            // Membership quota: count posts created this calendar month (UTC)
            var plan = await _membershipService.GetEffectivePlanAsync(userId, UserRole.USER);
            // Fall back to USER_FREE limit (3) when seed data is missing
            int? maxPosts = plan is null ? 3 : plan.MaxMatchPostsPerMonth;
            if (maxPosts is int postLimit)
            {
                var now = DateTime.UtcNow;
                var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                var nextMonthStart = monthStart.AddMonths(1);
                var postCount = await _matchPostRepository.CountByCreatorInMonthAsync(userId, monthStart, nextMonthStart);
                if (postCount >= postLimit)
                    throw new AppException(ErrorCodes.ValidationError,
                        $"Bạn đã dùng hết {postLimit} bài ghép đối trong tháng này. Nâng cấp Pro để tiếp tục.");
            }

            if (dto.PreferredTime <= DateTime.UtcNow)
            {
                throw new AppException(ErrorCodes.ValidationError, "Thời gian tổ chức phải là thời gian trong tương lai.");
            }

            var post = new MatchPost
            {
                Id = Guid.NewGuid(),
                CreatorId = userId,
                SportId = dto.SportId,
                MinSkillLevel = dto.MinSkillLevel,
                MaxSkillLevel = dto.MaxSkillLevel,
                City = dto.City,
                District = dto.District,
                PreferredTime = dto.PreferredTime,
                SlotsNeeded = dto.SlotsNeeded,
                SlotsFilled = 0,
                Note = dto.Note,
                Status = MatchPostStatus.OPEN,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _matchPostRepository.AddAsync(post, cancellationToken);
            
            var result = await _matchPostRepository.GetByIdAsync(post.Id, cancellationToken);
            return MapToResponse(result!);
        }

        public async Task<MatchPostResponseDto> UpdatePostAsync(Guid userId, Guid postId, UpdateMatchPostDto dto, CancellationToken cancellationToken = default)
        {
            var post = await _matchPostRepository.GetByIdAsync(postId, cancellationToken);
            if (post == null) throw new AppException(ErrorCodes.ValidationError, "Không tìm thấy bài đăng.");
            if (post.CreatorId != userId) throw new AppException(ErrorCodes.ValidationError, "Bạn không có quyền chỉnh sửa bài đăng này.");

            if (dto.MinSkillLevel.HasValue) post.MinSkillLevel = dto.MinSkillLevel.Value;
            if (dto.MaxSkillLevel.HasValue) post.MaxSkillLevel = dto.MaxSkillLevel.Value;
            if (!string.IsNullOrWhiteSpace(dto.City)) post.City = dto.City;
            if (!string.IsNullOrWhiteSpace(dto.District)) post.District = dto.District;
            if (dto.PreferredTime.HasValue) post.PreferredTime = dto.PreferredTime.Value;
            if (dto.SlotsNeeded.HasValue) post.SlotsNeeded = dto.SlotsNeeded.Value;
            if (dto.Note != null) post.Note = dto.Note;
            if (dto.Status.HasValue) post.Status = dto.Status.Value;

            await _matchPostRepository.UpdateAsync(post, cancellationToken);
            return MapToResponse(post);
        }

        public async Task<List<MatchPostResponseDto>> GetPostsAsync(MatchPostFilterDto filter, CancellationToken cancellationToken = default)
        {
            var posts = await _matchPostRepository.GetFilteredAsync(filter, cancellationToken);
            return posts.Select(MapToResponse).ToList();
        }

        public async Task<MatchPostResponseDto> GetPostByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var post = await _matchPostRepository.GetByIdAsync(id, cancellationToken);
            if (post == null) throw new AppException(ErrorCodes.ValidationError, "Không tìm thấy bài đăng.");
            return MapToResponse(post);
        }

        public async Task DeletePostAsync(Guid userId, Guid postId, CancellationToken cancellationToken = default)
        {
            var post = await _matchPostRepository.GetByIdAsync(postId, cancellationToken);
            if (post == null) throw new AppException(ErrorCodes.ValidationError, "Không tìm thấy bài đăng.");
            if (post.CreatorId != userId) throw new AppException(ErrorCodes.ValidationError, "Bạn không có quyền xóa bài đăng này.");

            await _matchPostRepository.DeleteAsync(post, cancellationToken);
        }

        public async Task DeletePostAsync(Guid postId, CancellationToken cancellationToken = default)
        {
            var post = await _matchPostRepository.GetByIdAsync(postId, cancellationToken);
            if (post == null) throw new AppException(ErrorCodes.ValidationError, "Không tìm thấy bài đăng.");

            post.Status = MatchPostStatus.CANCELLED;
            post.UpdatedAt = DateTime.UtcNow;
            await _matchPostRepository.UpdateAsync(post, cancellationToken);
        }

        public async Task<MatchPostResponseDto> UpdatePostStatusAsync(Guid postId, MatchPostStatus status, CancellationToken cancellationToken = default)
        {
            var post = await _matchPostRepository.GetByIdAsync(postId, cancellationToken);
            if (post == null) throw new AppException(ErrorCodes.ValidationError, "Không tìm thấy bài đăng.");

            post.Status = status;
            post.UpdatedAt = DateTime.UtcNow;
            await _matchPostRepository.UpdateAsync(post, cancellationToken);
            return MapToResponse(post);
        }

        public async Task<MatchPostAdminListDto> GetAllPostsAsync(MatchPostFilterDto filter, CancellationToken cancellationToken = default)
        {
            var (posts, totalCount) = await _matchPostRepository.GetAllForAdminAsync(filter, cancellationToken);

            return new MatchPostAdminListDto
            {
                Posts = posts.Select(MapToResponse).ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
            };
        }

        public async Task<MatchStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken = default)
        {
            var totalPosts = await _matchPostRepository.GetTotalCountAsync(cancellationToken);
            var openPosts = await _matchPostRepository.GetCountByStatusAsync("OPEN", cancellationToken);
            var filledPosts = await _matchPostRepository.GetCountByStatusAsync("FILLED", cancellationToken);
            var cancelledPosts = await _matchPostRepository.GetCountByStatusAsync("CANCELLED", cancellationToken);

            return new MatchStatisticsDto
            {
                TotalPosts = totalPosts,
                OpenPosts = openPosts,
                FilledPosts = filledPosts,
                CancelledPosts = cancelledPosts,
                TotalRequests = 0, // TODO: Get from request repository
                PendingRequests = 0,
                TotalRooms = 0, // TODO: Get from room repository
                ActiveRooms = 0
            };
        }

        private static MatchPostResponseDto MapToResponse(MatchPost post)
        {
            return new MatchPostResponseDto
            {
                Id = post.Id,
                CreatorId = post.CreatorId,
                CreatorName = post.Creator?.FullName ?? "Unknown",
                CreatorAvatar = post.Creator?.AvatarUrl,
                SportId = post.SportId,
                SportName = post.Sport?.Name ?? "Unknown",
                MinSkillLevel = post.MinSkillLevel.ToString(),
                MaxSkillLevel = post.MaxSkillLevel.ToString(),
                City = post.City,
                District = post.District,
                PreferredTime = post.PreferredTime,
                SlotsNeeded = post.SlotsNeeded,
                SlotsFilled = post.SlotsFilled,
                Note = post.Note,
                Status = post.Status.ToString(),
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt
            };
        }
    }
}
