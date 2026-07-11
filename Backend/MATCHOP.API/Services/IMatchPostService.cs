using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Services
{
    public interface IMatchPostService
    {
        Task<MatchPostResponseDto> CreatePostAsync(Guid userId, CreateMatchPostDto dto, CancellationToken cancellationToken = default);
        Task<MatchPostResponseDto> UpdatePostAsync(Guid userId, Guid postId, UpdateMatchPostDto dto, CancellationToken cancellationToken = default);
        Task<List<MatchPostResponseDto>> GetPostsAsync(MatchPostFilterDto filter, CancellationToken cancellationToken = default);
        Task<MatchPostResponseDto> GetPostByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task DeletePostAsync(Guid userId, Guid postId, CancellationToken cancellationToken = default);
        Task DeletePostAsync(Guid postId, CancellationToken cancellationToken = default);
        Task<MatchPostResponseDto> UpdatePostStatusAsync(Guid postId, MatchPostStatus status, CancellationToken cancellationToken = default);
        Task<MatchPostAdminListDto> GetAllPostsAsync(MatchPostFilterDto filter, CancellationToken cancellationToken = default);
        Task<MatchStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken = default);
    }

    public class MatchPostAdminListDto
    {
        public List<MatchPostResponseDto> Posts { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class MatchStatisticsDto
    {
        public int TotalPosts { get; set; }
        public int OpenPosts { get; set; }
        public int FilledPosts { get; set; }
        public int CancelledPosts { get; set; }
        public int TotalRequests { get; set; }
        public int PendingRequests { get; set; }
        public int TotalRooms { get; set; }
        public int ActiveRooms { get; set; }
    }
}
