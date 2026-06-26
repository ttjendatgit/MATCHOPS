using MATCHOP.API.DTOs.Matching;

namespace MATCHOP.API.Services
{
    public interface IMatchPostService
    {
        Task<MatchPostResponseDto> CreatePostAsync(Guid userId, CreateMatchPostDto dto, CancellationToken cancellationToken = default);
        Task<MatchPostResponseDto> UpdatePostAsync(Guid userId, Guid postId, UpdateMatchPostDto dto, CancellationToken cancellationToken = default);
        Task<List<MatchPostResponseDto>> GetPostsAsync(MatchPostFilterDto filter, CancellationToken cancellationToken = default);
        Task<MatchPostResponseDto> GetPostByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task DeletePostAsync(Guid userId, Guid postId, CancellationToken cancellationToken = default);
    }
}
