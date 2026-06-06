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
    /// USER gọi API này để lấy URL thanh toán VNPay
    /// FE redirect user sang URL đó
    /// </summary>
    [HttpPost("api/my/bookings/{bookingId:guid}/pay/vnpay")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> CreateVNPayPayment(Guid bookingId)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            ?? "127.0.0.1";

        var result = await _paymentService.CreateVNPayPaymentAsync(bookingId, ipAddress);
        return Ok(ApiResponse<CreateVNPayPaymentResponseDto>.Ok(
            result,
            "Tạo link thanh toán thành công."));
    }

    /// <summary>
    /// VNPay gọi callback về đây sau khi user thanh toán xong
    /// Không cần auth — VNPay gọi trực tiếp
    /// </summary>
    [HttpGet("api/payments/vnpay/return")]
    [AllowAnonymous]
    public async Task<IActionResult> VNPayReturn()
    {
        var result = await _paymentService.HandleVNPayReturnAsync(Request.Query);

        if (result.Success)
            return Ok(ApiResponse<VNPayReturnDto>.Ok(
                result,
                "Thanh toán thành công."));

        return BadRequest(ApiResponse<VNPayReturnDto>.Fail(result.Message));
    }
}