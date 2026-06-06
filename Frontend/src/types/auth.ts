export type UserRole = "USER" | "OWNER" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

/** Generic wrapper matching the backend ApiResponse<T> envelope. */
export interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/** Backend AuthResponseDto serialized to camelCase (login / me endpoints). */
export interface AuthApiData {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  emailConfirmed: boolean;
  authProvider: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  emailConfirmed: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}
