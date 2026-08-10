using MATCHOP.API.DTOs.Sports;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services
{
    public class SportService : ISportService
    {
        private readonly ApplicationDbContext _context;

        public SportService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<SportResponseDto>> GetActiveSportsAsync(CancellationToken cancellationToken = default)
        {
            var sports = await _context.Sports
                .AsNoTracking()
                .Where(x => x.Status == SportStatus.ACTIVE)
                .OrderBy(x => x.Name)
                .ToListAsync(cancellationToken);

            return sports.Select(MapToResponse).ToList();
        }

        public async Task<List<SportResponseDto>> GetAllSportsAsync(CancellationToken cancellationToken = default)
        {
            var sports = await _context.Sports
                .AsNoTracking()
                .OrderBy(x => x.Name)
                .ToListAsync(cancellationToken);

            return sports.Select(MapToResponse).ToList();
        }

        public async Task<SportResponseDto> GetActiveSportByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var sport = await _context.Sports
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.Status == SportStatus.ACTIVE, cancellationToken);

            if (sport == null)
            {
                throw new AppException(
                    ErrorCodes.SportNotFound,
                    "Không tìm thấy môn thể thao.",
                    StatusCodes.Status404NotFound);
            }

            return MapToResponse(sport);
        }

        public async Task<SportResponseDto> CreateSportAsync(CreateSportDto dto, CancellationToken cancellationToken = default)
        {
            var name = dto.Name.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    "Tên môn thể thao không được để trống.");
            }

            var nameExists = await _context.Sports.AnyAsync(x =>
                x.Name.ToLower() == name.ToLower(), cancellationToken);

            if (nameExists)
            {
                throw new AppException(
                    ErrorCodes.SportNameAlreadyExists,
                    "Tên môn thể thao đã tồn tại.");
            }

            var sport = new Sport
            {
                Id = Guid.NewGuid(),
                Name = name,
                Icon = string.IsNullOrWhiteSpace(dto.Icon) ? null : dto.Icon.Trim(),
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                Status = SportStatus.ACTIVE,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Sports.Add(sport);
            await _context.SaveChangesAsync(cancellationToken);

            return MapToResponse(sport);
        }

        public async Task<SportResponseDto> UpdateSportAsync(Guid id, UpdateSportDto dto, CancellationToken cancellationToken = default)
        {
            var sport = await _context.Sports.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (sport == null)
            {
                throw new AppException(
                    ErrorCodes.SportNotFound,
                    "Không tìm thấy môn thể thao.",
                    StatusCodes.Status404NotFound);
            }

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                var newName = dto.Name.Trim();

                var nameExists = await _context.Sports.AnyAsync(x =>
                    x.Id != id &&
                    x.Name.ToLower() == newName.ToLower(), cancellationToken);

                if (nameExists)
                {
                    throw new AppException(
                        ErrorCodes.SportNameAlreadyExists,
                        "Tên môn thể thao đã tồn tại.");
                }

                sport.Name = newName;
            }

            if (dto.Icon != null)
            {
                sport.Icon = string.IsNullOrWhiteSpace(dto.Icon)
                    ? null
                    : dto.Icon.Trim();
            }

            if (dto.Description != null)
            {
                sport.Description = string.IsNullOrWhiteSpace(dto.Description)
                    ? null
                    : dto.Description.Trim();
            }

            if (dto.Status.HasValue)
            {
                sport.Status = dto.Status.Value;
            }

            sport.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return MapToResponse(sport);
        }

        public async Task DeleteSportAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var sport = await _context.Sports.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (sport == null)
            {
                throw new AppException(
                    ErrorCodes.SportNotFound,
                    "Không tìm thấy môn thể thao.",
                    StatusCodes.Status404NotFound);
            }

            sport.Status = SportStatus.INACTIVE;
            sport.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
        }

        private static SportResponseDto MapToResponse(Sport sport)
        {
            return new SportResponseDto
            {
                Id = sport.Id,
                Name = sport.Name,
                Icon = sport.Icon,
                Description = sport.Description,
                Status = sport.Status.ToString(),
                CreatedAt = sport.CreatedAt,
                UpdatedAt = sport.UpdatedAt
            };
        }
    }
}