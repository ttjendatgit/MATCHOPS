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
