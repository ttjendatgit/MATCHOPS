using MATCHOP.API.DTOs.Payments;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    /// <summary>
    /// USER gọi API này để lấy thông tin QR SePay (VietQR).
    /// FE hiển thị QR + hướng dẫn nội dung chuyển khoản.
    /// </summary>
    [HttpPost("api/my/bookings/{bookingId:guid}/pay/sepay")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> CreateSePayQr(
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        var result = await _paymentService.CreateSePayQrAsync(bookingId, cancellationToken);
        return Ok(ApiResponse<CreateSePayQrResponseDto>.Ok(result, "Tạo QR thanh toán thành công."));
    }

    /// <summary>
    /// SePay gọi POST về đây khi có giao dịch ngân hàng.
    /// Không cần auth JWT — SePay xác thực bằng API Key trong header Authorization.
    /// Phải trả về HTTP 200 + { "success": true } trong vòng 30 giây.
    /// </summary>
    [HttpPost("api/payments/sepay/webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> SePayWebhook(
        [FromBody] SePayWebhookPayload payload,
        CancellationToken cancellationToken = default)
    {
        var authHeader = Request.Headers.Authorization.ToString();

        var result = await _paymentService.HandleSePayWebhookAsync(
            payload, authHeader, cancellationToken);

        // SePay yêu cầu luôn trả HTTP 200 với { success: true/false }
        // Nếu trả non-200, SePay sẽ retry nhiều lần (Fibonacci backoff)
        return Ok(result);
    }
}