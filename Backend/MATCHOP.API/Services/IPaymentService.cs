using MATCHOP.API.DTOs.Payments;
using Microsoft.AspNetCore.Http;

namespace MATCHOP.API.Services.Interfaces;

public interface IPaymentService
{
    Task<CreateVNPayPaymentResponseDto> CreateVNPayPaymentAsync(
        Guid bookingId,
        string ipAddress);

    Task<VNPayReturnDto> HandleVNPayReturnAsync(IQueryCollection query);
}