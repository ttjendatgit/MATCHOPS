"use client";

import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

export interface MembershipPaymentData {
  qrImageUrl: string;
  paymentContent: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  amount: number;
  expireAt: string;
  pendingSubscriptionId: string;
}

interface MembershipSePayModalProps {
  open: boolean;
  payment: MembershipPaymentData | null;
  planName?: string;
  onOpenChange: (open: boolean) => void;
}

export default function MembershipSePayModal({
  open,
  payment,
  planName,
  onOpenChange,
}: MembershipSePayModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán gói thành viên</DialogTitle>
          <DialogDescription className="text-[#C4C7C9]/70">
            {planName
              ? `Quét mã QR để thanh toán gói ${planName}.`
              : "Vui lòng sử dụng ứng dụng ngân hàng để quét mã QR bên dưới."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4 py-2">
          {payment?.qrImageUrl && (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.qrImageUrl}
                alt="Mã QR thanh toán membership"
                className="h-64 w-64 object-contain"
              />
            </div>
          )}

          {payment && (
            <div className="w-full space-y-1 rounded-lg bg-[#141414] p-3 text-sm">
              <Row label="Ngân hàng" value={payment.bankName} />
              <Row label="Chủ TK" value={payment.accountName} />
              <Row label="Số TK" value={payment.accountNumber} highlight="green" />
              <Row
                label="Số tiền"
                value={formatCurrency(payment.amount)}
                highlight="orange"
              />
              <Row label="Nội dung" value={payment.paymentContent} mono />
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-[#FF8000]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Đang chờ xác nhận thanh toán...
          </div>
          <p className="text-center text-xs text-[#C4C7C9]/45">
            Trang sẽ tự chuyển khi giao dịch thành công (thường trong 1–3 phút).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  highlight,
  mono = false,
}: {
  label: string;
  value: string;
  highlight?: "green" | "orange";
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-[#C4C7C9]/55">{label}:</span>
      <span
        className={[
          "text-right font-medium text-white",
          highlight === "green" && "font-bold text-[#86D232]",
          highlight === "orange" && "font-bold text-[#FF8000]",
          mono && "font-mono text-xs",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
