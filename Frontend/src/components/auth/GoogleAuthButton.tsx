"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { setAuthData } from "@/lib/auth";
import type { ApiWrapper, AuthApiData, User as AuthUser } from "@/types/auth";
import type { GoogleCredentialResponse } from "@/types/google-identity";

const GOOGLE_BUTTON_MIN_WIDTH = 220;
const GOOGLE_BUTTON_MAX_WIDTH = 400;

export type GoogleAuthMode = "signin" | "signup";

interface GoogleAuthButtonProps {
  /** "signin" renders Google's "Sign in with Google" button (Login page);
   * "signup" renders "Sign up with Google" (Register page). Both call the
   * same backend endpoint — the backend decides create-vs-login. */
  mode: GoogleAuthMode;
  /** Where to send the user after a successful Google login. Defaults to "/". */
  redirectTo?: string;
  /** Reported to the parent form so it can render the failure using its
   * existing error banner instead of alert(). */
  onError?: (message: string) => void;
}

type ScriptState = "loading" | "ready" | "error";

/** Shared Google Identity Services button used by both LoginForm and
 * RegisterForm. Renders Google's own account-chooser button (no custom
 * popup hacking) and forwards the resulting ID token to
 * POST /auth/google-login — the backend is the single source of truth for
 * whether that creates a new user or logs an existing one in. */
export function GoogleAuthButton({ mode, redirectTo, onError }: GoogleAuthButtonProps) {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  const initializedRef = useRef(false);

  // Kept in refs (not deps) so the Google callback registered once at
  // initialize() time always sees the latest prop values.
  const onErrorRef = useRef(onError);
  const redirectToRef = useRef(redirectTo);
  useEffect(() => {
    onErrorRef.current = onError;
    redirectToRef.current = redirectTo;
  }, [onError, redirectTo]);

  const [scriptState, setScriptState] = useState<ScriptState>("loading");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      setIsProcessing(true);

      try {
        const res = await apiFetch<ApiWrapper<AuthApiData>>("/auth/google-login", {
          method: "POST",
          body: JSON.stringify({ idToken: response.credential }),
        });

        if (!res.success || !res.data) {
          onErrorRef.current?.(res.message || "Đăng nhập Google thất bại. Vui lòng thử lại.");
          return;
        }

        const user: AuthUser = {
          id: res.data.userId,
          fullName: res.data.fullName,
          email: res.data.email,
          role: res.data.role,
          status: "ACTIVE",
          emailConfirmed: res.data.emailConfirmed,
          createdAt: new Date().toISOString(),
        };
        setAuthData(res.data.token, user);
        router.push(redirectToRef.current || "/");
      } catch (err) {
        if (err instanceof ApiError) {
          onErrorRef.current?.(err.message);
        } else {
          onErrorRef.current?.("Không thể kết nối máy chủ. Vui lòng thử lại.");
        }
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [router]
  );

  const renderGoogleButton = useCallback(() => {
    if (!clientId || !window.google || !buttonRef.current) return;

    if (!initializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: "popup",
      });
      initializedRef.current = true;
    }

    const measuredWidth = wrapperRef.current?.offsetWidth ?? GOOGLE_BUTTON_MAX_WIDTH;
    const width = Math.min(
      GOOGLE_BUTTON_MAX_WIDTH,
      Math.max(GOOGLE_BUTTON_MIN_WIDTH, measuredWidth)
    );

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: mode === "signin" ? "signin_with" : "signup_with",
      shape: "rectangular",
      logo_alignment: "left",
      width,
    });
  }, [clientId, handleCredentialResponse, mode]);

  useEffect(() => {
    if (scriptState !== "ready") return;
    renderGoogleButton();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(renderGoogleButton, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [scriptState, renderGoogleButton]);

  if (!clientId) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-400"
        aria-disabled="true"
        title="Google Sign-In chưa được cấu hình (thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID)"
      >
        Đăng nhập Google hiện không khả dụng
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client?hl=vi"
        strategy="afterInteractive"
        onReady={() => setScriptState("ready")}
        onError={() => {
          console.error("[GoogleAuthButton] Failed to load Google Identity Services script.");
          setScriptState("error");
        }}
      />

      {scriptState === "error" ? (
        <div
          className="flex w-full items-center justify-center rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-2.5 text-sm font-medium text-red-400"
          role="alert"
        >
          Không thể tải Google Sign-In. Vui lòng thử lại sau.
        </div>
      ) : (
        <div ref={wrapperRef} className="relative flex min-h-[40px] w-full items-center justify-center">
          <div
            ref={buttonRef}
            className={isProcessing ? "pointer-events-none opacity-40" : undefined}
          />

          {scriptState === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden />
            </div>
          )}

          {isProcessing && (
            <div
              className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-white/80"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin text-[#FF8000]" aria-hidden />
              <span className="text-sm font-medium text-gray-700">Đang xử lý...</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
