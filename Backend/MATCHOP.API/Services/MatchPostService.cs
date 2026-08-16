using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;
using MATCHOP.API.Repositories.Interfaces;
using MATCHOP.API.Services.Interfaces;

namespace MATCHOP.API.Services
{
    public class MatchPostService : IMatchPostService
    {
        private readonly IMatchPostRepository _matchPostRepository;
        private readonly IUserSkillRepository _userSkillRepository;
        private readonly IMembershipService _membershipService;
        private readonly IVenueRepository _venueRepository;
        private readonly ICourtRepository _courtRepository;

        public MatchPostService(
            IMatchPostRepository matchPostRepository,
            IUserSkillRepository userSkillRepository,
            IMembershipService membershipService,
            IVenueRepository venueRepository,
            ICourtRepository courtRepository)
        {
            _matchPostRepository = matchPostRepository;
            _userSkillRepository = userSkillRepository;
            _membershipService = membershipService;
            _venueRepository = venueRepository;
            _courtRepository = courtRepository;
        }

        public async Task<MatchPostResponseDto> CreatePostAsync(Guid userId, CreateMatchPostDto dto, CancellationToken cancellationToken = default)
        {
            await _membershipService.CheckMatchPostLimitAsync(userId, cancellationToken);

            var userSkill = await _userSkillRepository.GetAsync(userId, dto.SportId, cancellationToken);
            if (userSkill == null)
            {
                throw new AppException(ErrorCodes.ValidationError, "Bạn cần cập nhật trình độ cho môn thể thao này trước khi tạo bài tìm trận.");
            }

            var plan = await _membershipService.GetEffectivePlanAsync(userId, UserRole.USER);
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

            if (string.IsNullOrWhiteSpace(dto.City) || string.IsNullOrWhiteSpace(dto.District))
            {
                throw new AppException(ErrorCodes.ValidationError, "Vui lòng chọn thành phố và quận/huyện.");
            }

            var post = new MatchPost
            {
                Id = Guid.NewGuid(),
                CreatorId = userId,
                SportId = dto.SportId,
                MinSkillLevel = dto.MinSkillLevel,
                MaxSkillLevel = dto.MaxSkillLevel,
                City = dto.City.Trim(),
                District = dto.District.Trim(),
                PreferredTime = dto.PreferredTime,
                SlotsNeeded = dto.SlotsNeeded,
                SlotsFilled = 0,
                Note = dto.Note,
                Status = MatchPostStatus.OPEN,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await ApplyVenueFieldsAsync(post, dto.SportId, dto.VenueId, dto.CourtId, dto.ExternalVenueName, cancellationToken);

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
            if (!string.IsNullOrWhiteSpace(dto.City)) post.City = dto.City.Trim();
            if (!string.IsNullOrWhiteSpace(dto.District)) post.District = dto.District.Trim();
            if (dto.PreferredTime.HasValue) post.PreferredTime = dto.PreferredTime.Value;
            if (dto.SlotsNeeded.HasValue) post.SlotsNeeded = dto.SlotsNeeded.Value;
            if (dto.Note != null) post.Note = dto.Note;
            if (dto.Status.HasValue) post.Status = dto.Status.Value;

            if (dto.ClearVenue)
            {
                post.VenueId = null;
                post.CourtId = null;
                post.ExternalVenueName = null;
            }
            else if (dto.VenueId.HasValue || dto.CourtId.HasValue || dto.ExternalVenueName != null)
            {
                await ApplyVenueFieldsAsync(
                    post,
                    post.SportId,
                    dto.VenueId,
                    dto.CourtId,
                    dto.ExternalVenueName,
                    cancellationToken);
            }

            await _matchPostRepository.UpdateAsync(post, cancellationToken);
            var refreshed = await _matchPostRepository.GetByIdAsync(postId, cancellationToken);
            return MapToResponse(refreshed!);
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
                TotalRequests = 0,
                PendingRequests = 0,
                TotalRooms = 0,
                ActiveRooms = 0
            };
        }

        private async Task ApplyVenueFieldsAsync(
            MatchPost post,
            Guid sportId,
            Guid? venueId,
            Guid? courtId,
            string? externalVenueName,
            CancellationToken cancellationToken)
        {
            if (venueId.HasValue)
            {
                var venue = await _venueRepository.GetActiveByIdAsync(venueId.Value, cancellationToken);
                if (venue == null)
                {
                    throw new AppException(ErrorCodes.ValidationError, "Cơ sở thể thao không tồn tại hoặc chưa được duyệt.");
                }

                post.VenueId = venue.Id;
                post.ExternalVenueName = null;
                post.City = venue.City;
                post.District = venue.District;

                if (courtId.HasValue)
                {
                    var court = await _courtRepository.GetPublicCourtByIdAsync(courtId.Value, cancellationToken);
                    if (court == null || court.VenueId != venue.Id)
                    {
                        throw new AppException(ErrorCodes.ValidationError, "Sân không thuộc cơ sở đã chọn.");
                    }

                    if (court.SportId != sportId)
                    {
                        throw new AppException(ErrorCodes.ValidationError, "Sân không phù hợp với môn thể thao đã chọn.");
                    }

                    post.CourtId = court.Id;
                }
                else
                {
                    post.CourtId = null;
                }

                return;
            }

            post.VenueId = null;
            post.CourtId = null;

            if (!string.IsNullOrWhiteSpace(externalVenueName))
            {
                post.ExternalVenueName = externalVenueName.Trim();
            }
            else
            {
                post.ExternalVenueName = null;
            }
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
                VenueId = post.VenueId,
                VenueName = post.Venue?.Name,
                CourtId = post.CourtId,
                CourtName = post.Court?.Name,
                ExternalVenueName = post.ExternalVenueName,
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
