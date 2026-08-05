export interface CoachSport {
  sportId: string;
  sportName: string;
}

export interface CoachPortfolioImageResponse {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
  isCover: boolean;
  createdAt: string;
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
  coverImageUrl: string | null;
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
  portfolioImages: CoachPortfolioImageResponse[];
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

export type CoachVerificationDocumentType =
  | "COACHING_CERTIFICATE"
  | "TRAINING_CERTIFICATE"
  | "SPORT_ACHIEVEMENT"
  | "CLUB_CONFIRMATION"
  | "OTHER";

export interface CoachVerificationDocumentResponse {
  id: string;
  fileUrl: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  documentType: CoachVerificationDocumentType | string;
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
  verificationDocuments: CoachVerificationDocumentResponse[];
  portfolioImages: CoachPortfolioImageResponse[];
}

// ─── Admin review ───────────────────────────────────────────────────────────

export interface AdminCoachListItem {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  displayName: string | null;
  bioPreview: string | null;
  experienceYears: number | null;
  hourlyRate: number | null;
  city: string;
  district: string;
  status: CoachProfileStatus;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sports: CoachSport[];
}

export interface AdminCoachDetail {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userPhoneNumber: string | null;
  displayName: string | null;
  bio: string | null;
  experienceYears: number | null;
  hourlyRate: number | null;
  city: string;
  district: string;
  achievements: string | null;
  status: CoachProfileStatus;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sports: CoachSport[];
  proofs: CoachProofResponse[];
  verificationDocuments: CoachVerificationDocumentResponse[];
  portfolioImages: CoachPortfolioImageResponse[];
}

export interface AdminCoachListResponse {
  items: AdminCoachListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdminCoachListFilters {
  status?: CoachProfileStatus;
  city?: string;
  district?: string;
  sportId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface RejectCoachProfileRequest {
  rejectionReason: string;
}

export interface SuspendCoachProfileRequest {
  reason?: string | null;
}
