using MATCHOP.API.Entities;

namespace MATCHOP.API.Repositories.Interfaces;

public interface ICourtRepository
{
    Task<Court?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Court?> GetPublicCourtByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<List<Court>> GetPublicCourtsByVenueIdAsync(Guid venueId, CancellationToken cancellationToken = default);

    Task<List<Court>> GetOwnerCourtsAsync(Guid ownerId, CancellationToken cancellationToken = default);

    Task<Court?> GetOwnerCourtByIdAsync(Guid courtId, Guid ownerId, CancellationToken cancellationToken = default);

    Task<bool> ExistsByNameInVenueAsync(Guid venueId, string name, CancellationToken cancellationToken = default);

    Task<bool> ExistsByNameInVenueExceptAsync(Guid venueId, Guid courtId, string name, CancellationToken cancellationToken = default);

    Task AddAsync(Court court, CancellationToken cancellationToken = default);

    void Update(Court court);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);

    Task<List<Court>> GetAllAsync(CancellationToken cancellationToken = default);
}