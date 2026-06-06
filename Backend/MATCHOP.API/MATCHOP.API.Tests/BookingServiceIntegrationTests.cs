using MATCHOP.API;
using MATCHOP.API.DTOs.Bookings;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;
using MATCHOP.API.Services;
using MATCHOP.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace MATCHOP.API.Tests;

public class BookingServiceIntegrationTests
{
    [Fact]
    public async Task Pay_mock_confirms_booking_and_marks_slots_booked()
    {
        await using var context = CreateContext();
        var seed = SeedActiveCourt(context);
        var service = CreateService(context, seed.UserId);

        var booking = await service.CreateBookingAsync(new CreateBookingDto
        {
            CourtId = seed.CourtId,
            BookingDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0)
        });

        var paid = await service.PayMyBookingMockAsync(booking.Id, new MockPaymentRequestDto());

        Assert.Equal(nameof(BookingStatus.CONFIRMED), paid.Status);
        Assert.Equal(nameof(BookingPaymentStatus.PAID), paid.PaymentStatus);
        Assert.All(paid.Slots, slot => Assert.Equal(nameof(BookingSlotStatus.BOOKED), slot.Status));
        Assert.Single(paid.Payments);
        Assert.Equal(nameof(PaymentTransactionStatus.SUCCESS), paid.Payments[0].Status);
    }

    [Fact]
    public async Task Overlapping_confirmed_booking_is_rejected()
    {
        await using var context = CreateContext();
        var seed = SeedActiveCourt(context);
        var service = CreateService(context, seed.UserId);
        var date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));

        var booking = await service.CreateBookingAsync(new CreateBookingDto
        {
            CourtId = seed.CourtId,
            BookingDate = date,
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0)
        });
        await service.PayMyBookingMockAsync(booking.Id, new MockPaymentRequestDto());

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.CreateBookingAsync(new CreateBookingDto
            {
                CourtId = seed.CourtId,
                BookingDate = date,
                StartTime = new TimeOnly(10, 30),
                EndTime = new TimeOnly(11, 30)
            }));

        Assert.Equal(ErrorCodes.SlotAlreadyBooked, exception.Code);
        Assert.Equal(StatusCodes.Status409Conflict, exception.StatusCode);
    }

    [Fact]
    public async Task Expired_pending_booking_releases_slot_for_new_booking()
    {
        await using var context = CreateContext();
        var seed = SeedActiveCourt(context);
        var service = CreateService(context, seed.UserId);
        var date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));

        var booking = await service.CreateBookingAsync(new CreateBookingDto
        {
            CourtId = seed.CourtId,
            BookingDate = date,
            StartTime = new TimeOnly(12, 0),
            EndTime = new TimeOnly(13, 0)
        });

        var entity = await context.Bookings
            .Include(x => x.BookingSlots)
            .FirstAsync(x => x.Id == booking.Id);
        entity.ExpireAt = DateTime.UtcNow.AddMinutes(-1);
        await context.SaveChangesAsync();

        var expiredCount = await service.ExpirePendingBookingsAsync(DateTime.UtcNow);

        var replacement = await service.CreateBookingAsync(new CreateBookingDto
        {
            CourtId = seed.CourtId,
            BookingDate = date,
            StartTime = new TimeOnly(12, 0),
            EndTime = new TimeOnly(13, 0)
        });

        Assert.Equal(1, expiredCount);
        Assert.Equal(nameof(BookingStatus.PENDING_PAYMENT), replacement.Status);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new ApplicationDbContext(options);
    }

    private static BookingService CreateService(ApplicationDbContext context, Guid userId)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Booking:SlotMinutes"] = "30",
                ["Booking:PendingExpireMinutes"] = "10",
                ["Booking:MinBookingMinutes"] = "30",
                ["Booking:MaxBookingHours"] = "4"
            })
            .Build();

        return new BookingService(
            context,
            new BookingRepository(context),
            new BookingSlotRepository(context),
            new CourtRepository(context),
            new PriceRuleRepository(context),
            new FakeCurrentUserService(userId),
            configuration);
    }

    private static SeedIds SeedActiveCourt(ApplicationDbContext context)
    {
        var userId = Guid.NewGuid();
        var sportId = Guid.NewGuid();
        var venueId = Guid.NewGuid();
        var courtId = Guid.NewGuid();

        context.Users.Add(new User
        {
            Id = userId,
            FullName = "Test User",
            Email = $"{userId:N}@example.com",
            Role = UserRole.USER,
            Status = UserStatus.ACTIVE,
            EmailConfirmed = true,
            AuthProvider = "LOCAL",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.Sports.Add(new Sport
        {
            Id = sportId,
            Name = $"Sport {sportId:N}",
            Status = SportStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.Venues.Add(new Venue
        {
            Id = venueId,
            OwnerId = userId,
            Name = "Venue",
            Address = "123 Test Street",
            City = "Ho Chi Minh",
            District = "District 1",
            OpeningTime = new TimeOnly(6, 0),
            ClosingTime = new TimeOnly(22, 0),
            Status = VenueStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.Courts.Add(new Court
        {
            Id = courtId,
            VenueId = venueId,
            SportId = sportId,
            Name = "Court 1",
            Status = CourtStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.PriceRules.Add(new PriceRule
        {
            Id = Guid.NewGuid(),
            CourtId = courtId,
            DayType = DayType.ALL,
            StartTime = new TimeOnly(6, 0),
            EndTime = new TimeOnly(22, 0),
            PricePerHour = 100000,
            Status = PriceRuleStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.SaveChanges();
        return new SeedIds(userId, courtId);
    }

    private sealed record SeedIds(Guid UserId, Guid CourtId);

    private sealed class FakeCurrentUserService : ICurrentUserService
    {
        public FakeCurrentUserService(Guid userId)
        {
            UserId = userId;
        }

        public Guid? UserId { get; }
        public string? Email => "test@example.com";
        public string? Role => nameof(UserRole.USER);
        public bool IsAuthenticated => true;
    }
}
