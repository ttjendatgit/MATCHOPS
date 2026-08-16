import type { TransactionItem } from "@/types/transaction";

const METHOD_LABELS: Record<string, string> = {
  MOCK: "Mock",
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang chờ",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  REFUNDED: "Hoàn tiền",
};

const SOURCE_LABELS: Record<string, string> = {
  MATCHOP: "MATCHOP",
  ZALO: "Zalo",
  FACEBOOK: "Facebook",
  PHONE: "Điện thoại",
  DIRECT: "Trực tiếp",
  OTHER: "Khác",
};

export function exportTransactionsCsv(
  items: TransactionItem[],
  filenamePrefix: string,
  options?: { includeCustomer?: boolean },
) {
  if (items.length === 0) return false;

  const includeCustomer = options?.includeCustomer ?? true;
  const headers = includeCustomer
    ? ["Mã GD", "Mô tả", "Khách hàng", "Email", "SĐT", "Nguồn", "Số tiền", "Phương thức", "Trạng thái", "Thời gian"]
    : ["Mã GD", "Mô tả", "Số tiền", "Phương thức", "Trạng thái", "Thời gian"];

  const rows = items.map((item) => {
    const base = [
      item.transactionCode ?? item.id,
      item.description,
    ];
    if (includeCustomer) {
      base.push(
        item.customerName ?? "",
        item.customerEmail ?? "",
        item.customerPhone ?? "",
        item.bookingSource ? (SOURCE_LABELS[item.bookingSource] ?? item.bookingSource) : "",
      );
    }
    base.push(
      item.amount.toString(),
      METHOD_LABELS[item.method] ?? item.method,
      STATUS_LABELS[item.status] ?? item.status,
      item.paidAt ?? item.createdAt,
    );
    return base;
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export function exportBookingsCsv(
  bookings: Array<{
    customerName?: string | null;
    customerPhone?: string | null;
    courtName: string;
    venueName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: string;
    paymentStatus: string;
    bookingSource?: string;
    totalPrice: number;
  }>,
  filenamePrefix: string,
) {
  if (bookings.length === 0) return false;

  const headers = [
    "Khách hàng",
    "SĐT",
    "Nguồn",
    "Sân",
    "Cụm",
    "Ngày",
    "Giờ",
    "Trạng thái",
    "Thanh toán",
    "Tổng tiền",
  ];

  const rows = bookings.map((b) => [
    b.customerName ?? "",
    b.customerPhone ?? "",
    b.bookingSource ? (SOURCE_LABELS[b.bookingSource] ?? b.bookingSource) : "MATCHOP",
    b.courtName,
    b.venueName,
    b.bookingDate,
    `${b.startTime.slice(0, 5)} – ${b.endTime.slice(0, 5)}`,
    b.status,
    b.paymentStatus,
    b.totalPrice.toString(),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
