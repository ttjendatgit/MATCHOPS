"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Crown } from "lucide-react";
import Link from "next/link";

interface MembershipLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "match-post" | "join-request";
}

const CONTENT = {
  "match-post": {
    title: "Bạn đã đạt giới hạn gói miễn phí",
    description:
      "Gói Free cho phép tạo 3 bài ghép đối mỗi tháng. Nâng cấp Pro để tiếp tục đăng bài và mở thêm nhiều quyền lợi hơn.",
    benefits: [
      "Tạo tối đa 20 bài ghép đối mỗi tháng",
      "Không giới hạn yêu cầu tham gia",
      "Ưu tiên hiển thị bài ghép",
      "Phù hợp với người chơi thường xuyên",
    ],
  },
  "join-request": {
    title: "Bạn đã đạt giới hạn yêu cầu tham gia",
    description:
      "Gói Free cho phép gửi 5 yêu cầu tham gia mỗi tháng. Nâng cấp Pro để tiếp tục kết nối với nhiều trận đấu hơn.",
    benefits: [
      "Không giới hạn yêu cầu tham gia",
      "Dễ tìm trận phù hợp hơn",
      "Ưu tiên trong cộng đồng người chơi",
    ],
  },
} as const;

export default function MembershipLimitModal({
  open,
  onOpenChange,
  type,
}: MembershipLimitModalProps) {
  const router = useRouter();
  const content = CONTENT[type];

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A] border-[rgba(255,128,0,0.35)] text-white sm:max-w-[460px]">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#FF8000]/10 blur-3xl"
        />

        <DialogHeader className="relative gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#FF8000]/25 bg-[#FF8000]/10">
            <Crown className="h-6 w-6 text-[#FF8000]" />
          </div>
          <DialogTitle className="text-xl font-black text-white leading-snug">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm leading-relaxed">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        {/* Benefit list */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#86D232]">
            Quyền lợi khi nâng cấp Pro
          </p>
          <ul className="space-y-2.5">
            {content.benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2.5 text-sm text-slate-300"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#86D232]" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2.5 pt-1">
          <Button
            onClick={handleUpgrade}
            className="w-full min-h-[48px] bg-[#FF8000] hover:bg-[#FF8000]/90 text-white font-bold gap-2 text-[15px]"
          >
            Xem các gói nâng cấp
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full min-h-[48px] border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium"
          >
            Để sau
          </Button>
          <div className="pt-0.5 text-center">
            <Link
              href="/account/subscription"
              onClick={() => onOpenChange(false)}
              className="text-xs text-slate-500 underline-offset-4 hover:text-[#86D232] hover:underline transition-colors"
            >
              Gói của tôi
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
