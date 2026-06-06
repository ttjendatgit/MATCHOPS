import { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = { title: "Xác thực email" };

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-slate-100 bg-white p-8 shadow-sm text-center">
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <MailCheck className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <h1 className="mb-2 text-xl font-bold text-slate-900">Xác thực email của bạn</h1>
        <p className="mb-6 text-sm text-slate-500 leading-relaxed">
          Chúng tôi đã gửi email xác thực. Vui lòng kiểm tra hộp thư và nhấn vào đường link để kích hoạt tài khoản.
        </p>
        <Button variant="outline" className="w-full mb-3" type="button">Gửi lại email</Button>
        <Link href="/login" className="block text-sm text-primary hover:underline">Quay lại đăng nhập</Link>
      </div>
    </div>
  );
}
