export type VenueStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "REJECTED";

export interface Venue {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  district: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  openingTime: string;
  closingTime: string;
  coverImageUrl?: string;
  status: VenueStatus;
  createdAt: string;
  updatedAt: string;
  courts?: Court[];
}

export interface CreateVenueRequest {
  name: string;
  address: string;
  city: string;
  district: string;
  ward?: string;
  description?: string;
  openingTime: string;
  closingTime: string;
  coverImage?: File;
}

export interface UpdateVenueRequest extends Partial<CreateVenueRequest> {}

import { Court } from "./court";
