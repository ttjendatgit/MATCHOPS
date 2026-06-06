import { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Đăng nhập | MatchOps" };

interface LoginPageProps {
  searchParams: Promise<{ registered?: string; redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <LoginForm
      registered={params.registered === "1"}
      redirect={params.redirect}
    />
  );
}
