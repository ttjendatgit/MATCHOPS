"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail, Phone, User } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { setAuthData, isAuthenticated } from "@/lib/auth";
import type { ApiWrapper, AuthApiData, User as AuthUser } from "@/types/auth";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

// ─── Vertex + fragment shaders (unchanged) ────────────────────────────────────

const vertexSmokeySource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const fragmentSmokeySource = `
precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 u_color;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord / iResolution;
    vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    float time = iTime * 0.5;

    vec2 mouse = iMouse / iResolution;
    vec2 rippleCenter = 2.0 * mouse - 1.0;

    vec2 distortion = centeredUV;
    for (float i = 1.0; i < 8.0; i++) {
        distortion.x += 0.5 / i * cos(i * 2.0 * distortion.y + time + rippleCenter.x * 3.1415);
        distortion.y += 0.5 / i * cos(i * 2.0 * distortion.x + time + rippleCenter.y * 3.1415);
    }

    float wave = abs(sin(distortion.x + distortion.y + time));
    float glow = smoothstep(0.9, 0.2, wave);

    fragColor = vec4(u_color * glow, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

// ─── SmokeyBackground (unchanged) ────────────────────────────────────────────

type BlurSize = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

interface SmokeyBackgroundProps {
  backdropBlurAmount?: string;
  color?: string;
  className?: string;
}

const blurClassMap: Record<BlurSize, string> = {
  none: "backdrop-blur-none",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
  "2xl": "backdrop-blur-2xl",
  "3xl": "backdrop-blur-3xl",
};

export function SmokeyBackground({
  backdropBlurAmount = "sm",
  color = "#10B981",
  className = "",
}: SmokeyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;
    return [r, g, b];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSmokeySource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSmokeySource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const iMouseLocation = gl.getUniformLocation(program, "iMouse");
    const uColorLocation = gl.getUniformLocation(program, "u_color");

    let startTime = Date.now();
    const [r, g, b] = hexToRgb(color);
    gl.uniform3f(uColorLocation, r, g, b);

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);

      const currentTime = (Date.now() - startTime) / 1000;

      gl.uniform2f(iResolutionLocation, width, height);
      gl.uniform1f(iTimeLocation, currentTime);
      gl.uniform2f(iMouseLocation, isHovering ? mousePosition.x : width / 2, isHovering ? height - mousePosition.y : height / 2);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    };
    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    render();

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isHovering, mousePosition, color]);

  const finalBlurClass = blurClassMap[backdropBlurAmount as BlurSize] || blurClassMap["sm"];

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className={`absolute inset-0 ${finalBlurClass}`} />
    </div>
  );
}

// ─── Shared field styles ──────────────────────────────────────────────────────

const fieldInputClass =
  "block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-white/60 appearance-none focus:outline-none focus:ring-0 focus:border-[#FF8000] lf-input peer";

const fieldLabelClass =
  "absolute text-sm text-slate-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#FF8000] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6";

const submitBtnClass =
  "group w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-semibold bg-[#FF8000] hover:bg-[#FF8000]/85 shadow-[0_0_20px_rgba(255,128,0,0.35)] hover:shadow-[0_0_28px_rgba(255,128,0,0.55)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#030303] focus:ring-[#FF8000] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed";

// ─── LoginForm ────────────────────────────────────────────────────────────────

interface LoginFormProps {
  /** Set to true when navigating from a successful registration (?registered=1). */
  registered?: boolean;
  /** URL to redirect to after successful login (decoded). */
  redirect?: string;
}

export function LoginForm({ registered = false, redirect }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, skip straight to the redirect target (or home).
  useEffect(() => {
    if (isAuthenticated()) router.replace(redirect || "/");
  }, [router, redirect]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const emailTrimmed = email.trim();

    if (!emailTrimmed || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError("Địa chỉ email không hợp lệ.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch<ApiWrapper<AuthApiData>>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: emailTrimmed, password }),
      });
      if (!res.success || !res.data) {
        setError(res.message || "Đăng nhập thất bại. Vui lòng thử lại.");
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
      router.push(redirect || "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm p-8 space-y-6 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-[rgba(255,128,0,0.18)] shadow-2xl shadow-black/60">
      <div className="text-center">
        <h2 className="text-3xl font-black text-white">Chào mừng trở lại</h2>
        <p className="mt-2 text-sm text-slate-400">Đăng nhập để tiếp tục với MatchOps</p>
      </div>

      {/* Registration success banner */}
      {registered && (
        <div
          className="flex items-center gap-2 rounded-xl border border-[rgba(255,128,0,0.25)] bg-[rgba(255,128,0,0.08)] px-4 py-3 text-sm text-[#FF8000]"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Đăng ký thành công. Vui lòng đăng nhập.
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-400"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <form className="space-y-8" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="relative z-0">
          <input
            type="email"
            id="floating_email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldInputClass}
            placeholder=" "
            autoComplete="email"
            required
          />
          <label htmlFor="floating_email" className={fieldLabelClass}>
            <User className="inline-block mr-2 -mt-1" size={16} aria-hidden />
            Địa chỉ email
          </label>
        </div>

        {/* Password */}
        <div className="relative z-0">
          <input
            type="password"
            id="floating_password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldInputClass}
            placeholder=" "
            autoComplete="current-password"
            required
          />
          <label htmlFor="floating_password" className={fieldLabelClass}>
            <Lock className="inline-block mr-2 -mt-1" size={16} aria-hidden />
            Mật khẩu
          </label>
        </div>

        <div className="flex items-center justify-between">
          <a
            href="#"
            className="text-xs text-[#FF8000] hover:text-[#FF8000]/80 transition-colors duration-200"
          >
            Quên mật khẩu?
          </a>
        </div>

        {/* Submit */}
        <button type="submit" disabled={isSubmitting} className={submitBtnClass}>
          {isSubmitting ? (
            <>
              <span
                className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden
              />
              Đang xử lý...
            </>
          ) : (
            <>
              Đăng nhập
              <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" aria-hidden />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-600/50" />
          <span className="flex-shrink mx-4 text-slate-500 text-xs tracking-wider">
            HOẶC TIẾP TỤC VỚI
          </span>
          <div className="flex-grow border-t border-slate-600/50" />
        </div>

        {/* Google */}
        <GoogleAuthButton mode="signin" redirectTo={redirect} onError={setError} />
      </form>

      <p className="text-center text-xs text-slate-400">
        Chưa có tài khoản?{" "}
        <a
          href="/register"
          className="font-semibold text-[#FF8000] hover:text-[#FF8000]/80 transition-colors duration-200"
        >
          Đăng ký
        </a>
      </p>
    </div>
  );
}

// ─── RegisterForm ─────────────────────────────────────────────────────────────

export function RegisterForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, skip straight to home.
  useEffect(() => {
    if (isAuthenticated()) router.replace("/");
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const nameTrimmed = fullName.trim();
    const emailTrimmed = email.trim();

    if (nameTrimmed.length < 2) {
      setError("Vui lòng nhập họ tên (tối thiểu 2 ký tự).");
      return;
    }
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError("Địa chỉ email không hợp lệ.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Mật khẩu phải có ít nhất 1 chữ hoa.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Mật khẩu phải có ít nhất 1 chữ thường.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Mật khẩu phải có ít nhất 1 chữ số.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch<ApiWrapper<null>>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: nameTrimmed,
          email: emailTrimmed,
          password,
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });
      router.push(`/verify-email?email=${encodeURIComponent(emailTrimmed)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        router.push(
          `/verify-email?email=${encodeURIComponent(emailTrimmed)}&emailFailed=1`,
        );
        return;
      }
      setError(err instanceof Error ? err.message : "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm p-8 space-y-6 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-[rgba(255,128,0,0.18)] shadow-2xl shadow-black/60">
      <div className="text-center">
        <h2 className="text-3xl font-black text-white">Tạo tài khoản</h2>
        <p className="mt-2 text-sm text-slate-400">
          Bắt đầu hành trình thể thao cùng MatchOps
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-400"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {/* Full name */}
        <div className="relative z-0">
          <input
            type="text"
            id="reg_fullname"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={fieldInputClass}
            placeholder=" "
            autoComplete="name"
            required
          />
          <label htmlFor="reg_fullname" className={fieldLabelClass}>
            <User className="inline-block mr-2 -mt-1" size={16} aria-hidden />
            Họ và tên
          </label>
        </div>

        {/* Email */}
        <div className="relative z-0">
          <input
            type="email"
            id="reg_email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldInputClass}
            placeholder=" "
            autoComplete="email"
            required
          />
          <label htmlFor="reg_email" className={fieldLabelClass}>
            <Mail className="inline-block mr-2 -mt-1" size={16} aria-hidden />
            Địa chỉ email
          </label>
        </div>

        {/* Phone (optional) */}
        <div className="relative z-0">
          <input
            type="tel"
            id="reg_phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldInputClass}
            placeholder=" "
            autoComplete="tel"
          />
          <label htmlFor="reg_phone" className={fieldLabelClass}>
            <Phone className="inline-block mr-2 -mt-1" size={16} aria-hidden />
            Số điện thoại
          </label>
        </div>

        {/* Password */}
        <div className="relative z-0">
          <input
            type="password"
            id="reg_password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldInputClass}
            placeholder=" "
            autoComplete="new-password"
            required
          />
          <label htmlFor="reg_password" className={fieldLabelClass}>
            <Lock className="inline-block mr-2 -mt-1" size={16} aria-hidden />
            Mật khẩu
          </label>
          <p className="mt-2 text-xs text-slate-500">
            Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.
          </p>
        </div>

        {/* Submit */}
        <button type="submit" disabled={isSubmitting} className={submitBtnClass}>
          {isSubmitting ? (
            <>
              <span
                className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden
              />
              Đang xử lý...
            </>
          ) : (
            <>
              Tạo tài khoản
              <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" aria-hidden />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-600/50" />
          <span className="flex-shrink mx-4 text-slate-500 text-xs tracking-wider">
            HOẶC TIẾP TỤC VỚI
          </span>
          <div className="flex-grow border-t border-slate-600/50" />
        </div>

        {/* Google */}
        <GoogleAuthButton mode="signup" onError={setError} />
      </form>

      <p className="text-center text-xs text-slate-500">
        Bằng cách đăng ký, bạn đồng ý với{" "}
        <a href="#" className="text-[#FF8000] hover:text-[#FF8000]/80 transition-colors duration-200">
          Điều khoản dịch vụ
        </a>
      </p>

      <p className="text-center text-xs text-slate-400">
        Đã có tài khoản?{" "}
        <a
          href="/login"
          className="font-semibold text-[#FF8000] hover:text-[#FF8000]/80 transition-colors duration-200"
        >
          Đăng nhập
        </a>
      </p>
    </div>
  );
}
