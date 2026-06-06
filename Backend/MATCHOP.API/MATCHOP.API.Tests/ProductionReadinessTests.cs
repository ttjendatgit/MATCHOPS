using MATCHOP.API.Controllers;
using MATCHOP.API.DTOs.Bookings;
using MATCHOP.API.DTOs.PriceRules;
using MATCHOP.API.Enums;
using MATCHOP.API.Validators;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Tests;

public class ProductionReadinessTests
{
    [Fact]
    public void Availability_route_is_not_double_prefixed()
    {
        var controllerRoute = typeof(CourtsController)
            .GetCustomAttributes(typeof(RouteAttribute), inherit: false)
            .Cast<RouteAttribute>()
            .Single();

        var actionRoute = typeof(CourtsController)
            .GetMethod(nameof(CourtsController.GetAvailability))!
            .GetCustomAttributes(typeof(HttpGetAttribute), inherit: false)
            .Cast<HttpGetAttribute>()
            .Single();

        Assert.Equal("api", controllerRoute.Template);
        Assert.Equal("courts/{id:guid}/availability", actionRoute.Template);
    }

    [Fact]
    public void Create_booking_validator_rejects_empty_court_and_invalid_time_range()
    {
        var validator = new CreateBookingDtoValidator();

        var result = validator.Validate(new CreateBookingDto
        {
            CourtId = Guid.Empty,
            BookingDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(9, 30)
        });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == "CourtId");
        Assert.Contains(result.Errors, error => error.PropertyName == "startTime");
    }

    [Fact]
    public void Offline_booking_validator_requires_customer_information()
    {
        var validator = new CreateOfflineBookingDtoValidator();

        var result = validator.Validate(new CreateOfflineBookingDto
        {
            CourtId = Guid.NewGuid(),
            BookingDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            CustomerName = " ",
            CustomerPhone = "abc"
        });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == "CustomerName");
        Assert.Contains(result.Errors, error => error.PropertyName == "CustomerPhone");
    }

    [Fact]
    public void Price_rule_validator_rejects_invalid_price_and_time_range()
    {
        var validator = new CreatePriceRuleDtoValidator();

        var result = validator.Validate(new CreatePriceRuleDto
        {
            CourtId = Guid.NewGuid(),
            DayType = DayType.ALL,
            StartTime = new TimeOnly(20, 0),
            EndTime = new TimeOnly(19, 0),
            PricePerHour = 0
        });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == "startTime");
        Assert.Contains(result.Errors, error => error.PropertyName == "PricePerHour");
    }
}
