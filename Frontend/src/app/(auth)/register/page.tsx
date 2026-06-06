import { Metadata } from "next";
import { RegisterForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Đăng ký | MatchOps" };

export default function RegisterPage() {
  return <RegisterForm />;
}
