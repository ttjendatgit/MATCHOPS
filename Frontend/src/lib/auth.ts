import type { ApiWrapper, AuthApiData, User } from "@/types/auth";
import { apiFetch } from "./api";

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setAuthData(token: string, user: User): void {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuthData(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

/**
 * Calls GET /api/auth/me with the stored token to validate the session.
 * On success: refreshes localStorage with the latest user data and returns the User.
 * On failure (expired / invalid token): clears storage and returns null.
 */
export async function verifySession(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await apiFetch<ApiWrapper<AuthApiData>>("/auth/me", { token });
    if (!res.success || !res.data) {
      clearAuthData();
      return null;
    }
    const user: User = {
      id: res.data.userId,
      fullName: res.data.fullName,
      email: res.data.email,
      role: res.data.role,
      status: "ACTIVE",
      emailConfirmed: res.data.emailConfirmed,
      createdAt: new Date().toISOString(),
    };
    setAuthData(token, user);
    return user;
  } catch {
    clearAuthData();
    return null;
  }
}
