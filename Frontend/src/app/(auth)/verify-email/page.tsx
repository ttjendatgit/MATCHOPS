"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  MailCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type PageState = "waiting" | "checking" | "success" | "error";

// ── Shared card shell (matches auth dark glassmorphism) ───────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm p-8 space-y-5 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-[rgba(255,128,0,0.18)] shadow-2xl shadow-black/60 text-center">
      {children}
    </div>
  );
}

// ── Icon circle helpers ────────────────────────────────────────────────────────

function IconCircle({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "orange" | "green" | "red";
}) {
  const styles = {
    orange: "bg-[rgba(255,128,0,0.1)] border-[rgba(255,128,0,0.2)]",
    green:  "bg-[rgba(134,210,50,0.1)] border-[rgba(134,210,50,0.2)]",
    red:    "bg-red-500/10 border-red-500/20",
  };
  return (
    <div className="flex justify-center">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full border ${styles[color]}`}>
        {children}
      </div>
    </div>
  );
}

// ── Resend banners ────────────────────────────────────────────────────────────

function ResendSuccess() {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-[rgba(134,210,50,0.2)] bg-[rgba(134,210,50,0.08)] px-4 py-3 text-sm text-[#86D232] text-left"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
      Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.
    </div>
  );
}

function ResendError({ msg }: { msg: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-400 text-left"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      {msg}
    </div>
  );
}

// ── Resend button ─────────────────────────────────────────────────────────────

function ResendButton({
  loading,
  done,
  onClick,
}: {
  loading: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || done}
      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg border border-[rgba(255,128,0,0.3)] bg-[rgba(255,128,0,0.08)] text-[#FF8000] font-semibold hover:bg-[rgba(255,128,0,0.15)] focus:outline-none focus:ring-2 focus:ring-[#FF8000]/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-[#FF8000]/30 border-t-[#FF8000]"
            aria-hidden
          />
          Đang gửi...
        </>
      ) : done ? (
        <>
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Đã gửi lại
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Gửi lại email xác thực
        </>
      )}
    </button>
  );
}

// ── Suspense loading fallback ─────────────────────────────────────────────────

function LoadingCard() {
  return (
    <Card>
      <IconCircle color="orange">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </IconCircle>
      <p className="text-sm text-slate-400">Đang tải...</p>
    </Card>
  );
}

// ── Main logic component ──────────────────────────────────────────────────────

function VerifyEmailContent() {
  const params = useSearchParams();
  const email  = params.get("email") ?? "";
  const token  = params.get("token") ?? "";

  const [pageState,     setPageState]     = useState<PageState>(
    email && token ? "checking" : "waiting",
  );
  const [verifyError,   setVerifyError]   = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone,    setResendDone]    = useState(false);
  const [resendError,   setResendError]   = useState<string | null>(null);

  // Auto-verify when both email and token are present (link from email)
  useEffect(() => {
    if (!email || !token) return;

    setPageState("checking");
    apiFetch<unknown>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, token }),
    })
      .then(() => setPageState("success"))
      .catch((err: unknown) => {
        setVerifyError(
          err instanceof Error
            ? err.message
            : "Liên kết xác thực không hợp lệ hoặc đã hết hạn.",
        );
        setPageState("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — email/token come from URL, never change

  const handleResend = async () => {
    if (!email || resendLoading) return;
    setResendLoading(true);
    setResendDone(false);
    setResendError(null);

    try {
      await apiFetch<unknown>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResendDone(true);
    } catch (err: unknown) {
      setResendError(
        err instanceof Error
          ? err.message
          : "Không thể gửi lại email. Vui lòng thử lại sau.",
      );
    } finally {
      setResendLoading(false);
    }
  };

  // ── C: No email — invalid or missing link ──────────────────────────────────

  if (!email) {
    return (
      <Card>
        <IconCircle color="red">
          <XCircle className="h-8 w-8 text-red-400" />
        </IconCircle>
        <h1 className="text-xl font-bold text-white">Liên kết không hợp lệ</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Liên kết xác thực không chứa thông tin email. Vui lòng thử đăng ký lại hoặc liên hệ hỗ trợ.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-[#FF8000] text-white font-semibold hover:bg-[#FF8000]/85 shadow-[0_0_20px_rgba(255,128,0,0.35)] transition-all duration-200"
          >
            Đăng ký lại
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/login"
            className="block text-sm text-slate-400 hover:text-white transition-colors duration-200"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </Card>
    );
  }

  // ── A: Verifying ───────────────────────────────────────────────────────────

  if (pageState === "checking") {
    return (
      <Card>
        <IconCircle color="orange">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
        </IconCircle>
        <h1 className="text-xl font-bold text-white">Đang xác thực email...</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Vui lòng đợi trong giây lát.
        </p>
      </Card>
    );
  }

  // ── A: Success ─────────────────────────────────────────────────────────────

  if (pageState === "success") {
    return (
      <Card>
        <IconCircle color="green">
          <CheckCircle2 className="h-8 w-8 text-[#86D232]" />
        </IconCircle>
        <h1 className="text-xl font-bold text-white">Xác thực email thành công!</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.
        </p>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-[#FF8000] text-white font-semibold hover:bg-[#FF8000]/85 shadow-[0_0_20px_rgba(255,128,0,0.35)] hover:shadow-[0_0_28px_rgba(255,128,0,0.55)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[#FF8000] transition-all duration-300"
        >
          Đăng nhập ngay
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Card>
    );
  }

  // ── A: Error (invalid / expired token) ─────────────────────────────────────

  if (pageState === "error") {
    return (
      <Card>
        <IconCircle color="red">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </IconCircle>
        <h1 className="text-xl font-bold text-white">Xác thực thất bại</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {verifyError ?? "Liên kết xác thực không hợp lệ hoặc đã hết hạn."}
        </p>

        {resendDone  && <ResendSuccess />}
        {resendError && <ResendError msg={resendError} />}

        <div className="flex flex-col gap-2 pt-2">
          <ResendButton
            loading={resendLoading}
            done={resendDone}
            onClick={handleResend}
          />
          <Link
            href="/login"
            className="block text-sm text-slate-400 hover:text-white transition-colors duration-200"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </Card>
    );
  }

  // ── B: Waiting — email received but no token yet ───────────────────────────

  return (
    <Card>
      <IconCircle color="green">
        <MailCheck className="h-8 w-8 text-[#86D232]" />
      </IconCircle>
      <h1 className="text-xl font-bold text-white">Xác thực email của bạn</h1>
      <p className="text-sm text-slate-400 leading-relaxed">
        Chúng tôi đã gửi email xác thực đến{" "}
        <span className="font-semibold text-white">{email}</span>.{" "}
        Vui lòng kiểm tra hộp thư và nhấn vào đường link để kích hoạt tài khoản.
      </p>

      {resendDone  && <ResendSuccess />}
      {resendError && <ResendError msg={resendError} />}

      <div className="flex flex-col gap-3 pt-2">
        <ResendButton
          loading={resendLoading}
          done={resendDone}
          onClick={handleResend}
        />
        <Link
          href="/login"
          className="block text-sm text-slate-400 hover:text-white transition-colors duration-200"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </Card>
  );
}

// ── Page export ────────────────────────────────────────────────────────────────
// Suspense is required because VerifyEmailContent calls useSearchParams().

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
