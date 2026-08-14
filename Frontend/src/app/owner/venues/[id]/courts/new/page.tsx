"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Plus, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { BackLink } from "@/components/shared/BackLink";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { Sport, DayType, CreatePriceRuleRequest } from "@/types/court";
import Link from "next/link";
import OwnerMembershipLimitModal from "@/components/membership/OwnerMembershipLimitModal";

const fieldClass =
  "flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5208/api";

function isOwnerMembershipLimitError(msg: string): boolean {
  return msg.includes("Nâng cấp gói Chủ sân để tiếp tục");
}

interface PriceRuleFormData {
  dayType: DayType;
  startTime: string;
  endTime: string;
  pricePerHour: string;
}

interface CourtFormData {
  name: string;
  sportId: string;
  type: string;
  capacity: string;
  locationNote: string;
  description: string;
  images: File[];
  primaryImageIndex: number | null;
}

export default function NewCourtPage() {
  const params = useParams();
  const venueId = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [formData, setFormData] = useState<CourtFormData>({
    name: "",
    sportId: "",
    type: "",
    capacity: "",
    locationNote: "",
    description: "",
    images: [],
    primaryImageIndex: null,
  });
  const [priceRules, setPriceRules] = useState<PriceRuleFormData[]>([
    { dayType: "ALL", startTime: "06:00", endTime: "22:00", pricePerHour: "" },
  ]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [upgradeModal, setUpgradeModal] = useState(false);

  // Fetch sports list on mount
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const res = await apiFetch<ApiResponse<Sport[]>>("/sports");
        if (res.success && res.data) {
          setSports(res.data);
          if (res.data.length > 0) {
            setFormData((prev) => ({ ...prev, sportId: res.data[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch sports:", err);
      }
    };
    fetchSports();
  }, []);

  // Handle image file upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...newFiles] }));

      // Generate preview URLs
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  // Remove image from list
  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData((prev) => ({ ...prev, images: newImages }));

    const newPreviews = [...imagePreviewUrls];
    URL.revokeObjectURL(newPreviews[index]); // Clean up
    newPreviews.splice(index, 1);
    setImagePreviewUrls(newPreviews);

    if (formData.primaryImageIndex === index) {
      setFormData((prev) => ({ ...prev, primaryImageIndex: null }));
    } else if (formData.primaryImageIndex !== null && formData.primaryImageIndex > index) {
      setFormData((prev) => ({ ...prev, primaryImageIndex: prev.primaryImageIndex! - 1 }));
    }
  };

  // Set primary image
  const handleSetPrimaryImage = (index: number) => {
    setFormData((prev) => ({ ...prev, primaryImageIndex: index }));
  };

  // Update court form
  const updateForm = (field: keyof CourtFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Update price rule
  const updatePriceRule = (index: number, field: keyof PriceRuleFormData, value: any) => {
    const newRules = [...priceRules];
    newRules[index][field] = value;
    setPriceRules(newRules);
  };

  // Add new price rule
  const addPriceRule = () => {
    setPriceRules((prev) => [
      ...prev,
      { dayType: "ALL", startTime: "06:00", endTime: "22:00", pricePerHour: "" },
    ]);
  };

  // Remove price rule
  const removePriceRule = (index: number) => {
    if (priceRules.length > 1) {
      const newRules = [...priceRules];
      newRules.splice(index, 1);
      setPriceRules(newRules);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sportId || priceRules.some((r) => !r.pricePerHour)) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    // Validate each price rule
    for (let i = 0; i < priceRules.length; i++) {
      const rule = priceRules[i];
      if (rule.pricePerHour) {
        const pricePerHourNum = Number(rule.pricePerHour);
        if (pricePerHourNum <= 0) {
          toast.error(`Giá/giờ quy tắc ${i + 1} phải lớn hơn 0!`);
          return;
        }
        if (rule.startTime >= rule.endTime) {
          toast.error(`Giờ bắt đầu quy tắc ${i + 1} phải nhỏ hơn giờ kết thúc!`);
          return;
        }
      }
    }

    // Validate capacity if provided
    if (formData.capacity) {
      const capacityNum = Number(formData.capacity);
      if (isNaN(capacityNum) || capacityNum < 1) {
        toast.error("Sức chứa phải là số lớn hơn 0!");
        return;
      }
    }

    const token = getStoredToken();
    if (!token) {
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create court using multipart form data
      const courtFormData = new FormData();
      courtFormData.append("VenueId", venueId);
      courtFormData.append("SportId", formData.sportId);
      courtFormData.append("Name", formData.name);
      if (formData.type) courtFormData.append("Type", formData.type);
      if (formData.capacity) courtFormData.append("Capacity", formData.capacity);
      if (formData.locationNote) courtFormData.append("LocationNote", formData.locationNote);
      if (formData.description) courtFormData.append("Description", formData.description);

      // Upload images
      formData.images.forEach((file) => {
        courtFormData.append("Images", file);
      });

      if (formData.primaryImageIndex !== null) {
        courtFormData.append("PrimaryImageIndex", formData.primaryImageIndex.toString());
      }

      const courtRes = await fetch(`${API_BASE}/owner/courts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: courtFormData,
      });

      const courtResult = await courtRes.json().catch(() => ({}));

      if (!courtRes.ok || !courtResult.success) {
        const message: string = courtResult?.message ?? `Lỗi máy chủ: ${courtRes.status}`;
        if (isOwnerMembershipLimitError(message)) {
          setUpgradeModal(true);
        } else {
          toast.error(message);
        }
        return;
      }

      const courtId = courtResult.data.id;
      toast.success("Tạo sân thành công! Đang tạo bảng giá...");

      // 2. Create price rules for the new court
      for (const rule of priceRules) {
        if (rule.pricePerHour) {
          const priceRuleReq: CreatePriceRuleRequest = {
            courtId: courtId,
            dayType: rule.dayType,
            startTime: rule.startTime,
            endTime: rule.endTime,
            pricePerHour: Number(rule.pricePerHour),
          };

          await apiFetch("/owner/price-rules", {
            method: "POST",
            token,
            body: JSON.stringify(priceRuleReq),
          });
        }
      }

      toast.success("Tạo sân và bảng giá thành công!");
      router.push(`/owner/venues/${venueId}/courts`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đã có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <OwnerMembershipLimitModal
        open={upgradeModal}
        onOpenChange={setUpgradeModal}
        type="court"
      />

      <BackLink href={`/owner/venues/${venueId}/courts`} label="Quay lại danh sách sân" />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#C4C7C9]/50">
        <Link href={`/owner/venues/${venueId}/courts`} className="hover:text-[#FF8000] transition-colors">
          Danh sách sân
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-white">Thêm mới</span>
      </nav>

      <PageHeader title="Thêm sân mới" />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Court info */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
          <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4">
            <h3 className="text-sm font-semibold text-white">Thông tin sân</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                Tên sân <span className="text-[#FF4B4B]">*</span>
              </Label>
              <Input
                placeholder="VD: Sân A1"
                value={formData.name}
                onChange={(e) => updateForm("name", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Môn thể thao <span className="text-[#FF4B4B]">*</span>
                </Label>
                <select
                  className={fieldClass + " [color-scheme:dark]"}
                  value={formData.sportId}
                  onChange={(e) => updateForm("sportId", e.target.value)}
                  required
                >
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Loại sân
                </Label>
                <Input
                  placeholder="Sân trong, sân ngoài..."
                  value={formData.type}
                  onChange={(e) => updateForm("type", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Sức chứa
                </Label>
                <Input
                  type="number"
                  placeholder="4"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => updateForm("capacity", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Vị trí
                </Label>
                <Input
                  placeholder="Tầng 2, khu A"
                  value={formData.locationNote}
                  onChange={(e) => updateForm("locationNote", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                Mô tả
              </Label>
              <Textarea
                placeholder="Mô tả chi tiết về sân..."
                value={formData.description}
                onChange={(e) => updateForm("description", e.target.value)}
                className={fieldClass.replace("h-10", "h-24")}
              />
            </div>

            {/* Image upload section */}
            <div className="space-y-1.5">
              <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                Ảnh sân
              </Label>
              <div className="border-2 border-dashed border-[rgba(134,210,50,0.28)] rounded-xl p-4 flex flex-col gap-3">
                <Label
                  htmlFor="court-images"
                  className="cursor-pointer flex items-center justify-center gap-2 border border-[#FF8000]/30 bg-[#FF8000]/10 text-[#FF8000] rounded-lg py-2 px-4 hover:bg-[#FF8000]/20 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Chọn ảnh
                </Label>
                <input
                  id="court-images"
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageChange}
                />

                {imagePreviewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imagePreviewUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-lg overflow-hidden border-2 ${
                          formData.primaryImageIndex === idx ? "border-[#FF8000]" : "border-[rgba(134,210,50,0.28)]"
                        }`}
                      >
                        <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="p-1.5 bg-[#FF8000] text-white rounded-full hover:bg-[#FF8000]/80"
                            title="Đặt làm ảnh chính"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1.5 bg-[#FF4B4B] text-white rounded-full hover:bg-[#FF4B4B]/80"
                            title="Xóa ảnh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {formData.primaryImageIndex === idx && (
                          <div className="absolute bottom-1 left-1 bg-[#FF8000] text-white text-xs px-1.5 py-0.5 rounded">
                            Chính
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Price rules */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
          <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Quy tắc giá</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPriceRule}
              className="text-[#FF8000] border-[#FF8000]/30 hover:bg-[#FF8000]/10"
            >
              <Plus className="w-4 h-4 mr-1" /> Thêm quy tắc
            </Button>
          </div>
          <div className="p-6 space-y-4">
            {priceRules.map((rule, index) => (
              <div
                key={index}
                className="grid gap-3 sm:grid-cols-4 items-end border border-[rgba(134,210,50,0.28)] rounded-lg p-3 bg-[#0A0A0A]/50"
              >
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Loại ngày
                  </Label>
                  <select
                    className={fieldClass + " [color-scheme:dark]"}
                    value={rule.dayType}
                    onChange={(e) => updatePriceRule(index, "dayType", e.target.value as DayType)}
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="WEEKDAY">Ngày thường</option>
                    <option value="WEEKEND">Cuối tuần</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Từ giờ
                  </Label>
                  <input
                    type="time"
                    className={fieldClass + " [color-scheme:dark]"}
                    value={rule.startTime}
                    onChange={(e) => updatePriceRule(index, "startTime", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Đến giờ
                  </Label>
                  <input
                    type="time"
                    className={fieldClass + " [color-scheme:dark]"}
                    value={rule.endTime}
                    onChange={(e) => updatePriceRule(index, "endTime", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                      Giá/giờ (đ) <span className="text-[#FF4B4B]">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="80000"
                      value={rule.pricePerHour}
                      onChange={(e) => updatePriceRule(index, "pricePerHour", e.target.value)}
                      required
                    />
                  </div>
                  {priceRules.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-10 w-10 bg-[#FF4B4B]/10 text-[#FF4B4B] border border-[#FF4B4B]/30 hover:bg-[#FF4B4B]/20"
                      onClick={() => removePriceRule(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/owner/venues/${venueId}/courts`}>Huỷ</Link>
          </Button>
          <Button type="submit" disabled={loading} className="bg-[#FF8000] hover:bg-[#FF8000]/90">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...
              </>
            ) : (
              "Tạo sân"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
