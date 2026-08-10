using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories;

public interface IVenueRepository
{
    Task<List<Venue>> GetActiveVenuesAsync(
        string? city,
        string? district,
        Guid? sportId,
        string? keyword,
        CancellationToken cancellationToken = default);

    Task<Venue?> GetActiveByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Venue?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<Venue>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Venue>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<int> CountByOwnerIdAsync(Guid ownerId);
    Task<Venue> CreateAsync(Venue venue, CancellationToken cancellationToken = default);
    Task<Venue> UpdateAsync(Venue venue, CancellationToken cancellationToken = default);
}