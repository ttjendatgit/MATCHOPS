using MATCHOP.API.DTOs.Matching;

namespace MATCHOP.API.Services
{
    public interface IMatchPostService
    {
        Task<MatchPostResponseDto> CreatePostAsync(Guid userId, CreateMatchPostDto dto);
        Task<MatchPostResponseDto> UpdatePostAsync(Guid userId, Guid postId, UpdateMatchPostDto dto);
        Task<List<MatchPostResponseDto>> GetPostsAsync(MatchPostFilterDto filter);
        Task<MatchPostResponseDto> GetPostByIdAsync(Guid id);
        Task DeletePostAsync(Guid userId, Guid postId);
    }
}
