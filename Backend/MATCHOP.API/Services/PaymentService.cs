using MATCHOP.API.DTOs.Payments;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories.Interfaces;
using MATCHOP.API.Services.Interfaces;
using Microsoft.Extensions.Configuration;

namespace MATCHOP.API.Services;

public class PaymentService : IPaymentService
{
    private readonly IBookingRepository _bookingRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;

    public PaymentService(
        IBookingRepository bookingRepository,
        ICurrentUserService currentUserService,
        IConfiguration config,
        ApplicationDbContext context)
    {
        _bookingRepository = bookingRepository;
        _currentUserService = currentUserService;
        _config = config;
        _context = context;
    }

    public async Task<CreateVNPayPaymentResponseDto> CreateVNPayPaymentAsync(
        Guid bookingId,
        string ipAddress)
    {
        var userId = GetCurrentUserIdOrThrow();

        var booking = await _bookingRepository.GetByIdAndUserIdAsync(bookingId, userId);
        if (booking is null)
            throw new AppException(
                ErrorCodes.BookingNotFound,
                "Không tìm thấy booking của bạn.",
                StatusCodes.Status404NotFound);

        // Kiểm tra booking còn hạn không
        if (booking.Status == BookingStatus.PENDING_PAYMENT &&
            booking.ExpireAt is not null &&
            booking.ExpireAt <= DateTime.UtcNow)
            throw new AppException(
                ErrorCodes.BookingExpired,
                "Booking đã hết hạn thanh toán. Vui lòng đặt lại.",
                StatusCodes.Status400BadRequest);

        if (booking.Status != BookingStatus.PENDING_PAYMENT)
            throw new AppException(
                ErrorCodes.BookingAlreadyPaid,
                "Booking này không ở trạng thái chờ thanh toán.",
                StatusCodes.Status400BadRequest);

        // Lấy config VNPay
        var tmnCode   = _config["VNPay:TmnCode"]!;
        var hashSecret = _config["VNPay:HashSecret"]!;
        var baseUrl   = _config["VNPay:BaseUrl"]!;
        var returnUrl = _config["VNPay:ReturnUrl"]!;
        var version   = _config["VNPay:Version"]!;
        var command   = _config["VNPay:Command"]!;
        var currCode  = _config["VNPay:CurrCode"]!;
        var locale    = _config["VNPay:Locale"]!;

        var now = DateTime.UtcNow.AddHours(7); // Giờ VN (UTC+7)
        var expireTime = now.AddMinutes(10);

        // Amount: VNPay yêu cầu nhân 100
        var amount = (long)(booking.TotalPrice * 100);

        // OrderId = bookingId để sau này match lại
        var orderId = booking.Id.ToString("N")[..16].ToUpper();

        var parameters = new SortedList<string, string>(StringComparer.Ordinal)
        {
            { "vnp_Version",    version },
            { "vnp_Command",    command },
            { "vnp_TmnCode",    tmnCode },
            { "vnp_Amount",     amount.ToString() },
            { "vnp_CreateDate", now.ToString("yyyyMMddHHmmss") },
            { "vnp_CurrCode",   currCode },
            { "vnp_IpAddr",     ipAddress },
            { "vnp_Locale",     locale },
            { "vnp_OrderInfo",  $"Thanh toan dat san MATCHOP - {booking.Id}" },
            { "vnp_OrderType",  "other" },
            { "vnp_ReturnUrl",  returnUrl },
            { "vnp_TxnRef",     orderId },
            { "vnp_ExpireDate", expireTime.ToString("yyyyMMddHHmmss") }
        };

        // Tạo chữ ký
        var rawData  = VNPayHelper.BuildQueryString(parameters);
        var secureHash = VNPayHelper.HmacSHA512(hashSecret, rawData);
        parameters.Add("vnp_SecureHash", secureHash);

        // Build payment URL
        var paymentUrl = $"{baseUrl}?{VNPayHelper.BuildQueryString(parameters)}";

        return new CreateVNPayPaymentResponseDto
        {
            PaymentUrl = paymentUrl,
            OrderId    = orderId,
            Amount     = booking.TotalPrice,
            ExpireAt   = booking.ExpireAt ?? DateTime.UtcNow.AddMinutes(10)
        };
    }

    public async Task<VNPayReturnDto> HandleVNPayReturnAsync(IQueryCollection query)
    {
        var hashSecret = _config["VNPay:HashSecret"]!;

        // Verify chữ ký
        if (!VNPayHelper.ValidateSignature(query, hashSecret))
            return new VNPayReturnDto
            {
                Success = false,
                Message = "Chữ ký không hợp lệ."
            };

        var responseCode = query["vnp_ResponseCode"].ToString();
        var txnRef       = query["vnp_TxnRef"].ToString();
        var transactionNo = query["vnp_TransactionNo"].ToString();
        var amountStr    = query["vnp_Amount"].ToString();
        var orderInfo    = query["vnp_OrderInfo"].ToString();

        // Lấy bookingId từ OrderInfo
        // Format: "Thanh toan dat san MATCHOP - {bookingId}"
        var bookingIdStr = orderInfo.Split(" - ").LastOrDefault();
        if (!Guid.TryParse(bookingIdStr, out var bookingId))
            return new VNPayReturnDto
            {
                Success = false,
                Message = "Không xác định được booking."
            };

        var booking = await _bookingRepository.GetByIdAsync(bookingId);
        if (booking is null)
            return new VNPayReturnDto
            {
                Success = false,
                Message = "Booking không tồn tại."
            };

        // Thanh toán thành công
        if (responseCode == "00")
        {
            // Kiểm tra chưa xử lý (tránh duplicate callback)
            if (booking.Status == BookingStatus.CONFIRMED)
                return new VNPayReturnDto
                {
                    Success       = true,
                    Message       = "Booking đã được xác nhận trước đó.",
                    OrderId       = txnRef,
                    TransactionCode = transactionNo,
                    Amount        = decimal.Parse(amountStr) / 100,
                    BookingStatus = booking.Status.ToString()
                };

            if (booking.Status != BookingStatus.PENDING_PAYMENT)
                return new VNPayReturnDto
                {
                    Success = false,
                    Message = "Booking không ở trạng thái chờ thanh toán.",
                    BookingStatus = booking.Status.ToString()
                };

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Cập nhật booking
                booking.Status        = BookingStatus.CONFIRMED;
                booking.PaymentStatus = BookingPaymentStatus.PAID;
                booking.ExpireAt      = null;
                booking.UpdatedAt     = DateTime.UtcNow;

                // Cập nhật slots
                foreach (var slot in booking.BookingSlots
                    .Where(s => s.Status == BookingSlotStatus.HOLDING))
                {
                    slot.Status    = BookingSlotStatus.BOOKED;
                    slot.UpdatedAt = DateTime.UtcNow;
                }

                // Tạo payment record
                _context.Payments.Add(new Entities.Payment
                {
                    Id              = Guid.NewGuid(),
                    BookingId       = booking.Id,
                    UserId          = booking.UserId,
                    Amount          = decimal.Parse(amountStr) / 100,
                    Method          = PaymentMethod.BANK_TRANSFER,
                    Status          = PaymentTransactionStatus.SUCCESS,
                    TransactionCode = transactionNo,
                    PaidAt          = DateTime.UtcNow,
                    CreatedAt       = DateTime.UtcNow,
                    UpdatedAt       = DateTime.UtcNow
                });

                await _bookingRepository.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

            return new VNPayReturnDto
            {
                Success         = true,
                Message         = "Thanh toán thành công.",
                OrderId         = txnRef,
                TransactionCode = transactionNo,
                Amount          = decimal.Parse(amountStr) / 100,
                BookingStatus   = booking.Status.ToString()
            };
        }

        // Thanh toán thất bại
        return new VNPayReturnDto
        {
            Success       = false,
            Message       = GetVNPayErrorMessage(responseCode),
            OrderId       = txnRef,
            BookingStatus = booking.Status.ToString()
        };
    }

    private static string GetVNPayErrorMessage(string responseCode) => responseCode switch
    {
        "07" => "Trừ tiền thành công nhưng giao dịch bị nghi ngờ gian lận.",
        "09" => "Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking.",
        "10" => "Xác thực thông tin thẻ/tài khoản quá 3 lần.",
        "11" => "Đã hết hạn chờ thanh toán.",
        "12" => "Thẻ/Tài khoản bị khóa.",
        "13" => "Sai mật khẩu OTP.",
        "24" => "Giao dịch bị hủy.",
        "51" => "Tài khoản không đủ số dư.",
        "65" => "Tài khoản vượt quá hạn mức giao dịch trong ngày.",
        "75" => "Ngân hàng thanh toán đang bảo trì.",
        "79" => "Sai mật khẩu quá số lần quy định.",
        _    => $"Thanh toán thất bại (mã lỗi: {responseCode})."
    };

    private Guid GetCurrentUserIdOrThrow()
    {
        if (_currentUserService.UserId is null)
            throw new AppException(
                ErrorCodes.AuthRequired,
                "Bạn chưa đăng nhập.",
                StatusCodes.Status401Unauthorized);
        return _currentUserService.UserId.Value;
    }
}