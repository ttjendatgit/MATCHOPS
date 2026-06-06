export type CourtStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type DayType = "ALL" | "WEEKDAY" | "WEEKEND";

export interface Court {
  id: string;
  venueId: string;
  sportId: string;
  name: string;
  type?: string;
  capacity?: number;
  locationNote?: string;
  description?: string;
  imageUrl?: string;
  status: CourtStatus;
  priceRules?: PriceRule[];
  createdAt: string;
  updatedAt: string;
}

export interface PriceRule {
  id: string;
  courtId: string;
  dayType: DayType;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  priority: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface Sport {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface CourtBlock {
  id: string;
  courtId: string;
  venueId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
  status: "ACTIVE" | "CANCELLED";
}
