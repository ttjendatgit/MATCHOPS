using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories;

public interface IVenueRepository
{
    Task<List<Venue>> GetActiveVenuesAsync(
        string? city,
        string? district,
        Guid? sportId,
        string? keyword);

    Task<Venue?> GetActiveByIdAsync(Guid id);
    Task<Venue?> GetByIdAsync(Guid id);
    Task<List<Venue>> GetAllAsync();
    Task<List<Venue>> GetByOwnerIdAsync(Guid ownerId);
    Task<int> CountByOwnerIdAsync(Guid ownerId);
    Task<Venue> CreateAsync(Venue venue);
    Task<Venue> UpdateAsync(Venue venue);
}