"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOOKING_CONFIRMATION_KEY } from "@/lib/mock/bookingMockData";

export default function VNPayCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Đang xác thực giao dịch...");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // VNPay return all params in query string
        const queryString = searchParams.toString();
        const res = await apiFetch<ApiResponse<any>>(`/payments/vnpay/return?${queryString}`);

        if (res.success) {
          setStatus("success");
          setMessage("Thanh toán thành công!");
          
          // Clear draft session if exists
          sessionStorage.removeItem("MATCHOP_BOOKING_DRAFT");
        } else {
          setStatus("error");
          setMessage(res.message || "Giao dịch không thành công hoặc đã bị hủy.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Đã xảy ra lỗi khi xử lý kết quả thanh toán.");
      }
    };

    if (searchParams.get("vnp_ResponseCode")) {
      verifyPayment();
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      {status === "loading" && (
        <div className="space-y-4">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#FF8000]" />
          <h1 className="text-xl font-bold text-white">{message}</h1>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#86D232]/10">
            <CheckCircle2 className="h-10 w-10 text-[#86D232]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Thành công!</h1>
            <p className="text-slate-400">{message}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button 
              onClick={() => router.push("/bookings")}
              className="bg-[#FF8000] hover:bg-[#FF8000]/90 text-white px-8"
            >
              Xem lịch đặt sân
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/")}
              className="border-white/10 text-white"
            >
              Về trang chủ
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Thất bại</h1>
            <p className="text-slate-400">{message}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button 
              onClick={() => router.push("/venues")}
              className="bg-[#FF8000] hover:bg-[#FF8000]/90 text-white px-8"
            >
              Thử đặt lại sân
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/bookings")}
              className="border-white/10 text-white"
            >
              Lịch đặt của tôi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
