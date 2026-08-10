using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/user-skills")]
    public class UserSkillsController : ControllerBase
    {
        private readonly IUserSkillService _userSkillService;
        private readonly ICurrentUserService _currentUserService;

        public UserSkillsController(IUserSkillService userSkillService, ICurrentUserService currentUserService)
        {
            _userSkillService = userSkillService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMySkills(CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _userSkillService.GetUserSkillsAsync(userId, cancellationToken);
            return Ok(ApiResponse<List<UserSkillResponseDto>>.Ok(result));
        }

        [HttpPost]
        public async Task<IActionResult> UpdateSkill(UpdateUserSkillDto dto, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _userSkillService.UpdateUserSkillAsync(userId, dto, cancellationToken);
            return Ok(ApiResponse<UserSkillResponseDto>.Ok(result, "Cập nhật trình độ thành công."));
        }
    }
}
