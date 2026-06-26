using MATCHOP.API.DTOs.Profile;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using MATCHOP.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/profile")]
    public class ProfileController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ICurrentUserService _currentUserService;

        public ProfileController(IUserService userService, ICurrentUserService currentUserService)
        {
            _userService = userService;
            _currentUserService = currentUserService;
        }

        private Guid GetUserId()
        {
            return _currentUserService.UserId
                   ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized", StatusCodes.Status401Unauthorized);
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile(CancellationToken cancellationToken = default)
        {
            var userId = GetUserId();
            var result = await _userService.GetProfileAsync(userId, cancellationToken);
            return Ok(ApiResponse<GetProfileResponseDto>.Ok(result));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile(UpdateProfileRequestDto dto, CancellationToken cancellationToken = default)
        {
            var userId = GetUserId();
            var result = await _userService.UpdateProfileAsync(userId, dto, cancellationToken);
            return Ok(ApiResponse<GetProfileResponseDto>.Ok(result, "Profile updated successfully"));
        }

        [HttpPost("avatar")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadAvatar([FromForm] UploadAvatarRequestDto dto, CancellationToken cancellationToken = default)
        {
            var userId = GetUserId();
            var avatarUrl = await _userService.UploadAvatarAsync(userId, dto, cancellationToken);
            return Ok(ApiResponse<object>.Ok(new { avatarUrl }, "Upload avatar successfully"));
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordRequestDto dto, CancellationToken cancellationToken = default)
        {
            var userId = GetUserId();
            await _userService.ChangePasswordAsync(userId, dto, cancellationToken);
            return Ok(ApiResponse<object>.Ok("Change password successfully"));
        }

        [HttpGet("favorite-sports")]
        public async Task<IActionResult> GetFavoriteSports(CancellationToken cancellationToken = default)
        {
            var userId = GetUserId();
            var result = await _userService.GetFavoriteSportsAsync(userId, cancellationToken);
            return Ok(ApiResponse<List<FavoriteSportDto>>.Ok(result));
        }

        [HttpPut("favorite-sports")]
        public async Task<IActionResult> UpdateFavoriteSports(UpdateFavoriteSportsRequestDto dto, CancellationToken cancellationToken = default)
        {
            var userId = GetUserId();
            var result = await _userService.UpdateFavoriteSportsAsync(userId, dto, cancellationToken);
            return Ok(ApiResponse<List<FavoriteSportDto>>.Ok(result, "Favorite sports updated successfully"));
        }
    }
}

