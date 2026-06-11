"use client";

import { Trophy, Dumbbell, Star, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const features = [
  { icon: Star,     label: "Chứng chỉ quốc tế",  desc: "Các HLV đều có bằng cấp chuyên môn uy tín" },
  { icon: Trophy,   label: "Nâng tầm kỹ năng",   desc: "Lộ trình đào tạo bài bản cho từng cá nhân" },
  { icon: Dumbbell, label: "Đa dạng môn chơi",   desc: "Cầu lông, Tennis, Pickleball, Yoga..." },
];

export default function CoachPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-white md:text-6xl mb-6">
          Tìm <span className="bg-gradient-to-r from-[#FF8000] to-[#86D232] bg-clip-text text-transparent">Huấn luyện viên</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Kết nối với những chuyên gia hàng đầu để cải thiện kỹ thuật và đạt được mục tiêu thể thao của bạn.
        </p>
      </div>

      {/* Coming Soon Placeholder */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-12 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-[#FF8000]/5 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FF8000]/10 px-4 py-1.5 text-sm font-bold text-[#FF8000] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8000] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF8000]"></span>
            </span>
            SẮP RA MẮT
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">Tính năng đang được phát triển</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-12">
            Chúng tôi đang làm việc với các trung tâm huấn luyện hàng đầu để mang đến cho bạn những bài tập chất lượng nhất.
          </p>

          <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="p-6 rounded-2xl bg-white/5 border border-white/5 text-left">
                  <Icon className="h-8 w-8 text-[#FF8000] mb-4" />
                  <h3 className="font-bold text-white mb-2">{f.label}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 flex flex-col items-center">
            <p className="text-sm text-slate-500 mb-4">Nhận thông báo khi tính năng ra mắt</p>
            <div className="flex w-full max-w-md gap-2">
              <Input placeholder="Email của bạn" className="bg-slate-900 border-white/10 text-white" />
              <Button className="bg-[#FF8000] hover:bg-[#FF8000]/90 text-white shrink-0">
                Đăng ký ngay
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
