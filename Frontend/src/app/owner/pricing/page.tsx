"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  DollarSign,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { formatCurrency } from "@/lib/utils";

// ── DTOs ──────────────────────────────────────────────────────────────────────

interface CourtDto {
  id: string;
  name: string;
  sportName: string;
  status: string;
}

interface PriceRuleDto {
  id: string;
  courtId: string;
  courtName: string;
  dayType: string;   // "ALL" | "WEEKDAY" | "WEEKEND"
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
  pricePerHour: number;
  status: string;    // "ACTIVE" | "INACTIVE"
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Sent as integer because backend has no JsonStringEnumConverter configured.
const DAY_TYPE_INT = { ALL: 1, WEEKDAY: 2, WEEKEND: 3 } as const;

// PriceRuleStatus integers
const STATUS_ACTIVE   = 1;
const STATUS_INACTIVE = 2;

const DAY_TYPE_LABEL: Record<string, string> = {
  ALL:     "Tất cả ngày",
  WEEKDAY: "Ngày thường (T2–T6)",
  WEEKEND: "Cuối tuần (T7, CN)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "HH:mm:ss" → "HH:mm" for display */
function hhmm(t: string): string {
  return t?.slice(0, 5) ?? "—";
}

/** "HH:mm" (from <input type="time">) → "HH:mm:00" for TimeOnly deserialization */
function toApiTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OwnerPricingPage() {
  const searchParams = useSearchParams();
  const [courts,     setCourts]     = useState<CourtDto[]>([]);
  const [rulesMap,   setRulesMap]   = useState<Map<string, PriceRuleDto[]>>(new Map());
  const [loading,    setLoading]    = useState(true);
  const [pageError,  setPageError]  = useState<string | null>(null);

  // Create form
  const [showForm,      setShowForm]      = useState(false);
  const [fCourtId,      setFCourtId]      = useState("");
  const [fDayType,      setFDayType]      = useState<"ALL" | "WEEKDAY" | "WEEKEND">("ALL");
  const [fStartTime,    setFStartTime]    = useState("06:00");
  const [fEndTime,      setFEndTime]      = useState("22:00");
  const [fPrice,        setFPrice]        = useState("");
  const [formError,     setFormError]     = useState<string | null>(null);
  const [formSaving,    setFormSaving]    = useState(false);

  // Per-row toggle loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setPageError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError(null);

    try {
      const courtsRes = await apiFetch<ApiResponse<CourtDto[]>>("/owner/courts", { token });
      const loaded = courtsRes.data ?? [];
      setCourts(loaded);

      // Fetch price rules for every court in parallel; swallow per-court errors
      const map = new Map<string, PriceRuleDto[]>();
      await Promise.all(
        loaded.map(async (c) => {
          try {
            const res = await apiFetch<ApiResponse<PriceRuleDto[]>>(
              `/owner/courts/${c.id}/price-rules`,
              { token },
            );
            map.set(c.id, res.data ?? []);
          } catch {
            map.set(c.id, []);
          }
        }),
      );
      setRulesMap(map);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Không thể tải dữ liệu bảng giá.",
      );
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  // Pre-select first court when courts arrive
  useEffect(() => {
    if (courts.length > 0 && !fCourtId) setFCourtId(courts[0].id);
  }, [courts, fCourtId]);

  useEffect(() => {
    const requestedCourtId = searchParams.get("courtId");
    if (!requestedCourtId || courts.length === 0) return;

    const matchedCourt = courts.find((court) => court.id === requestedCourtId);
    if (!matchedCourt) return;

    setFCourtId(matchedCourt.id);
    setShowForm(true);
    setFormError(null);
  }, [courts, searchParams]);

  // ── Create handler ──────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!fCourtId)                         { setFormError("Vui lòng chọn sân."); return; }
    if (!fStartTime)                       { setFormError("Vui lòng nhập giờ bắt đầu."); return; }
    if (!fEndTime)                         { setFormError("Vui lòng nhập giờ kết thúc."); return; }
    if (fStartTime >= fEndTime)            { setFormError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc."); return; }
    const price = Number(fPrice);
    if (!fPrice || isNaN(price) || price <= 0) { setFormError("Giá theo giờ phải lớn hơn 0."); return; }

    const token = getStoredToken();
    if (!token) return;

    setFormSaving(true);
    try {
      await apiFetch<ApiResponse<PriceRuleDto>>("/owner/price-rules", {
        method: "POST",
        token,
        body: JSON.stringify({
          courtId:      fCourtId,
          dayType:      DAY_TYPE_INT[fDayType],   // integer required
          startTime:    toApiTime(fStartTime),     // "HH:mm:00"
          endTime:      toApiTime(fEndTime),       // "HH:mm:00"
          pricePerHour: price,
        }),
      });

      // Reset form fields (keep courtId and dayType for convenience)
      setFPrice("");
      setFStartTime("06:00");
      setFEndTime("22:00");
      setShowForm(false);
      toast.success("Tạo quy tắc giá thành công!");
      await loadData();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Không thể tạo quy tắc giá.",
      );
    } finally {
      setFormSaving(false);
    }
  }

  // ── Toggle status ───────────────────────────────────────────────────────────

  async function handleToggle(rule: PriceRuleDto) {
    if (togglingId) return;
    const token = getStoredToken();
    if (!token) return;

    setTogglingId(rule.id);
    const newStatus = rule.status === "ACTIVE" ? STATUS_INACTIVE : STATUS_ACTIVE;
    try {
      await apiFetch<ApiResponse<PriceRuleDto>>(
        `/owner/price-rules/${rule.id}/status`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({ status: newStatus }), // integer required
        },
      );
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật trạng thái.");
    } finally {
      setTogglingId(null);
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const totalRules = Array.from(rulesMap.values()).reduce((s, r) => s + r.length, 0);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
        <p className="text-sm text-[#C4C7C9]/60">Đang tải bảng giá...</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────

  if (pageError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-red-500/20 bg-red-950/20 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-400">{pageError}</p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/50"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight">Bảng giá</h1>
          <p className="mt-1 text-sm text-[#C4C7C9]">
            Thiết lập giá theo khung giờ và loại ngày cho từng sân.
          </p>
        </div>
        {courts.length > 0 && (
          <button
            type="button"
            onClick={() => { setShowForm((v) => !v); setFormError(null); }}
            className="flex items-center gap-2 rounded-lg bg-[#FF8000] px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(255,128,0,0.4)] hover:bg-[#FF8000]/90 hover:shadow-[0_0_28px_rgba(255,128,0,0.6)] transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Đóng form" : "Thêm quy tắc giá"}
          </button>
        )}
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <div className="rounded-xl border border-[rgba(255,128,0,0.28)] bg-[#0A0A0A] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[rgba(255,128,0,0.15)] px-5 py-4">
            <DollarSign className="h-4 w-4 text-[#FF8000]" />
            <h2 className="text-sm font-bold text-white">Tạo quy tắc giá mới</h2>
          </div>
          <form onSubmit={handleCreate} noValidate className="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {/* Court */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#C4C7C9]/60">
                  Sân <span className="text-[#FF8000]">*</span>
                </label>
                <select
                  value={fCourtId}
                  onChange={(e) => setFCourtId(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#141414] px-3 py-2.5 text-sm text-white focus:border-[#FF8000] focus:outline-none"
                >
                  <option value="" disabled>Chọn sân...</option>
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.sportName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#C4C7C9]/60">
                  Loại ngày <span className="text-[#FF8000]">*</span>
                </label>
                <select
                  value={fDayType}
                  onChange={(e) => setFDayType(e.target.value as typeof fDayType)}
                  className="w-full rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#141414] px-3 py-2.5 text-sm text-white focus:border-[#FF8000] focus:outline-none"
                >
                  <option value="ALL">Tất cả ngày</option>
                  <option value="WEEKDAY">Ngày thường (T2–T6)</option>
                  <option value="WEEKEND">Cuối tuần (T7, CN)</option>
                </select>
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#C4C7C9]/60">
                  Giá / giờ (VNĐ) <span className="text-[#FF8000]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000000"
                  value={fPrice}
                  onChange={(e) => setFPrice(e.target.value)}
                  placeholder="VD: 80000"
                  className="w-full rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#141414] px-3 py-2.5 text-sm text-white placeholder:text-[#C4C7C9]/20 focus:border-[#FF8000] focus:outline-none"
                />
              </div>

              {/* Start time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#C4C7C9]/60">
                  Giờ bắt đầu <span className="text-[#FF8000]">*</span>
                </label>
                <input
                  type="time"
                  value={fStartTime}
                  onChange={(e) => setFStartTime(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#141414] px-3 py-2.5 text-sm text-white [color-scheme:dark] focus:border-[#FF8000] focus:outline-none"
                />
              </div>

              {/* End time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#C4C7C9]/60">
                  Giờ kết thúc <span className="text-[#FF8000]">*</span>
                </label>
                <input
                  type="time"
                  value={fEndTime}
                  onChange={(e) => setFEndTime(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#141414] px-3 py-2.5 text-sm text-white [color-scheme:dark] focus:border-[#FF8000] focus:outline-none"
                />
              </div>
            </div>

            {/* Form validation error */}
            {formError && (
              <div
                className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-400"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                {formError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={formSaving}
                className="flex items-center gap-2 rounded-lg bg-[#FF8000] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#FF8000]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formSaving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" aria-hidden />
                    Tạo quy tắc giá
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="rounded-lg border border-[rgba(134,210,50,0.2)] px-5 py-2.5 text-sm font-medium text-[#C4C7C9] hover:bg-[#141414] transition-all duration-200"
              >
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── No courts empty state ── */}
      {courts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] py-16 text-center">
          <Building2 className="mb-4 h-10 w-10 text-[#C4C7C9]/15" />
          <h3 className="text-base font-bold text-white">Chưa có sân nào</h3>
          <p className="mt-1 max-w-xs text-sm text-[#C4C7C9]/50">
            Tạo sân trong mục <span className="text-[#FF8000]">Cụm sân</span> trước khi thiết lập bảng giá.
          </p>
        </div>
      )}

      {/* ── Price rules grouped by court ── */}
      {courts.map((court) => {
        const rules = rulesMap.get(court.id) ?? [];
        const isSelectedForCreate = fCourtId === court.id;
        return (
          <div
            key={court.id}
            className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden"
          >
            {/* Court header */}
            <div className="flex items-center justify-between border-b border-[rgba(134,210,50,0.15)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(134,210,50,0.1)]">
                  <Clock className="h-4 w-4 text-[#86D232]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{court.name}</p>
                  <p className="text-[10px] text-[#C4C7C9]/50">
                    {court.sportName} · {rules.length} quy tắc
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFCourtId(court.id);
                  setShowForm(true);
                  setFormError(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isSelectedForCreate
                    ? "bg-[rgba(255,128,0,0.14)] text-[#FF8000]"
                    : "border border-[rgba(134,210,50,0.18)] text-[#C4C7C9] hover:bg-[#141414]"
                }`}
              >
                {isSelectedForCreate ? "Đang chọn tạo giá" : "Thêm giá"}
              </button>
            </div>

            {/* Empty per-court */}
            {rules.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                <DollarSign className="h-7 w-7 text-[#C4C7C9]/15" />
                <p className="text-xs text-[#C4C7C9]/40">
                  Sân này chưa có quy tắc giá nào.
                </p>
              </div>
            ) : (
              /* Rules table */
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(134,210,50,0.1)] bg-[#141414]">
                      {["Loại ngày", "Khung giờ", "Giá / giờ", "Trạng thái", "Thao tác"].map((h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40 ${
                            i <= 1 ? "text-left" : i === 2 ? "text-right" : "text-center"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(134,210,50,0.06)]">
                    {rules.map((rule) => {
                      const isToggling = togglingId === rule.id;
                      const isActive   = rule.status === "ACTIVE";

                      return (
                        <tr key={rule.id} className="transition-colors hover:bg-[#141414]">

                          {/* Day type badge */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                                rule.dayType === "ALL"
                                  ? "bg-[rgba(96,165,250,0.1)]  text-blue-400"
                                  : rule.dayType === "WEEKEND"
                                  ? "bg-[rgba(251,191,36,0.1)]  text-amber-400"
                                  : "bg-[rgba(134,210,50,0.1)]  text-[#86D232]"
                              }`}
                            >
                              {DAY_TYPE_LABEL[rule.dayType] ?? rule.dayType}
                            </span>
                          </td>

                          {/* Time range */}
                          <td className="px-5 py-3.5 font-mono text-xs text-[#C4C7C9]">
                            {hhmm(rule.startTime)} – {hhmm(rule.endTime)}
                          </td>

                          {/* Price */}
                          <td className="px-5 py-3.5 text-right font-bold tabular-nums text-[#FF8000]">
                            {formatCurrency(rule.pricePerHour)}
                          </td>

                          {/* Status pill */}
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                isActive
                                  ? "bg-[rgba(134,210,50,0.1)] text-[#86D232]"
                                  : "bg-[rgba(200,200,200,0.07)] text-[#C4C7C9]/50"
                              }`}
                            >
                              {isActive ? (
                                <><CheckCircle2 className="h-3 w-3" aria-hidden /> Hoạt động</>
                              ) : (
                                <><XCircle className="h-3 w-3" aria-hidden /> Tạm dừng</>
                              )}
                            </span>
                          </td>

                          {/* Toggle button */}
                          <td className="px-5 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggle(rule)}
                              disabled={!!togglingId}
                              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                                isActive
                                  ? "border border-[rgba(200,200,200,0.12)] text-[#C4C7C9]/70 hover:border-red-500/30 hover:text-red-400 hover:bg-[rgba(239,68,68,0.05)]"
                                  : "border border-[rgba(134,210,50,0.2)] text-[#86D232] hover:bg-[rgba(134,210,50,0.06)]"
                              }`}
                            >
                              {isToggling ? (
                                <span
                                  className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current"
                                  aria-hidden
                                />
                              ) : isActive ? (
                                "Tạm dừng"
                              ) : (
                                "Kích hoạt"
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      {totalRules > 0 && (
        <p className="text-right text-xs text-[#C4C7C9]/30">
          {totalRules} quy tắc giá · {courts.length} sân
        </p>
      )}
    </div>
  );
}
