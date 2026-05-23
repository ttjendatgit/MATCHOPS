using MATCHOP.API.Entities;

namespace MATCHOP.API.Repositories.Interfaces;

public interface ICourtRepository
{
    Task<Court?> GetByIdAsync(Guid id);

    Task<Court?> GetPublicCourtByIdAsync(Guid id);

    Task<List<Court>> GetPublicCourtsByVenueIdAsync(Guid venueId);

    Task<List<Court>> GetOwnerCourtsAsync(Guid ownerId);

    Task<Court?> GetOwnerCourtByIdAsync(Guid courtId, Guid ownerId);

    Task<bool> ExistsByNameInVenueAsync(Guid venueId, string name);

    Task<bool> ExistsByNameInVenueExceptAsync(Guid venueId, Guid courtId, string name);

    Task AddAsync(Court court);

    void Update(Court court);

    Task SaveChangesAsync();
}