export interface CoachSport {
  sportId: string;
  sportName: string;
}

export interface PublicCoachListItem {
  id: string;
  displayName: string;
  bioPreview: string | null;
  experienceYears: number | null;
  hourlyRate: number | null;
  city: string;
  district: string;
  approvedAt: string | null;
  createdAt: string;
  sports: CoachSport[];
}

export interface PublicCoachDetail {
  id: string;
  displayName: string;
  bio: string | null;
  experienceYears: number | null;
  hourlyRate: number | null;
  city: string;
  district: string;
  approvedAt: string | null;
  createdAt: string;
  sports: CoachSport[];
}

export interface PublicCoachListResponse {
  items: PublicCoachListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ─── Authenticated (own profile) ───────────────────────────────────────────

export type CoachProfileStatus = "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUSPENDED";

export interface CoachApplyRequest {
  displayName?: string;
  bio?: string;
  experienceYears: number;
  hourlyRate: number;
  city: string;
  district: string;
  achievements?: string;
  sportIds: string[];
}

export interface CoachUpdateMyProfileRequest {
  displayName?: string;
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  city?: string;
  district?: string;
  achievements?: string;
  sportIds?: string[];
}

export type CoachProofType =
  | "CERTIFICATION"
  | "ACHIEVEMENT"
  | "TRAINING_CREDENTIAL"
  | "OTHER";

export interface CoachProofResponse {
  id: string;
  imageUrl: string;
  proofType: CoachProofType | string;
  sortOrder: number;
  createdAt: string;
}

export interface CoachProfileMeResponse {
  id: string;
  displayName: string | null;
  bio: string | null;
  experienceYears: number | null;
  hourlyRate: number | null;
  city: string;
  district: string;
  achievements: string | null;
  email: string;
  phoneNumber: string | null;
  status: CoachProfileStatus;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sports: CoachSport[];
  proofs: CoachProofResponse[];
}
