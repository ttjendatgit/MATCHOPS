"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  Award,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Dumbbell,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  User,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, apiUpload, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type {
  CoachApplyRequest,
  CoachPortfolioImageResponse,
  CoachProfileMeResponse,
  CoachProfileStatus,
  CoachProofResponse,
  CoachProofType,
  CoachUpdateMyProfileRequest,
  CoachVerificationDocumentResponse,
  CoachVerificationDocumentType,
} from "@/types/coach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MAX_PROOFS = 5;
const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROOF_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const PROOF_TYPE_LABELS: Record<CoachProofType, string> = {
  CERTIFICATION: "Chứng chỉ",
  ACHIEVEMENT: "Thành tích",
  TRAINING_CREDENTIAL: "Kinh nghiệm huấn luyện",
  OTHER: "Khác",
};

function proofTypeLabel(proofType: string): string {
  return PROOF_TYPE_LABELS[proofType as CoachProofType] ?? proofType;
}

// ─── Verification documents (formal admin review materials) ────────────────

const MAX_VERIFICATION_DOCUMENTS = 5;
const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const VERIFICATION_DOCUMENT_TYPE_LABELS: Record<CoachVerificationDocumentType, string> = {
  COACHING_CERTIFICATE: "Chứng chỉ huấn luyện",
  TRAINING_CERTIFICATE: "Chứng chỉ đào tạo",
  SPORT_ACHIEVEMENT: "Thành tích thi đấu",
  CLUB_CONFIRMATION: "Xác nhận câu lạc bộ/trung tâm",
  OTHER: "Khác",
};

function verificationDocumentTypeLabel(documentType: string): string {
  return (
    VERIFICATION_DOCUMENT_TYPE_LABELS[documentType as CoachVerificationDocumentType] ??
    documentType
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Public portfolio images (coach-curated public gallery) ────────────────

const MAX_PORTFOLIO_IMAGES = 8;
const MAX_PORTFOLIO_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PORTFOLIO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Sport {
  id: string;
  name: string;
}

type PageMode = "loading" | "apply" | "profile" | "error";

// ─── Trust points (honest, no fake numbers) ─────────────────────────────────

const TRUST_POINTS: { icon: typeof ShieldCheck; text: string }[] = [
  { icon: ShieldCheck, text: "Hồ sơ được xét duyệt" },
  { icon: Users, text: "Kết nối với người chơi đang tìm huấn luyện viên" },
  { icon: Settings2, text: "Quản lý hồ sơ trong cùng tài khoản MatchOps" },
  { icon: CalendarClock, text: "Tính năng đặt lịch sẽ được mở ở giai đoạn sau" },
];

// ─── Status metadata ────────────────────────────────────────────────────────

const STATUS_META: Record<
  CoachProfileStatus,
  { label: string; icon: typeof Clock; badgeVariant: "warning" | "success" | "destructive" | "muted"; description: string }
> = {
  PENDING_APPROVAL: {
    label: "Đang chờ duyệt",
    icon: Clock,
    badgeVariant: "warning",
    description:
      "Hồ sơ của bạn đang chờ đội ngũ MatchOps xét duyệt. Hồ sơ sẽ chỉ xuất hiện công khai trên trang Huấn luyện viên sau khi được duyệt.",
  },
  ACTIVE: {
    label: "Đã được duyệt",
    icon: CheckCircle2,
    badgeVariant: "success",
    description:
      "Hồ sơ của bạn đã được duyệt và đang hiển thị công khai trên trang Huấn luyện viên. Bạn vẫn có thể cập nhật thông tin bất cứ lúc nào.",
  },
  REJECTED: {
    label: "Bị từ chối",
    icon: XCircle,
    badgeVariant: "destructive",
    description:
      "Hồ sơ của bạn đã bị từ chối. Bạn có thể cập nhật lại thông tin bên dưới — hồ sơ sẽ được gửi về trạng thái chờ duyệt sau khi cập nhật.",
  },
  SUSPENDED: {
    label: "Tạm khóa",
    icon: Lock,
    badgeVariant: "destructive",
    description:
      "Hồ sơ huấn luyện viên của bạn đang bị tạm khóa và không thể chỉnh sửa. Vui lòng liên hệ đội ngũ hỗ trợ MatchOps để biết thêm chi tiết.",
  },
};

// ─── Post-submit success dialog ─────────────────────────────────────────────

const PENDING_NEXT_STEPS = [
  "Theo dõi trạng thái hồ sơ tại trang đăng ký huấn luyện viên",
  "Bạn có thể bổ sung thành tích hoặc ảnh minh chứng nếu cần",
  "Khi được duyệt, hồ sơ sẽ xuất hiện trong danh sách huấn luyện viên",
];

const ACTIVE_NEXT_STEPS = [
  "Theo dõi trạng thái hồ sơ tại trang đăng ký huấn luyện viên",
  "Bạn có thể bổ sung thành tích hoặc ảnh minh chứng nếu cần",
  "Hồ sơ của bạn vẫn đang hiển thị công khai trong danh sách huấn luyện viên",
];

function ApplySuccessDialog({
  status,
  meta,
  onOpenChange,
}: {
  status: CoachProfileStatus | null;
  meta: { hasQueuedFiles: boolean; failedGroups: string[] } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const isActive = status === "ACTIVE";
  const hasUploadFailures = (meta?.failedGroups.length ?? 0) > 0;
  const filesIncluded = !!meta?.hasQueuedFiles && !hasUploadFailures;

  return (
    <Dialog open={status !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center sm:text-center">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full border border-[#86D232]/30 bg-[#86D232]/10 shadow-[0_0_24px_rgba(134,210,50,0.25)]">
            <CheckCircle2 className="h-7 w-7 text-[#86D232]" aria-hidden />
          </div>
          <DialogTitle className="text-center text-xl">
            {isActive
              ? "Hồ sơ huấn luyện viên đã được cập nhật"
              : filesIncluded
              ? "Hồ sơ và tệp đính kèm đã được gửi"
              : "Hồ sơ huấn luyện viên đã được gửi"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isActive
              ? "MatchOps đã cập nhật hồ sơ của bạn. Hồ sơ vẫn đang hiển thị công khai trên trang Huấn luyện viên."
              : "MatchOps đã nhận hồ sơ của bạn. Hồ sơ sẽ được admin xét duyệt trước khi hiển thị công khai."}
          </DialogDescription>
        </DialogHeader>

        {hasUploadFailures && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-left text-sm text-amber-300"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Hồ sơ đã được gửi, nhưng một số tệp chưa tải lên thành công (
              {meta!.failedGroups.join(", ")}). Bạn có thể thử tải lại trong trang này.
            </span>
          </div>
        )}

        <ul className="space-y-2.5 rounded-xl border border-white/[0.06] bg-slate-950/50 p-4 text-left">
          {(isActive ? ACTIVE_NEXT_STEPS : PENDING_NEXT_STEPS).map((step) => (
            <li key={step} className="flex items-start gap-2 text-sm leading-snug text-slate-300">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#86D232]" aria-hidden />
              {step}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 pt-1">
          <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
            Xem hồ sơ của tôi
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              router.push("/coach");
            }}
          >
            Về danh sách huấn luyện viên
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sport chip (keyboard-accessible multi-select) ─────────────────────────

function SportToggle({
  sport,
  selected,
  onToggle,
}: {
  sport: Sport;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold",
        "whitespace-nowrap transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        selected
          ? "bg-[#FF8000] text-white shadow-[0_0_18px_rgba(255,128,0,0.45)]"
          : "border border-white/[0.1] bg-slate-800/70 text-slate-400 hover:border-[#FF8000]/25 hover:bg-slate-800 hover:text-slate-200",
      )}
    >
      {selected ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Dumbbell className="h-3.5 w-3.5" aria-hidden />
      )}
      {sport.name}
    </button>
  );
}

// ─── Proof gallery (existing, server-confirmed proofs) ──────────────────────

function ProofGallery({
  proofs,
  readOnly,
  deletingProofId,
  onDelete,
}: {
  proofs: CoachProofResponse[];
  readOnly: boolean;
  deletingProofId: string | null;
  onDelete: (proofId: string) => void;
}) {
  if (proofs.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {proofs.map((proof) => {
        const label = proofTypeLabel(proof.proofType);
        return (
          <div
            key={proof.id}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-950"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proof.imageUrl}
              alt={`Ảnh minh chứng loại ${label}`}
              className="h-28 w-full object-cover"
            />
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 backdrop-blur-sm">
              {label}
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => onDelete(proof.id)}
                disabled={deletingProofId === proof.id}
                aria-label={`Xoá ảnh minh chứng loại ${label}`}
                className={cn(
                  "absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full",
                  "bg-slate-950/80 text-slate-300 backdrop-blur-sm transition-colors",
                  "hover:bg-red-500/80 hover:text-white",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {deletingProofId === proof.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <X className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Verification document list (formal, admin-reviewed documents) ─────────

function VerificationDocumentGallery({
  documents,
  deletingDocumentId,
  onDelete,
}: {
  documents: CoachVerificationDocumentResponse[];
  deletingDocumentId: string | null;
  onDelete: (documentId: string) => void;
}) {
  if (documents.length === 0) return null;

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const isImage = doc.contentType.startsWith("image/");
        const label = verificationDocumentTypeLabel(doc.documentType);
        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 p-3"
          >
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.fileUrl}
                alt={`Tài liệu xác minh: ${doc.originalFileName}`}
                className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-900">
                <FileText className="h-5 w-5 text-[#FF8000]" aria-hidden />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{doc.originalFileName}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
                <span>{label}</span>
                <span aria-hidden>·</span>
                <span>{formatFileSize(doc.fileSizeBytes)}</span>
                <span aria-hidden>·</span>
                <span>{new Date(doc.createdAt).toLocaleDateString("vi-VN")}</span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Mở tài liệu ${doc.originalFileName}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/60"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
              <button
                type="button"
                onClick={() => onDelete(doc.id)}
                disabled={deletingDocumentId === doc.id}
                aria-label={`Xoá tài liệu ${doc.originalFileName}`}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors",
                  "hover:bg-red-500/20 hover:text-red-400",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {deletingDocumentId === doc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Public portfolio gallery (coach-curated, shown on the public profile) ──
// Deliberately green-accented (vs. the orange admin-review sections above)
// so it reads as "this goes public" at a glance.

function PortfolioImageGallery({
  images,
  deletingImageId,
  onDelete,
}: {
  images: CoachPortfolioImageResponse[];
  deletingImageId: string | null;
  onDelete: (imageId: string) => void;
}) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((image) => (
        <div
          key={image.id}
          className="group relative overflow-hidden rounded-xl border border-[#86D232]/25 bg-slate-950"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.imageUrl}
            alt={image.caption ? `Ảnh portfolio: ${image.caption}` : "Ảnh portfolio công khai"}
            className="h-28 w-full object-cover"
          />
          {image.isCover && (
            <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-[#86D232] px-2 py-0.5 text-[10px] font-bold text-[#0A0A0A]">
              <Star className="h-2.5 w-2.5" aria-hidden fill="currentColor" />
              Ảnh bìa
            </span>
          )}
          {image.caption && (
            <span className="absolute bottom-1.5 left-1.5 right-8 truncate rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 backdrop-blur-sm">
              {image.caption}
            </span>
          )}
          <button
            type="button"
            onClick={() => onDelete(image.id)}
            disabled={deletingImageId === image.id}
            aria-label={`Xoá ảnh portfolio${image.caption ? `: ${image.caption}` : ""}`}
            className={cn(
              "absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full",
              "bg-slate-950/80 text-slate-300 backdrop-blur-sm transition-colors",
              "hover:bg-red-500/80 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {deletingImageId === image.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <X className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Left media / trust panel ────────────────────────────────────────────────

function CoachMediaPanel() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-[#FF8000]/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -right-8 h-56 w-56 rounded-full bg-[#86D232]/15 blur-3xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        {/* Image */}
        <div className="relative aspect-[4/5] w-full">
          <Image
            src="/images/coach/coach-apply-hero.png"
            alt="Hai người chơi bắt tay nhau trên sân MatchOps"
            fill
            priority
            sizes="(min-width: 1024px) 440px, 100vw"
            className="object-cover object-center"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-transparent"
            aria-hidden
          />

          {/* Overlay text */}
          <div className="absolute inset-x-0 bottom-0 p-6">
            <h2 className="text-xl font-black leading-tight text-white sm:text-2xl">
              Gia nhập mạng lưới{" "}
              <span className="bg-gradient-to-r from-[#FF8000] to-[#86D232] bg-clip-text text-transparent">
                huấn luyện viên
              </span>{" "}
              MatchOps
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Hồ sơ được xét duyệt trước khi hiển thị công khai.
            </p>
          </div>
        </div>

        {/* Trust points */}
        <div className="space-y-3.5 border-t border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6">
          {TRUST_POINTS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#86D232]/30 bg-[#86D232]/10">
                <Icon className="h-3.5 w-3.5 text-[#86D232]" aria-hidden />
              </span>
              <span className="pt-0.5 text-sm leading-snug text-slate-300">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachApplyPage() {
  const router = useRouter();

  const [mode, setMode] = useState<PageMode>("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CoachProfileMeResponse | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [achievements, setAchievements] = useState("");
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<"applying" | "uploading" | null>(null);
  const [successStatus, setSuccessStatus] = useState<CoachProfileStatus | null>(null);
  const [successMeta, setSuccessMeta] = useState<{
    hasQueuedFiles: boolean;
    failedGroups: string[];
  } | null>(null);

  // Proofs — existing (server-confirmed) vs. selected-but-not-yet-uploaded.
  const [proofs, setProofs] = useState<CoachProofResponse[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const [selectedProofType, setSelectedProofType] = useState<CoachProofType>("CERTIFICATION");
  const [proofError, setProofError] = useState<string | null>(null);
  const [uploadingProofs, setUploadingProofs] = useState(false);
  const [deletingProofId, setDeletingProofId] = useState<string | null>(null);

  // Verification documents — same existing/selected-but-not-yet-uploaded split as proofs.
  const [verificationDocuments, setVerificationDocuments] = useState<CoachVerificationDocumentResponse[]>([]);
  const [selectedDocFiles, setSelectedDocFiles] = useState<File[]>([]);
  const [selectedDocPreviews, setSelectedDocPreviews] = useState<string[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<CoachVerificationDocumentType>("COACHING_CERTIFICATE");
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  // Public portfolio images — same existing/selected-but-not-yet-uploaded split.
  const [portfolioImages, setPortfolioImages] = useState<CoachPortfolioImageResponse[]>([]);
  const [selectedPortfolioFiles, setSelectedPortfolioFiles] = useState<File[]>([]);
  const [selectedPortfolioPreviews, setSelectedPortfolioPreviews] = useState<string[]>([]);
  const [portfolioCaption, setPortfolioCaption] = useState("");
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [deletingPortfolioImageId, setDeletingPortfolioImageId] = useState<string | null>(null);

  // Populate the form whenever a real profile is loaded (initial load or
  // after a successful apply/update refetch).
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setBio(profile.bio ?? "");
    setExperienceYears(profile.experienceYears !== null ? String(profile.experienceYears) : "");
    setHourlyRate(profile.hourlyRate !== null ? String(profile.hourlyRate) : "");
    setCity(profile.city);
    setDistrict(profile.district);
    setAchievements(profile.achievements ?? "");
    setSelectedSportIds(profile.sports.map((s) => s.sportId));
    setProofs(profile.proofs ?? []);
    setVerificationDocuments(profile.verificationDocuments ?? []);
    setPortfolioImages(profile.portfolioImages ?? []);
  }, [profile]);

  // Object-URL previews for files chosen but not yet uploaded — created
  // whenever the selection changes, revoked on the next change/unmount so
  // we never leak blob URLs.
  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setSelectedPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  // Same object-URL preview pattern for verification documents — only
  // images get a preview URL; PDFs render a file icon instead (see gallery).
  useEffect(() => {
    const urls = selectedDocFiles.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : ""
    );
    setSelectedDocPreviews(urls);
    return () => {
      urls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [selectedDocFiles]);

  // Object-URL previews for selected-but-not-yet-uploaded portfolio images —
  // always images, so unlike the documents effect above every file gets one.
  useEffect(() => {
    const urls = selectedPortfolioFiles.map((file) => URL.createObjectURL(file));
    setSelectedPortfolioPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedPortfolioFiles]);

  const fetchMe = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setPageError(null);
    try {
      const res = await apiFetch<ApiResponse<CoachProfileMeResponse>>("/coaches/me", { token });
      if (res.success && res.data) {
        setProfile(res.data);
        setMode("profile");
      } else {
        setPageError(res.message || "Không thể tải hồ sơ huấn luyện viên.");
        setMode("error");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setProfile(null);
        setMode("apply");
        return;
      }
      const message =
        err instanceof Error ? err.message : "Không thể tải hồ sơ huấn luyện viên.";
      setPageError(message);
      setMode("error");
    }
  }, []);

  const fetchSports = useCallback(async () => {
    try {
      const res = await apiFetch<ApiResponse<Sport[]>>("/sports");
      if (res.success && res.data) setSports(res.data);
    } catch {
      // Sport selection just stays empty — surfaced via the "no sports" note below.
    }
  }, []);

  // Auth guard — this route requires login, following the same
  // getStoredToken() + redirect(`/login?redirect=...`) pattern as /profile.
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login?redirect=/coach/apply");
      return;
    }
    setMode("loading");
    fetchMe();
    fetchSports();
  }, [router, fetchMe, fetchSports]);

  const toggleSport = (sportId: string) => {
    setSelectedSportIds((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]
    );
  };

  function validateForm(): string | null {
    if (!city.trim()) return "Vui lòng nhập tỉnh/thành phố.";
    if (city.trim().length > 100) return "Tỉnh/thành phố không được vượt quá 100 ký tự.";
    if (!district.trim()) return "Vui lòng nhập quận/huyện.";
    if (district.trim().length > 100) return "Quận/huyện không được vượt quá 100 ký tự.";
    if (displayName.trim().length > 200) return "Tên hiển thị không được vượt quá 200 ký tự.";
    if (bio.trim().length > 2000) return "Giới thiệu không được vượt quá 2000 ký tự.";
    if (achievements.trim().length > 2000) return "Thành tích/chứng chỉ không được vượt quá 2000 ký tự.";

    if (experienceYears.trim() === "") return "Vui lòng nhập số năm kinh nghiệm.";
    const exp = Number(experienceYears);
    if (Number.isNaN(exp) || exp < 0) return "Số năm kinh nghiệm phải là số không âm.";

    if (hourlyRate.trim() === "") return "Vui lòng nhập giá theo giờ.";
    const rate = Number(hourlyRate);
    if (Number.isNaN(rate) || rate < 0) return "Giá theo giờ phải là số không âm.";

    if (selectedSportIds.length === 0) return "Vui lòng chọn ít nhất một môn thể thao.";

    return null;
  }

  const isSuspended = profile?.status === "SUSPENDED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) return;

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);

    const token = getStoredToken();
    setSubmitting(true);
    try {
      if (mode === "apply") {
        setSubmitStage("applying");
        const body: CoachApplyRequest = {
          displayName: displayName.trim() || undefined,
          bio: bio.trim() || undefined,
          experienceYears: Number(experienceYears),
          hourlyRate: Number(hourlyRate),
          city: city.trim(),
          district: district.trim(),
          achievements: achievements.trim() || undefined,
          sportIds: selectedSportIds,
        };
        const res = await apiFetch<ApiResponse<CoachProfileMeResponse>>("/coaches/apply", {
          method: "POST",
          token,
          body: JSON.stringify(body),
        });

        if (!res.success) {
          toast.error(res.message || "Đăng ký thất bại.");
          return;
        }

        // Application created — now flush the queued files (proofs,
        // verification documents, portfolio images) against the profile
        // that just started existing. Uploads run in parallel; a failure in
        // one group doesn't block the others or lose the selection (the
        // corresponding selectedXFiles array is only cleared on success, so
        // the user can retry from the now-visible profile-mode uploader).
        const hasQueuedFiles =
          selectedFiles.length > 0 ||
          selectedDocFiles.length > 0 ||
          selectedPortfolioFiles.length > 0;

        const failedGroups: string[] = [];

        if (hasQueuedFiles) {
          setSubmitStage("uploading");
          const [proofResult, docResult, portfolioResult] = await Promise.all([
            uploadQueuedProofs(token),
            uploadQueuedDocuments(token),
            uploadQueuedPortfolio(token),
          ]);
          if (!proofResult.ok) failedGroups.push("ảnh minh chứng");
          if (!docResult.ok) failedGroups.push("tài liệu xác minh");
          if (!portfolioResult.ok) failedGroups.push("ảnh portfolio");
        }

        await fetchMe();

        if (failedGroups.length === 0) {
          toast.success(
            hasQueuedFiles
              ? "Hồ sơ và tệp đính kèm đã được gửi."
              : "Đăng ký huấn luyện viên thành công. Hồ sơ đang chờ admin duyệt."
          );
        }
        setSuccessMeta({ hasQueuedFiles, failedGroups });
        setSuccessStatus(res.data?.status ?? "PENDING_APPROVAL");
      } else if (mode === "profile") {
        const body: CoachUpdateMyProfileRequest = {
          displayName: displayName.trim(),
          bio: bio.trim(),
          experienceYears: Number(experienceYears),
          hourlyRate: Number(hourlyRate),
          city: city.trim(),
          district: district.trim(),
          achievements: achievements.trim(),
          sportIds: selectedSportIds,
        };
        const res = await apiFetch<ApiResponse<CoachProfileMeResponse>>("/coaches/me", {
          method: "PUT",
          token,
          body: JSON.stringify(body),
        });
        if (res.success) {
          toast.success("Cập nhật hồ sơ huấn luyện viên thành công.");
          await fetchMe();
          setSuccessMeta(null);
          setSuccessStatus(res.data?.status ?? profile?.status ?? "PENDING_APPROVAL");
        } else {
          toast.error(res.message || "Cập nhật thất bại.");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi. Vui lòng thử lại.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
      setSubmitStage(null);
    }
  };

  // ── Proof upload/delete ──────────────────────────────────────────────────

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file after removing it
    if (chosen.length === 0) return;

    const totalAfter = proofs.length + selectedFiles.length + chosen.length;
    if (totalAfter > MAX_PROOFS) {
      const remaining = MAX_PROOFS - proofs.length - selectedFiles.length;
      toast.error(
        remaining > 0
          ? `Chỉ có thể chọn thêm tối đa ${remaining} ảnh (giới hạn ${MAX_PROOFS} ảnh minh chứng).`
          : `Bạn đã đạt giới hạn ${MAX_PROOFS} ảnh minh chứng.`
      );
      return;
    }

    const oversized = chosen.find((file) => file.size > MAX_PROOF_SIZE_BYTES);
    if (oversized) {
      toast.error(`Tệp "${oversized.name}" vượt quá giới hạn 5MB.`);
      return;
    }

    const invalidType = chosen.find((file) => !ALLOWED_PROOF_MIME_TYPES.includes(file.type));
    if (invalidType) {
      toast.error(`Tệp "${invalidType.name}" không đúng định dạng. Chỉ chấp nhận JPG, PNG, WEBP.`);
      return;
    }

    setSelectedFiles((prev) => [...prev, ...chosen]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Uploads whatever is currently queued in selectedFiles. Used both by the
  // standalone "Tải lên" button (profile mode) and by the apply-mode submit
  // flow, which needs the outcome without a fetchMe()/toast per file group.
  const uploadQueuedProofs = useCallback(
    async (token: string | null): Promise<{ ok: boolean; message?: string }> => {
      if (selectedFiles.length === 0) return { ok: true };

      setProofError(null);
      setUploadingProofs(true);
      try {
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("Files", file));
        formData.append("ProofType", selectedProofType);

        const res = await apiUpload<ApiResponse<CoachProofResponse[]>>(
          "/coaches/me/proofs",
          formData,
          { token }
        );

        if (res.success) {
          setSelectedFiles([]);
          return { ok: true };
        }
        const message = res.message || "Tải lên ảnh minh chứng thất bại.";
        setProofError(message);
        return { ok: false, message };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Không thể tải lên ảnh minh chứng.";
        setProofError(message);
        return { ok: false, message };
      } finally {
        setUploadingProofs(false);
      }
    },
    [selectedFiles, selectedProofType]
  );

  const handleUploadProofs = async () => {
    if (selectedFiles.length === 0) return;
    const token = getStoredToken();
    const result = await uploadQueuedProofs(token);
    if (result.ok) {
      toast.success("Tải lên ảnh minh chứng thành công.");
      await fetchMe();
    } else {
      toast.error(result.message || "Tải lên ảnh minh chứng thất bại.");
    }
  };

  const handleDeleteProof = async (proofId: string) => {
    const token = getStoredToken();
    setDeletingProofId(proofId);
    try {
      const res = await apiFetch<ApiResponse<unknown>>(`/coaches/me/proofs/${proofId}`, {
        method: "DELETE",
        token,
      });
      if (res.success) {
        toast.success("Đã xoá ảnh minh chứng.");
        await fetchMe();
      } else {
        toast.error(res.message || "Không thể xoá ảnh minh chứng.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể xoá ảnh minh chứng.";
      toast.error(message);
    } finally {
      setDeletingProofId(null);
    }
  };

  // ── Verification document upload/delete ─────────────────────────────────

  const handleDocFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file after removing it
    if (chosen.length === 0) return;

    const totalAfter = verificationDocuments.length + selectedDocFiles.length + chosen.length;
    if (totalAfter > MAX_VERIFICATION_DOCUMENTS) {
      const remaining = MAX_VERIFICATION_DOCUMENTS - verificationDocuments.length - selectedDocFiles.length;
      toast.error(
        remaining > 0
          ? `Chỉ có thể chọn thêm tối đa ${remaining} tài liệu (giới hạn ${MAX_VERIFICATION_DOCUMENTS} tài liệu xác minh).`
          : `Bạn đã đạt giới hạn ${MAX_VERIFICATION_DOCUMENTS} tài liệu xác minh.`
      );
      return;
    }

    const oversized = chosen.find((file) => file.size > MAX_DOCUMENT_SIZE_BYTES);
    if (oversized) {
      toast.error(`Tệp "${oversized.name}" vượt quá giới hạn 5MB.`);
      return;
    }

    const invalidType = chosen.find((file) => !ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type));
    if (invalidType) {
      toast.error(`Tệp "${invalidType.name}" không đúng định dạng. Chỉ chấp nhận PDF, JPG, PNG, WEBP.`);
      return;
    }

    setSelectedDocFiles((prev) => [...prev, ...chosen]);
  };

  const removeSelectedDocFile = (index: number) => {
    setSelectedDocFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadQueuedDocuments = useCallback(
    async (token: string | null): Promise<{ ok: boolean; message?: string }> => {
      if (selectedDocFiles.length === 0) return { ok: true };

      setDocumentError(null);
      setUploadingDocuments(true);
      try {
        const formData = new FormData();
        selectedDocFiles.forEach((file) => formData.append("Files", file));
        formData.append("DocumentType", selectedDocumentType);

        const res = await apiUpload<ApiResponse<CoachVerificationDocumentResponse[]>>(
          "/coaches/me/verification-documents",
          formData,
          { token }
        );

        if (res.success) {
          setSelectedDocFiles([]);
          return { ok: true };
        }
        const message = res.message || "Tải lên tài liệu xác minh thất bại.";
        setDocumentError(message);
        return { ok: false, message };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Không thể tải lên tài liệu xác minh.";
        setDocumentError(message);
        return { ok: false, message };
      } finally {
        setUploadingDocuments(false);
      }
    },
    [selectedDocFiles, selectedDocumentType]
  );

  const handleUploadDocuments = async () => {
    if (selectedDocFiles.length === 0) return;
    const token = getStoredToken();
    const result = await uploadQueuedDocuments(token);
    if (result.ok) {
      toast.success("Tải lên tài liệu xác minh thành công.");
      await fetchMe();
    } else {
      toast.error(result.message || "Tải lên tài liệu xác minh thất bại.");
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    const token = getStoredToken();
    setDeletingDocumentId(documentId);
    try {
      const res = await apiFetch<ApiResponse<unknown>>(
        `/coaches/me/verification-documents/${documentId}`,
        { method: "DELETE", token }
      );
      if (res.success) {
        toast.success("Đã xoá tài liệu xác minh.");
        await fetchMe();
      } else {
        toast.error(res.message || "Không thể xoá tài liệu xác minh.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể xoá tài liệu xác minh.";
      toast.error(message);
    } finally {
      setDeletingDocumentId(null);
    }
  };

  // ── Portfolio image upload/delete ────────────────────────────────────────

  const handlePortfolioFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file after removing it
    if (chosen.length === 0) return;

    const totalAfter = portfolioImages.length + selectedPortfolioFiles.length + chosen.length;
    if (totalAfter > MAX_PORTFOLIO_IMAGES) {
      const remaining = MAX_PORTFOLIO_IMAGES - portfolioImages.length - selectedPortfolioFiles.length;
      toast.error(
        remaining > 0
          ? `Chỉ có thể chọn thêm tối đa ${remaining} ảnh (giới hạn ${MAX_PORTFOLIO_IMAGES} ảnh portfolio).`
          : `Bạn đã đạt giới hạn ${MAX_PORTFOLIO_IMAGES} ảnh portfolio.`
      );
      return;
    }

    const oversized = chosen.find((file) => file.size > MAX_PORTFOLIO_IMAGE_SIZE_BYTES);
    if (oversized) {
      toast.error(`Tệp "${oversized.name}" vượt quá giới hạn 5MB.`);
      return;
    }

    const invalidType = chosen.find((file) => !ALLOWED_PORTFOLIO_MIME_TYPES.includes(file.type));
    if (invalidType) {
      toast.error(`Tệp "${invalidType.name}" không đúng định dạng. Chỉ chấp nhận JPG, PNG, WEBP.`);
      return;
    }

    setSelectedPortfolioFiles((prev) => [...prev, ...chosen]);
  };

  const removeSelectedPortfolioFile = (index: number) => {
    setSelectedPortfolioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadQueuedPortfolio = useCallback(
    async (token: string | null): Promise<{ ok: boolean; message?: string }> => {
      if (selectedPortfolioFiles.length === 0) return { ok: true };

      setPortfolioError(null);
      setUploadingPortfolio(true);
      try {
        const formData = new FormData();
        selectedPortfolioFiles.forEach((file) => formData.append("Files", file));
        if (portfolioCaption.trim()) {
          formData.append("Caption", portfolioCaption.trim());
        }

        const res = await apiUpload<ApiResponse<CoachPortfolioImageResponse[]>>(
          "/coaches/me/portfolio-images",
          formData,
          { token }
        );

        if (res.success) {
          setSelectedPortfolioFiles([]);
          setPortfolioCaption("");
          return { ok: true };
        }
        const message = res.message || "Tải lên ảnh portfolio thất bại.";
        setPortfolioError(message);
        return { ok: false, message };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Không thể tải lên ảnh portfolio.";
        setPortfolioError(message);
        return { ok: false, message };
      } finally {
        setUploadingPortfolio(false);
      }
    },
    [selectedPortfolioFiles, portfolioCaption]
  );

  const handleUploadPortfolioImages = async () => {
    if (selectedPortfolioFiles.length === 0) return;
    const token = getStoredToken();
    const result = await uploadQueuedPortfolio(token);
    if (result.ok) {
      toast.success("Tải lên ảnh portfolio thành công.");
      await fetchMe();
    } else {
      toast.error(result.message || "Tải lên ảnh portfolio thất bại.");
    }
  };

  const handleDeletePortfolioImage = async (imageId: string) => {
    const token = getStoredToken();
    setDeletingPortfolioImageId(imageId);
    try {
      const res = await apiFetch<ApiResponse<unknown>>(
        `/coaches/me/portfolio-images/${imageId}`,
        { method: "DELETE", token }
      );
      if (res.success) {
        toast.success("Đã xoá ảnh portfolio.");
        await fetchMe();
      } else {
        toast.error(res.message || "Không thể xoá ảnh portfolio.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể xoá ảnh portfolio.";
      toast.error(message);
    } finally {
      setDeletingPortfolioImageId(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (mode === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" aria-label="Đang tải" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (mode === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-400" aria-hidden />
        <p className="text-sm text-red-400">{pageError}</p>
        <Button
          type="button"
          onClick={() => {
            setMode("loading");
            fetchMe();
          }}
          className="mt-6 bg-[#FF8000] text-white hover:bg-[#FF8000]/90"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const status = profile?.status;
  const statusMeta = status ? STATUS_META[status] : null;
  const StatusIcon = statusMeta?.icon;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/coach"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50 rounded"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Quay lại danh sách huấn luyện viên
      </Link>

      {/* ── Header (always first, including on mobile) ── */}
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          {mode === "apply" ? "Đăng ký làm Huấn luyện viên" : "Hồ sơ Huấn luyện viên của tôi"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
          {mode === "apply"
            ? "Điền thông tin bên dưới để gửi hồ sơ ứng tuyển. Đội ngũ MatchOps sẽ xét duyệt trước khi hồ sơ hiển thị công khai."
            : "Xem trạng thái và cập nhật thông tin hồ sơ huấn luyện viên của bạn."}
        </p>
      </div>

      {/* ── Two-column layout: media panel (left) + form (right) ── */}
      <div className="grid gap-8 lg:grid-cols-[420px_1fr] xl:grid-cols-[460px_1fr]">
        {/* Media/trust panel — DOM order 2nd (after header), so mobile stacks
            header → media → form naturally without needing order utilities. */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CoachMediaPanel />
        </div>

        {/* Status + form column */}
        <div className="min-w-0">
          {/* ── Status card ── */}
          {statusMeta && StatusIcon && (
            <Card className="mb-6 overflow-hidden border-white/10 bg-slate-900/50">
              <div
                className="h-px w-full bg-gradient-to-r from-transparent via-[#FF8000]/40 to-transparent"
                aria-hidden
              />
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusMeta.badgeVariant} className="gap-1.5 px-3 py-1 text-sm">
                    <StatusIcon className="h-3.5 w-3.5" aria-hidden />
                    {statusMeta.label}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {statusMeta.description}
                </p>

                {status === "REJECTED" && profile?.rejectionReason && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
                      Lý do từ chối
                    </p>
                    <p className="mt-1 text-sm text-slate-300">{profile.rejectionReason}</p>
                  </div>
                )}

                {status === "SUSPENDED" && profile?.rejectionReason && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
                      Lý do tạm khóa
                    </p>
                    <p className="mt-1 text-sm text-slate-300">{profile.rejectionReason}</p>
                  </div>
                )}

                {status === "ACTIVE" && (
                  <Link
                    href="/coach"
                    className="mt-4 inline-flex items-center gap-1.5 rounded text-xs font-medium text-[#86D232] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86D232]/50"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Xem trang Huấn luyện viên công khai
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Suspended: no editing ── */}
          {isSuspended ? (
            <Card className="border-white/10 bg-slate-900/50">
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
                  <Lock className="h-6 w-6 text-slate-500" aria-hidden />
                </span>
                <p className="max-w-md text-sm text-slate-400">
                  Hồ sơ của bạn hiện không thể chỉnh sửa. Vui lòng liên hệ đội ngũ hỗ trợ
                  MatchOps nếu bạn cần hỗ trợ thêm.
                </p>
                {proofs.length > 0 && (
                  <div className="mt-4 w-full text-left">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Ảnh minh chứng đã tải lên
                    </p>
                    <ProofGallery
                      proofs={proofs}
                      readOnly
                      deletingProofId={null}
                      onDelete={() => {}}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <Card className="overflow-hidden border-white/10 bg-slate-900/50 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div
                  className="h-px w-full bg-gradient-to-r from-transparent via-[#FF8000]/40 to-transparent"
                  aria-hidden
                />
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">Thông tin hồ sơ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Basic info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <User className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                      Thông tin cơ bản
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="coach-display-name" className="text-white">
                          Tên hiển thị
                        </Label>
                        <Input
                          id="coach-display-name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="VD: HLV Nguyễn Văn A"
                          maxLength={200}
                          className="border-white/10 bg-slate-900"
                        />
                        <p className="text-xs text-slate-500">
                          Không bắt buộc — mặc định sẽ dùng tên tài khoản của bạn.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coach-experience" className="text-white">
                          Số năm kinh nghiệm <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="coach-experience"
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(e.target.value)}
                          placeholder="VD: 3"
                          className="border-white/10 bg-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coach-bio" className="text-white">
                        Giới thiệu
                      </Label>
                      <textarea
                        id="coach-bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Giới thiệu ngắn về kinh nghiệm huấn luyện, thành tích, phong cách giảng dạy..."
                        maxLength={2000}
                        rows={4}
                        className="flex w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white ring-offset-[#030303] placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] focus-visible:border-[rgba(255,128,0,0.5)] transition-colors resize-y"
                      />
                      <p className="text-right text-xs text-slate-600">{bio.length}/2000</p>
                    </div>
                  </div>

                  {/* Contact summary — read-only, sourced from the account, not editable here */}
                  <div className="space-y-4 border-t border-white/[0.06] pt-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Mail className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                      Thông tin liên hệ
                    </div>

                    {mode === "profile" && profile ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                          <p className="text-xs text-slate-500">Email tài khoản</p>
                          <p className="mt-1 truncate text-sm text-white">{profile.email}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                          <p className="text-xs text-slate-500">Số điện thoại tài khoản</p>
                          <p className="mt-1 text-sm text-white">
                            {profile.phoneNumber ?? "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Sau khi gửi hồ sơ, admin sẽ sử dụng thông tin liên hệ trong tài khoản của
                        bạn để xác minh nếu cần.
                      </p>
                    )}

                    <p className="text-xs leading-relaxed text-slate-500">
                      Thông tin liên hệ được lấy từ hồ sơ tài khoản và chỉ dùng cho quá trình xét
                      duyệt.
                    </p>

                    <Link
                      href="/profile"
                      className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-[#86D232] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86D232]/50"
                    >
                      <Settings2 className="h-3.5 w-3.5" aria-hidden />
                      Cập nhật thông tin liên hệ
                    </Link>
                  </div>

                  {/* Location */}
                  <div className="space-y-4 border-t border-white/[0.06] pt-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                      Khu vực hoạt động
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="coach-city" className="text-white">
                          Tỉnh/thành phố <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="coach-city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="VD: TP. Hồ Chí Minh"
                          maxLength={100}
                          className="border-white/10 bg-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coach-district" className="text-white">
                          Quận/huyện <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="coach-district"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="VD: Quận 7"
                          maxLength={100}
                          className="border-white/10 bg-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-4 border-t border-white/[0.06] pt-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Wallet className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                      Mức giá
                    </div>
                    <div className="space-y-2 sm:max-w-xs">
                      <Label htmlFor="coach-rate" className="text-white">
                        Giá theo giờ (VNĐ) <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="coach-rate"
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="VD: 200000"
                        className="border-white/10 bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="space-y-4 border-t border-white/[0.06] pt-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Award className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                      Thành tích & chứng chỉ
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coach-achievements" className="text-white">
                        Mô tả thành tích, chứng chỉ (không bắt buộc)
                      </Label>
                      <textarea
                        id="coach-achievements"
                        value={achievements}
                        onChange={(e) => setAchievements(e.target.value)}
                        placeholder="VD: Chứng chỉ HLV cấp 2, kinh nghiệm đào tạo người mới, từng tham gia giải đấu phong trào..."
                        maxLength={2000}
                        rows={4}
                        className="flex w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white ring-offset-[#030303] placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] focus-visible:border-[rgba(255,128,0,0.5)] transition-colors resize-y"
                      />
                      <p className="text-right text-xs text-slate-600">
                        {achievements.length}/2000
                      </p>
                      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-amber-400/90">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        Không nhập số CCCD/CMND/Hộ chiếu hoặc thông tin định danh nhạy cảm.
                      </p>
                    </div>
                  </div>

                  {/* Sports */}
                  <div className="space-y-4 border-t border-white/[0.06] pt-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Dumbbell className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                      Môn thể thao giảng dạy
                    </div>
                    <span className="sr-only" id="coach-sports-label">
                      Chọn ít nhất một môn thể thao
                    </span>
                    {sports.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Chưa có môn thể thao nào khả dụng. Vui lòng thử lại sau.
                      </p>
                    ) : (
                      <div
                        role="group"
                        aria-labelledby="coach-sports-label"
                        className="flex flex-wrap gap-2"
                      >
                        {sports.map((sport) => (
                          <SportToggle
                            key={sport.id}
                            sport={sport}
                            selected={selectedSportIds.includes(sport.id)}
                            onToggle={() => toggleSport(sport.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Proofs — admin-review only (orange accent) */}
                  <div className="space-y-4 border-t border-white/[0.06] pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <ImageIcon className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                        Ảnh minh chứng
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {mode === "apply"
                          ? `Đã chọn ${selectedFiles.length}/${MAX_PROOFS} ảnh`
                          : `Đã tải ${proofs.length}/${MAX_PROOFS} ảnh minh chứng`}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-400">
                      {mode === "apply"
                        ? "Chọn ảnh minh chứng để gửi kèm hồ sơ. Ảnh này chỉ dùng cho đội ngũ MatchOps xét duyệt."
                        : "Ảnh minh chứng (chứng chỉ, thành tích...) giúp đội ngũ MatchOps đánh giá hồ sơ của bạn."}
                    </p>

                    {/* Privacy copy */}
                    <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-500">
                      <p className="flex items-start gap-1.5">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#86D232]" aria-hidden />
                        Ảnh minh chứng chỉ dùng để đội ngũ MatchOps xét duyệt, không hiển thị
                        công khai.
                      </p>
                      <p className="flex items-start gap-1.5">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
                        Không tải lên CCCD/CMND/Hộ chiếu hoặc giấy tờ tùy thân.
                      </p>
                    </div>

                    <ProofGallery
                      proofs={proofs}
                      readOnly={false}
                      deletingProofId={deletingProofId}
                      onDelete={handleDeleteProof}
                    />

                    <div className="space-y-3 rounded-xl border border-dashed border-white/[0.12] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="coach-proof-files" className="text-white">
                            Chọn ảnh minh chứng
                          </Label>
                          <input
                            id="coach-proof-files"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleFilesSelected}
                            disabled={
                              proofs.length + selectedFiles.length >= MAX_PROOFS || submitting
                            }
                            className={cn(
                              "block w-full text-sm text-slate-400",
                              "file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2",
                              "file:text-sm file:font-medium file:text-white hover:file:bg-slate-700",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]",
                              "disabled:cursor-not-allowed disabled:opacity-50",
                            )}
                          />
                          <p className="text-xs text-slate-500">
                            JPG, PNG hoặc WEBP — tối đa 5MB mỗi ảnh.
                          </p>
                        </div>
                        <div className="space-y-2 sm:w-52">
                          <Label htmlFor="coach-proof-type" className="text-white">
                            Loại minh chứng
                          </Label>
                          <Select
                            value={selectedProofType}
                            onValueChange={(v) => setSelectedProofType(v as CoachProofType)}
                          >
                            <SelectTrigger
                              id="coach-proof-type"
                              className="border-white/10 bg-slate-900 text-white"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-slate-900 text-white">
                              {(Object.keys(PROOF_TYPE_LABELS) as CoachProofType[]).map(
                                (type) => (
                                  <SelectItem key={type} value={type}>
                                    {PROOF_TYPE_LABELS[type]}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {selectedFiles.length > 0 && (
                        <>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {selectedFiles.map((file, index) => (
                              <div
                                key={`${file.name}-${index}`}
                                className="group relative overflow-hidden rounded-xl border border-[#FF8000]/30 bg-slate-950"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={selectedPreviews[index]}
                                  alt={`Ảnh minh chứng đã chọn: ${file.name}`}
                                  className="h-28 w-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSelectedFile(index)}
                                  disabled={submitting}
                                  aria-label={`Bỏ chọn ảnh ${file.name}`}
                                  className={cn(
                                    "absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full",
                                    "bg-slate-950/80 text-slate-300 backdrop-blur-sm transition-colors",
                                    "hover:bg-red-500/80 hover:text-white",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
                                    "disabled:cursor-not-allowed disabled:opacity-50",
                                  )}
                                >
                                  <X className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500">
                            {mode === "apply"
                              ? `${selectedFiles.length} ảnh đã chọn — sẽ tự động tải lên sau khi gửi hồ sơ.`
                              : `${selectedFiles.length} ảnh đã chọn, chưa tải lên.`}
                          </p>
                        </>
                      )}

                      {proofError && (
                        <div
                          role="alert"
                          className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                          {proofError}
                        </div>
                      )}

                      {mode !== "apply" && (
                        <Button
                          type="button"
                          onClick={handleUploadProofs}
                          disabled={selectedFiles.length === 0 || uploadingProofs}
                          className="w-full bg-slate-800 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          {uploadingProofs ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                              Đang tải lên...
                            </>
                          ) : (
                            `Tải lên${selectedFiles.length > 0 ? ` ${selectedFiles.length} ảnh` : ""}`
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Verification documents — formal admin review materials, kept
                      distinct from the visual proof gallery above. */}
                  <div className="space-y-4 border-t border-white/[0.06] pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <FileText className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                        Tài liệu xác minh
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {mode === "apply"
                          ? `Đã chọn ${selectedDocFiles.length}/${MAX_VERIFICATION_DOCUMENTS} tài liệu`
                          : `Đã tải ${verificationDocuments.length}/${MAX_VERIFICATION_DOCUMENTS} tài liệu`}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-400">
                      {mode === "apply"
                        ? "Chọn tài liệu xác minh để gửi kèm hồ sơ. Tài liệu này chỉ dùng cho đội ngũ MatchOps xét duyệt."
                        : "Tải lên chứng chỉ, giấy xác nhận hoặc tài liệu chuyên môn giúp admin đánh giá hồ sơ của bạn chính xác hơn."}
                    </p>

                    {/* Privacy copy */}
                    <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-500">
                      <p className="flex items-start gap-1.5">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#86D232]" aria-hidden />
                        Tài liệu chỉ dùng để đội ngũ MatchOps xét duyệt, không hiển thị công khai.
                      </p>
                      <p className="flex items-start gap-1.5">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
                        Không tải lên CCCD/CMND/Hộ chiếu hoặc giấy tờ định danh cá nhân trong
                        phiên bản này.
                      </p>
                    </div>

                    <VerificationDocumentGallery
                      documents={verificationDocuments}
                      deletingDocumentId={deletingDocumentId}
                      onDelete={handleDeleteDocument}
                    />

                    <div className="space-y-3 rounded-xl border border-dashed border-white/[0.12] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="coach-document-files" className="text-white">
                            Chọn tài liệu xác minh
                          </Label>
                          <input
                            id="coach-document-files"
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleDocFilesSelected}
                            disabled={
                              verificationDocuments.length + selectedDocFiles.length >=
                                MAX_VERIFICATION_DOCUMENTS || submitting
                            }
                            className={cn(
                              "block w-full text-sm text-slate-400",
                              "file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2",
                              "file:text-sm file:font-medium file:text-white hover:file:bg-slate-700",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]",
                              "disabled:cursor-not-allowed disabled:opacity-50",
                            )}
                          />
                          <p className="text-xs text-slate-500">
                            PDF, JPG, PNG hoặc WEBP — tối đa 5MB mỗi tệp.
                          </p>
                        </div>
                        <div className="space-y-2 sm:w-56">
                          <Label htmlFor="coach-document-type" className="text-white">
                            Loại tài liệu
                          </Label>
                          <Select
                            value={selectedDocumentType}
                            onValueChange={(v) =>
                              setSelectedDocumentType(v as CoachVerificationDocumentType)
                            }
                          >
                            <SelectTrigger
                              id="coach-document-type"
                              className="border-white/10 bg-slate-900 text-white"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-slate-900 text-white">
                              {(
                                Object.keys(
                                  VERIFICATION_DOCUMENT_TYPE_LABELS
                                ) as CoachVerificationDocumentType[]
                              ).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {VERIFICATION_DOCUMENT_TYPE_LABELS[type]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {selectedDocFiles.length > 0 && (
                        <>
                          <div className="space-y-2">
                            {selectedDocFiles.map((file, index) => (
                              <div
                                key={`${file.name}-${index}`}
                                className="flex items-center gap-3 rounded-xl border border-[#FF8000]/30 bg-slate-950 p-3"
                              >
                                {selectedDocPreviews[index] ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={selectedDocPreviews[index]}
                                    alt={`Tài liệu đã chọn: ${file.name}`}
                                    className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover"
                                  />
                                ) : (
                                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-900">
                                    <FileText className="h-5 w-5 text-[#FF8000]" aria-hidden />
                                  </span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white">
                                    {file.name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSelectedDocFile(index)}
                                  disabled={submitting}
                                  aria-label={`Bỏ chọn tệp ${file.name}`}
                                  className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                    "text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
                                    "disabled:cursor-not-allowed disabled:opacity-50",
                                  )}
                                >
                                  <X className="h-4 w-4" aria-hidden />
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500">
                            {mode === "apply"
                              ? `${selectedDocFiles.length} tệp đã chọn — sẽ tự động tải lên sau khi gửi hồ sơ.`
                              : `${selectedDocFiles.length} tệp đã chọn, chưa tải lên.`}
                          </p>
                        </>
                      )}

                      {documentError && (
                        <div
                          role="alert"
                          className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                          {documentError}
                        </div>
                      )}

                      {mode !== "apply" && (
                        <Button
                          type="button"
                          onClick={handleUploadDocuments}
                          disabled={selectedDocFiles.length === 0 || uploadingDocuments}
                          className="w-full bg-slate-800 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          {uploadingDocuments ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                              Đang tải lên...
                            </>
                          ) : (
                            `Tải lên${selectedDocFiles.length > 0 ? ` ${selectedDocFiles.length} tệp` : ""}`
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Public portfolio images — coach-curated public gallery, visually
                      distinct (green accents) from the two orange admin-review
                      sections above so it reads as "this goes public" at a glance. */}
                  <div className="space-y-4 rounded-2xl border border-[#86D232]/15 bg-[#86D232]/[0.03] p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#86D232]">
                        <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                        Ảnh portfolio công khai
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {mode === "apply"
                          ? `Đã chọn ${selectedPortfolioFiles.length}/${MAX_PORTFOLIO_IMAGES} ảnh`
                          : `Đã tải ${portfolioImages.length}/${MAX_PORTFOLIO_IMAGES} ảnh`}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-400">
                      {mode === "apply"
                        ? "Chọn ảnh portfolio công khai để hiển thị trên hồ sơ sau khi được duyệt."
                        : "Tải lên ảnh hoạt động huấn luyện hoặc thành tích bạn muốn hiển thị trên hồ sơ công khai."}
                    </p>

                    {/* Privacy copy */}
                    <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-500">
                      <p className="flex items-start gap-1.5">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#86D232]" aria-hidden />
                        Ảnh này sẽ hiển thị công khai trên trang Huấn luyện viên khi hồ sơ được
                        duyệt.
                      </p>
                      <p className="flex items-start gap-1.5">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
                        Chỉ tải lên hình ảnh bạn có quyền chia sẻ công khai. Không tải lên giấy
                        tờ định danh cá nhân.
                      </p>
                    </div>

                    <PortfolioImageGallery
                      images={portfolioImages}
                      deletingImageId={deletingPortfolioImageId}
                      onDelete={handleDeletePortfolioImage}
                    />

                    <div className="space-y-3 rounded-xl border border-dashed border-[#86D232]/25 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="coach-portfolio-files" className="text-white">
                            Chọn ảnh portfolio
                          </Label>
                          <input
                            id="coach-portfolio-files"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handlePortfolioFilesSelected}
                            disabled={
                              portfolioImages.length + selectedPortfolioFiles.length >=
                                MAX_PORTFOLIO_IMAGES || submitting
                            }
                            className={cn(
                              "block w-full text-sm text-slate-400",
                              "file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2",
                              "file:text-sm file:font-medium file:text-white hover:file:bg-slate-700",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86D232]",
                              "disabled:cursor-not-allowed disabled:opacity-50",
                            )}
                          />
                          <p className="text-xs text-slate-500">
                            JPG, PNG hoặc WEBP — tối đa 5MB mỗi ảnh.
                          </p>
                        </div>
                        <div className="space-y-2 sm:w-56">
                          <Label htmlFor="coach-portfolio-caption" className="text-white">
                            Chú thích (không bắt buộc)
                          </Label>
                          <Input
                            id="coach-portfolio-caption"
                            value={portfolioCaption}
                            onChange={(e) => setPortfolioCaption(e.target.value)}
                            placeholder="VD: Buổi tập cùng học viên"
                            maxLength={300}
                            className="border-white/10 bg-slate-900"
                          />
                        </div>
                      </div>

                      {selectedPortfolioFiles.length > 0 && (
                        <>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {selectedPortfolioFiles.map((file, index) => (
                              <div
                                key={`${file.name}-${index}`}
                                className="group relative overflow-hidden rounded-xl border border-[#86D232]/40 bg-slate-950"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={selectedPortfolioPreviews[index]}
                                  alt={`Ảnh portfolio đã chọn: ${file.name}`}
                                  className="h-28 w-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSelectedPortfolioFile(index)}
                                  disabled={submitting}
                                  aria-label={`Bỏ chọn ảnh ${file.name}`}
                                  className={cn(
                                    "absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full",
                                    "bg-slate-950/80 text-slate-300 backdrop-blur-sm transition-colors",
                                    "hover:bg-red-500/80 hover:text-white",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
                                    "disabled:cursor-not-allowed disabled:opacity-50",
                                  )}
                                >
                                  <X className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500">
                            {mode === "apply"
                              ? `${selectedPortfolioFiles.length} ảnh đã chọn — sẽ tự động tải lên sau khi gửi hồ sơ.`
                              : `${selectedPortfolioFiles.length} ảnh đã chọn, chưa tải lên.`}
                          </p>
                        </>
                      )}

                      {portfolioError && (
                        <div
                          role="alert"
                          className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                          {portfolioError}
                        </div>
                      )}

                      {mode !== "apply" && (
                        <Button
                          type="button"
                          onClick={handleUploadPortfolioImages}
                          disabled={selectedPortfolioFiles.length === 0 || uploadingPortfolio}
                          className="w-full bg-[#86D232] text-[#0A0A0A] hover:bg-[#86D232]/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          {uploadingPortfolio ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                              Đang tải lên...
                            </>
                          ) : (
                            `Tải lên${selectedPortfolioFiles.length > 0 ? ` ${selectedPortfolioFiles.length} ảnh` : ""}`
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Form-level error */}
                  {formError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {formError}
                    </div>
                  )}

                  {/* Honest note */}
                  <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-500">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF8000]" aria-hidden />
                    {mode === "apply"
                      ? "Hồ sơ sẽ không được duyệt tự động. Đội ngũ MatchOps sẽ xem xét trước khi hồ sơ xuất hiện công khai."
                      : status === "REJECTED"
                      ? "Cập nhật hồ sơ sẽ gửi lại về trạng thái chờ duyệt."
                      : "Chức năng đặt lịch trực tiếp với huấn luyện viên chưa khả dụng — trang này chỉ quản lý hồ sơ của bạn."}
                  </div>

                  {/* Submit */}
                  <div className="border-t border-white/[0.06] pt-6">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#FF8000] py-6 text-base font-bold text-white hover:bg-[#FF8000]/90 hover:shadow-[0_0_24px_rgba(255,128,0,0.4)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          {mode === "apply"
                            ? submitStage === "uploading"
                              ? "Đang tải tệp đính kèm..."
                              : "Đang gửi hồ sơ..."
                            : "Đang gửi..."}
                        </>
                      ) : mode === "apply" ? (
                        "Gửi hồ sơ ứng tuyển"
                      ) : (
                        "Lưu thay đổi"
                      )}
                    </Button>
                    <p className="mt-3 text-xs text-slate-500">
                      Hồ sơ sẽ được xét duyệt trước khi xuất hiện công khai.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}
        </div>
      </div>

      <ApplySuccessDialog
        status={successStatus}
        meta={successMeta}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessStatus(null);
            setSuccessMeta(null);
          }
        }}
      />
    </div>
  );
}
