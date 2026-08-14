export type OwnerApplicationStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export interface OwnerApplyRequest {
  businessName: string;
  contactPhone: string;
  address: string;
  city: string;
  district: string;
  description?: string;
  businessLicenseNumber?: string;
}

export interface OwnerApplicationMe {
  id: string;
  businessName: string;
  contactPhone: string;
  address: string;
  city: string;
  district: string;
  description?: string | null;
  businessLicenseNumber?: string | null;
  status: OwnerApplicationStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOwnerApplicationListItem {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userPhone?: string | null;
  businessName: string;
  contactPhone: string;
  city: string;
  district: string;
  status: OwnerApplicationStatus;
  createdAt: string;
}

export interface AdminOwnerApplicationListResponse {
  items: AdminOwnerApplicationListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdminOwnerApplicationDetail {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userPhone?: string | null;
  userRole: string;
  businessName: string;
  contactPhone: string;
  address: string;
  city: string;
  district: string;
  description?: string | null;
  businessLicenseNumber?: string | null;
  status: OwnerApplicationStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
