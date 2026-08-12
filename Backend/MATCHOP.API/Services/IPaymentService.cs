using MATCHOP.API.DTOs.Payments;
using Microsoft.AspNetCore.Http;

namespace MATCHOP.API.Services.Interfaces;

public interface IPaymentService
{
    /// <summary>
    /// Tạo thông tin QR chuyển khoản SePay cho booking.
    /// FE hiển thị QR và hướng dẫn user chuyển khoản.
    /// </summary>
    Task<CreateSePayQrResponseDto> CreateSePayQrAsync(
        Guid bookingId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Tạo thông tin QR chuyển khoản SePay cho coach session.
    /// FE hiển thị QR và hướng dẫn user chuyển khoản.
    /// </summary>
    Task<CreateSePayQrResponseDto> CreateSePayQrForCoachSessionAsync(
        Guid sessionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Nhận webhook từ SePay khi có giao dịch ngân hàng.
    /// Phải trả về { success: true } với HTTP 200 trong &lt;30 giây.
    /// </summary>
    Task<SePayWebhookResponse> HandleSePayWebhookAsync(
        SePayWebhookPayload payload,
        string? authorizationHeader,
        CancellationToken cancellationToken = default);
}