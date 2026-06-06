using MATCHOP.API.Services.Interfaces;

namespace MATCHOP.API.Services;

public class BookingExpirationHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookingExpirationHostedService> _logger;

    public BookingExpirationHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<BookingExpirationHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ExpirePendingBookingsAsync(stoppingToken);
                await timer.WaitForNextTickAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to expire pending bookings.");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }
    }

    private async Task ExpirePendingBookingsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var bookingService = scope.ServiceProvider.GetRequiredService<IBookingService>();
        var expiredCount = await bookingService.ExpirePendingBookingsAsync(DateTime.UtcNow);

        if (expiredCount > 0)
        {
            _logger.LogInformation("Expired {ExpiredCount} pending bookings.", expiredCount);
        }
    }
}
