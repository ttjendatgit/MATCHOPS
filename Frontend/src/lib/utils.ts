import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy");
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm");
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatTime(time: string): string {
  return time.substring(0, 5);
}
